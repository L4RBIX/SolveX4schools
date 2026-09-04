"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@schools/curriculum/types";
import type { PublicCase } from "@schools/curriculum/public";
import { isLearnerOutcome } from "@schools/execution/trust";
import { capabilityFor, surfaceForBlock } from "@schools/execution/trust-policy";
import { L, t } from "@schools/presentation/labels";
import type { LearningPayload } from "@solvex/learning-contracts";
import { useCpp17 } from "@/lib/cpp17/use-cpp17";
import { Button3D } from "../button-3d";
import {
  byteLength,
  clampStdin,
  runButtonState,
  runEventPayload,
  isNewRunEffort,
  runDownloadNote,
  runStatusNote,
  runtimeFaultNote,
  runTrustLines,
  stderrIsCompilerOutput,
  seedStdin,
  shouldRecordRun,
} from "./run-state";

/**
 * RUN — the learner's program, in the learner's browser.
 *
 * ## Why this is not a second Check
 *
 * Check is the footer's, it is one per block, and it decides. Run lives inside
 * the block beside the editor, it can be pressed thirty times, and it decides
 * nothing: it shows what the program does. The two are different actions and
 * the difference has to survive being read by a fourteen-year-old at speed, so
 * they differ in three channels at once — position (in the card vs in the
 * footer), weight (a secondary face vs the primary CTA), and a sentence that
 * says outright which one marks you.
 *
 * ## What this component is not allowed to do
 *
 * It never sees an expected output, so it can never compute a pass. That is not
 * restraint, it is arithmetic: `publicBlock()` strips hidden cases and
 * reference solutions before the block reaches the browser, and `LocalRunResult`
 * has no field a verdict could live in. The worker is handed the learner's
 * source and the learner's stdin and nothing else.
 *
 * Timeouts, the output cap and the terminate-and-replace on a runaway loop are
 * all `PythonRunner`'s, and re-implementing any of them here would mean two
 * budgets that can disagree. This file only renders what the runner decided.
 */

export interface RunPanelProps {
  blockId: string;
  blockType: string;
  /** The lesson (or assessment) this block belongs to. Decides the surface. */
  lessonId: string;
  monthIndex: number;
  /** What is in the editor right now. */
  source: string;
  visibleCases: readonly PublicCase[];
  locale: Locale;
  /** The block has been checked. The editor is frozen, so Run is too. */
  locked: boolean;
  /**
   * This block is the page on screen.
   *
   * The player mounts every page at once and never unmounts them, so without
   * this a lesson whose twelfth block holds code would start a 13 MB CPython
   * download the moment the first concept card rendered. `usePython`'s contract
   * is to preload where a coding block actually IS; here that means where the
   * learner actually is.
   */
  active: boolean;
  /**
   * Does this deployment have a judge that can produce evidence?
   *
   * The browser genuinely cannot know — `schools/config.ts` carries
   * `import "server-only"` — so this arrives as a prop, and the default claims
   * the WEAKER thing rather than the stronger one. See `SchoolLessonProps`.
   */
  trustedProviderConfigured: boolean;
  /**
   * Report that a Run happened. Never what it printed.
   *
   * The payload is built by `runEventPayload` and typed `LearningPayload`, so
   * stdout, stderr and source are compile errors rather than review comments.
   */
  onRun?: (payload: LearningPayload) => void;
  /**
   * The run's actual result — status, and the two streams verbatim.
   *
   * Separate from `onRun`, and it has to be. `onRun` carries a LEDGER payload,
   * which is deliberately scrubbed: no stdout, no stderr, nothing a learner's
   * program wrote. That is right for an event that is stored forever, and it is
   * exactly why Nova could never answer «Почему ошибка?» — the traceback the
   * learner is looking at existed only inside this component.
   *
   * This one is not stored anywhere. It is held in memory by the lesson and
   * sent with the next Nova request as UNTRUSTED current-screen state, on the
   * same footing as the draft answer. See `parseReportedRun`.
   */
  onRunResult?: (result: {
    status: string;
    stdout: string;
    stderr: string;
    truncated: boolean;
  }) => void;
}

export function RunPanel({
  blockId,
  blockType,
  lessonId,
  monthIndex,
  source,
  visibleCases,
  locale,
  locked,
  active,
  trustedProviderConfigured,
  onRun,
  onRunResult,
}: RunPanelProps) {
  /* The C++17 toolchain, not CPython. `preload: active` is what keeps 18 MB of
     compiler off the wire until a block that can actually run code is the one
     the learner is looking at — see `useCpp17`'s `preload` default, which is
     the opposite of the Python hook's for that reason. */
  const python = useCpp17({ preload: active });

  const seeded = useMemo(() => seedStdin(visibleCases), [visibleCases]);
  const [stdin, setStdin] = useState(seeded);
  /** True when the last edit was longer than the cap and was cut. */
  const [clamped, setClamped] = useState(false);
  /**
   * The source as it was when the visible result was produced.
   *
   * Kept so an edited program can say so instead of silently presenting last
   * run's output as this program's. Computed during render rather than cleared
   * from an effect — an effect would drop the output a frame after the
   * keystroke, which reads as the panel flickering.
   */
  const [ranSource, setRanSource] = useState<string | null>(null);
  /* What the last EMITTED `run_executed` was about. See `isNewRunEffort`. */
  const [lastReported, setLastReported] = useState<{ source: string; stdin: string } | null>(null);

  const surface = useMemo(
    () => surfaceForBlock({ blockType, blockId, lessonId }),
    [blockType, blockId, lessonId],
  );
  const capability = useMemo(
    () => capabilityFor(surface, trustedProviderConfigured),
    [surface, trustedProviderConfigured],
  );

  /* What the learner is waiting for, in bytes they can watch move. The button
     is disabled either way; the difference is whether they are told anything
     is happening. See `runDownloadNote`. */
  const downloadNote = runDownloadNote({
    phase: python.phase,
    loadedBytes: python.loadedBytes,
    totalBytes: python.totalBytes,
  });

  const button = runButtonState({
    phase: python.phase,
    isRunning: python.isBusy,
    locked,
    sourceBytes: byteLength(source),
    hasSource: source.trim().length > 0,
    stdin,
    source,
  });

  /* The policy's answer, honoured rather than assumed. Every surface allows a
     local Run today; if one ever stops, the button must disappear here rather
     than in a condition somebody remembers to add. */
  if (!capability.canRunLocally) return null;

  const result = python.result;
  const stale = result !== null && ranSource !== null && ranSource !== source;
  /* The one sentence the compiler could not have said itself, or none.
     `syntax_error` and `runtime_error` return null on purpose — clang's own
     diagnostic names a line and a cause, and putting «қате бар» above it
     replaces information with reassurance. */
  const statusNote = result ? runStatusNote(result.status) : null;
  /* The runtime fault's meaning, when the raw text has none. See
     `runtimeFaultNote`: `unreachable` is a wasm trap, not a diagnostic. */
  const faultNote = result ? runtimeFaultNote(result.status, result.stderr) : null;

  async function press() {
    if (button.action === "retry") {
      void python.ensureReady();
      return;
    }
    if (button.action !== "run") return;

    const outcome = await python.run({ source, stdin });

    /* Reported BEFORE the `shouldRecordRun` gate below, and unconditionally.
       That gate is about what earns a hint level and what enters the ledger; a
       run that does not count as new effort is still the thing on screen, and
       is still what a learner asking "why does this break" means. */
    onRunResult?.({
      status: outcome.status,
      stdout: outcome.stdout,
      stderr: outcome.stderr,
      truncated: outcome.truncated,
    });
    setRanSource(source);

    /* The rule lives in `run-state.ts` so a test can reach it — see
       `shouldRecordRun`. It was inline here, and deleting it left the whole
       suite green. */
    if (!shouldRecordRun(outcome.status)) return;
    /* Pressing Run again on the same program and the same input is watching the
       same result, not doing new work — and `run_executed` buys hint levels.
       See `isNewRunEffort`. */
    if (!isNewRunEffort({ source, stdin, lastReported })) return;
    setLastReported({ source, stdin });

    onRun?.(
      runEventPayload({
        lessonId,
        monthIndex,
        blockId,
        isCustomInput: stdin !== seeded,
      }),
    );
  }

  return (
    <section
      className="flex w-full flex-col gap-3 rounded-[12px] border-2 border-b-fg/10 bg-b-fg/[0.03] p-4"
      aria-label={t(L.run, locale)}
    >
      <p className="text-[14px] leading-5 text-b-fg/60">{t(L.runWhatItDoes, locale)}</p>

      <label className="flex w-full flex-col gap-1.5">
        <span className="text-[14px] leading-5 text-b-fg/60">{t(L.runInputLabel, locale)}</span>
        <textarea
          value={stdin}
          rows={Math.min(4, Math.max(1, stdin.split("\n").length))}
          spellCheck={false}
          disabled={locked}
          onChange={(e) => {
            /* The cap is `LOCAL_LIMITS.maxStdinBytes`, enforced on the way in
               rather than on the way out: a paste that would be refused by the
               runner is cut here, where the learner can see what survived. */
            const next = clampStdin(e.target.value);
            setClamped(next !== e.target.value);
            setStdin(next);
          }}
          className={cn(
            "w-full resize-y rounded-[12px] border-2 bg-[#12141a] p-3 font-b-mono text-[15px] leading-[26px] text-[#e8ecf4]",
            "placeholder:text-b-on-fill/35 focus:outline-none disabled:opacity-70",
            "transition-colors duration-100",
            locked ? "border-b-lock-edge" : "border-b-fg/15 focus:border-b-sched-edge-on",
          )}
        />
        <span className="text-[13px] leading-5 text-b-fg/40">{t(L.runInputHint, locale)}</span>
        {clamped ? (
          <span className="text-[13px] leading-5 text-b-warn-edge">
            {t(L.runInputClamped, locale)}
          </span>
        ) : null}
      </label>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button3D
          variant="secondary"
          className="w-[200px] shrink-0"
          disabled={button.disabled}
          onClick={() => void press()}
        >
          <span className="flex items-center gap-2">
            {button.action === "run" && !button.disabled ? <PlayGlyph /> : null}
            {t(button.label, locale)}
          </span>
        </Button3D>
        {/* The download, in megabytes, while it is happening. It takes the
            note's place rather than sitting beside it: during loading
            `runButtonState` has no note, and a learner on a school connection
            needs the number more than they need a second sentence. */}
        {downloadNote ? (
          <p className="min-w-0 flex-1 text-[14px] leading-5 tabular-nums text-b-fg/60">
            {t(downloadNote, locale)}
          </p>
        ) : button.note ? (
          <p className="min-w-0 flex-1 text-[14px] leading-5 text-b-fg/60">
            {t(button.note, locale)}
          </p>
        ) : null}
      </div>

      {/* The live region is always mounted, empty or not. A region inserted at
          the same moment its content appears is frequently not announced at
          all, which would make the one thing a blind learner most needs from a
          Run — what it printed — the one thing that arrives silently.

          `empty:hidden` used to be on this line and defeated the whole point:
          it compiles to `:empty { display: none }`, and a display:none element
          is not in the accessibility tree at all, so the region ENTERED the
          tree in the same commit that filled it — precisely the case the
          comment above says it exists to avoid. Mounting is not enough; it has
          to be mounted and visible-to-AT while empty. Nothing is added to the
          layout by leaving it: `gap-3` only applies between children, so a
          childless flex column occupies no height. */}
      <div className="flex flex-col gap-3" aria-live="polite">
        {result ? (
          <>
            {stale ? (
              <p className="text-[14px] leading-5 text-b-warn-edge">{t(L.runStale, locale)}</p>
            ) : null}

            {statusNote ? (
              <p className="text-[15px] leading-6 text-b-fg/80">{t(statusNote, locale)}</p>
            ) : null}

            {/* Separate panes, always in this order. A learner who cannot see
                which stream a line came from cannot tell a printed answer from
                a traceback, and half of debugging is knowing which one you are
                looking at. */}
            {result.stdout.length > 0 ? (
              <OutputPane label={t(L.runStdout, locale)} text={result.stdout} tone="out" />
            ) : isLearnerOutcome(result.status) ? (
              /* An empty pane and «ештеңе шығарған жоқ» say the same thing
                 twice, so only the sentence is shown — and only when the
                 program actually ran. A CPython download that failed printed
                 nothing because nothing executed, which is a different fact. */
              <p className="text-[14px] leading-5 text-b-fg/40">{t(L.runNoOutput, locale)}</p>
            ) : null}

            {result.stderr.length > 0 ? (
              <>
                {/* What the fault MEANT, above the raw text rather than instead
                    of it. A wasm trap arrives as the single English word
                    `unreachable` and carries no information — the same word for
                    an out-of-range `at()`, a failed assertion and an uncaught
                    exception — so a learner staring at it has nothing to read.
                    The raw text stays below because reading a real diagnostic
                    is a real skill; `unreachable` is not one. */}
                {faultNote ? (
                  <p className="text-[15px] leading-6 text-b-fg/80">{t(faultNote, locale)}</p>
                ) : null}
                <OutputPane label={t(L.runStderr, locale)} text={result.stderr} tone="err" />
                {/* And the caption tells the truth about whose words these are.
                    It used to say "the compiler's own words" for everything,
                    including a runtime trap, which is not a diagnostic and
                    cannot be read as one. */}
                <p className="text-[13px] leading-5 text-b-fg/40">
                  {t(
                    stderrIsCompilerOutput(result.status)
                      ? L.runStderrIsCompiler
                      : L.runStderrIsRuntime,
                    locale,
                  )}
                </p>
              </>
            ) : null}

            {result.truncated ? (
              <p className="text-[13px] leading-5 text-b-fg/40">{t(L.runTruncated, locale)}</p>
            ) : null}

            {/* Trust marking, attached to the RESULT rather than to the panel.
                It is a statement about where this output came from, so it
                appears when there is output to make it about. */}
            <ul className="flex flex-col gap-1 border-t-2 border-b-fg/10 pt-3">
              {runTrustLines(surface, capability).map((line, i) => (
                <li
                  key={i}
                  className={cn(
                    "text-[14px] leading-5",
                    /* The first line is a fact about the runtime; the rest are
                       the policy warning the learner what it is not worth. */
                    i === 0 ? "text-b-fg/50" : "text-b-fg/75",
                  )}
                >
                  {t(line, locale)}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}

/**
 * One stream, verbatim.
 *
 * `whitespace-pre` plus its own horizontal scroller: a long line of output must
 * scroll inside this box and never widen the lesson card. The surface is the
 * same near-black `CodePanel` uses and for the same reason — output is code's
 * material, not prose — which is why the two colours are literals here rather
 * than theme tokens that would invert into dark ink on a dark panel.
 */
function OutputPane({ label, text, tone }: { label: string; text: string; tone: "out" | "err" }) {
  return (
    <div className="w-full">
      <p className="mb-1.5 text-[14px] leading-5 text-b-fg/60">{label}</p>
      <pre
        className={cn(
          "max-h-64 w-full overflow-auto rounded-[8px] bg-[#12141a] px-3 py-2",
          "font-b-mono text-[15px] leading-[26px] whitespace-pre",
          /* Salmon rather than the product's amber. Amber already means "your
             answer is wrong" everywhere else in the player, and a traceback is
             not a verdict — it is the interpreter telling you what it hit. */
          tone === "err" ? "text-[#ff9e8a]" : "text-[#e8ecf4]",
        )}
      >
        {text.length > 0 ? text : " "}
      </pre>
    </div>
  );
}

/**
 * Drawn here rather than added to `icons.tsx`.
 *
 * That file's premise is that every path in it was copied out of the live
 * brilliant.org DOM. A triangle we drew ourselves does not belong under that
 * claim, and quietly filing it there would make the file's own comment false.
 */
function PlayGlyph() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
      <path d="M1 1.5v11l10-5.5-10-5.5Z" fill="currentColor" />
    </svg>
  );
}
