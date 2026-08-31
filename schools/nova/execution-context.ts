import { isTrustedOutcome, type ReducibleEvent } from "@solvex/learning-intelligence-core";
import {
  isLearnerOutcome,
  LOCAL_LIMITS,
  type ExecutionTrust,
  type LocalExecutionStatus,
} from "@schools/execution/trust";

/**
 * What Nova is allowed to know about where the learner's code ran.
 *
 * ## The defect this closes
 *
 * Nova was told the month, the lesson, the task and the hint ceiling, and
 * nothing at all about execution. So it could not distinguish the two most
 * common moments in a coding lesson, which are not the same conversation:
 *
 *   - "It ran in your browser and printed 17. Nothing has checked that yet."
 *   - "The checker ran it on our server and three tests did not pass."
 *
 * And it could not see the `ZeroDivisionError` the learner was looking at while
 * typing «түсінбедім». A tutor that cannot read the error on the screen is
 * guessing, and a guessing tutor asks the wrong question.
 *
 * ## The two facts are separate, and they are sourced differently
 *
 * `LocalRunEvidence` is REPORTED by the browser. It is the learner's own
 * program's own output, produced under Pyodide on a runtime they can edit in
 * DevTools. Its trust is the literal `client_local` and it is written HERE, in
 * server code, from the branch that constructed it — never copied out of the
 * request body. A browser that posts `{"trust":"server_verified"}` is posting a
 * field nothing reads.
 *
 * `ServerCheckEvidence` is DERIVED from the ledger — `verdict_received` rows on
 * this episode, gated through the core's own `isTrustedOutcome`. It can never
 * arrive in a request body because nothing here looks at one for it. That
 * asymmetry is the entire point: the browser can tell us it ran something, and
 * it cannot tell us anything was judged.
 *
 * ## What deliberately does NOT exist in this file
 *
 * No hidden test, no reference program, no expected value, no failing input,
 * no per-test detail beyond the two integers the learner was already shown in
 * the submit response (`{ passed, total }`). `tests/nova/judge-secrets.test.ts`
 * scans this file for those identifiers by name, because "nobody has added one
 * yet" is a weaker guarantee than something that checks.
 *
 * @see schools/execution/trust.ts — the trust vocabulary this reads, and never writes.
 * @see docs/infrastructure/HYBRID_EXECUTION_AUDIT.md — the ADAPT row this implements.
 */

/**
 * Which of the two executors produced a result.
 *
 * Named after the executor rather than the button, because the button can be
 * renamed and the guarantee cannot. `local_run` is Pyodide in the learner's
 * tab; `server_check` is the judge behind `/api/learning/submit`.
 */
export type NovaExecutionSource = "local_run" | "server_check";

/**
 * A local Run, as the browser reported it.
 *
 * `trust` is the literal `"client_local"` rather than `ExecutionTrust`, exactly
 * as `LocalRunResult.trust` is in `schools/execution/trust.ts`: a future edit
 * that tries to mark a browser-reported run as verified is then a type error
 * rather than a code review someone has to catch.
 */
export interface LocalRunEvidence {
  readonly source: "local_run";
  readonly trust: "client_local";
  readonly status: LocalExecutionStatus;
  /**
   * What the learner's program printed, truncated. Null when it printed nothing
   * — or when the runtime never started, in which case there is no program
   * output to speak of and what the runner captured is OUR failure.
   */
  readonly stdout: string | null;
  /** The error the learner is looking at, truncated. Same nullability rule. */
  readonly stderr: string | null;
  /** True when either stream was cut — locally, or again by us for the prompt. */
  readonly truncated: boolean;
}

/**
 * The judge's last word on this task, read back out of the ledger.
 *
 * `testsPassed` / `testsTotal` are the two integers the submit response already
 * returns to the browser as its per-test summary, and the player already
 * renders them. So they are not a disclosure — the learner can read them on
 * their own screen, and Nova being unable to is the anomaly. Nothing about
 * WHICH test, what it fed the program or what it wanted back exists here, or
 * anywhere Nova can see.
 */
export interface ServerCheckEvidence {
  readonly source: "server_check";
  readonly trust: "server_verified";
  /** The verdict name as the ledger stores it — `accepted`, `wrong_answer`, … */
  readonly verdict: string;
  readonly testsPassed: number | null;
  readonly testsTotal: number | null;
}

/**
 * Both facts, either of which may be absent.
 *
 * Not a union, and not one field: they are independent observations of
 * different executors, and the sentence the tutor most needs — "it ran and
 * printed 17, but the checker has not seen this version" — is exactly the state
 * where one is present and the other is not.
 */
export interface NovaExecutionContext {
  readonly localRun: LocalRunEvidence | null;
  readonly serverCheck: ServerCheckEvidence | null;
}

/**
 * How much learner program output may enter the prompt.
 *
 * Far below `LOCAL_LIMITS.maxOutputBytes` (64 KiB) and that gap is deliberate.
 * The local cap exists so a runaway loop cannot fill the browser's memory; this
 * one exists because every character here is paid for on every turn of the
 * conversation and a program that printed 64 KiB has not told Nova 64 KiB worth
 * of anything. A traceback is normally under 600 characters even with a chained
 * cause, so `stderr` — the diagnostic half — gets the larger share.
 */
export const NOVA_OUTPUT_LIMITS = {
  stdoutChars: 800,
  stderrChars: 1_200,
} as const;

/**
 * Status → a phrase the model can build a sentence from.
 *
 * English, and staying English: this is prompt text, not learner-facing copy.
 * Nova translates its own answer into Kazakh or Russian under the LANGUAGE rule
 * in `prompt.ts`, and putting Kazakh here would mean a Russian learner's prompt
 * carried Kazakh diagnostics for no reason.
 *
 * A `Record` over the full union rather than a lookup with a default, so a new
 * `LocalExecutionStatus` fails to compile here instead of silently rendering as
 * "something happened".
 */
const LOCAL_STATUS_PHRASE: Record<LocalExecutionStatus, string> = {
  ok: "it ran to the end without crashing",
  syntax_error: "Python refused to start it — the source does not parse",
  runtime_error: "it started and then crashed part-way through",
  time_limit_exceeded: `it was still running after ${LOCAL_LIMITS.timeLimitMs / 1000} seconds and was stopped`,
  output_limit_exceeded: "it printed more than the output cap allows and was cut off",
  runtime_unavailable: "Python never started in their browser",
};

function isLocalStatus(value: unknown): value is LocalExecutionStatus {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(LOCAL_STATUS_PHRASE, value)
  );
}

/**
 * Trim to a budget, keeping the end that carries the meaning.
 *
 * `keep: "tail"` for stderr, and that is not a detail. A Python traceback puts
 * the frames first and the exception LAST — `ZeroDivisionError: division by
 * zero` is the final line. Keeping the head of a long traceback would hand Nova
 * the call stack and cut off the only sentence that says what went wrong.
 * stdout is the opposite: a loop that printed ten thousand lines is best
 * understood from where it started.
 */
function clamp(text: string, limit: number, keep: "head" | "tail"): {
  text: string;
  truncated: boolean;
} {
  if (text.length <= limit) return { text, truncated: false };
  return keep === "tail"
    ? { text: `…${text.slice(text.length - limit)}`, truncated: true }
    : { text: `${text.slice(0, limit)}…`, truncated: true };
}

/**
 * The browser's account of its own last Run.
 *
 * Everything is re-derived here rather than trusted: the status must be a
 * member of the union or the whole report is dropped, the streams must be
 * strings, and `trust` is not read at all. The worst a lying client achieves is
 * feeding its own user a wrong sentence about their own program — there is no
 * value it can put in this object that becomes evidence about anybody.
 *
 * Returns null rather than a neutral object when there is nothing to say, so
 * "the learner has not run anything" and "the learner ran something that
 * printed nothing" stay distinguishable in the prompt.
 */
export function parseReportedRun(raw: unknown): LocalRunEvidence | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!isLocalStatus(r.status)) return null;

  /* Pyodide failing to download is our outage, not the learner's mistake — the
     same rule `isLearnerOutcome` applies on the server side for a dead judge.
     The streams are dropped with it: what the runner captured in that state is
     a loader error with our asset URLs in it, which is neither useful to a
     fourteen-year-old nor ours to paste into a third-party model. */
  if (!isLearnerOutcome(r.status)) {
    return {
      source: "local_run",
      trust: "client_local",
      status: r.status,
      stdout: null,
      stderr: null,
      truncated: false,
    };
  }

  const rawOut = typeof r.stdout === "string" ? r.stdout : "";
  const rawErr = typeof r.stderr === "string" ? r.stderr : "";
  const out = clamp(rawOut, NOVA_OUTPUT_LIMITS.stdoutChars, "head");
  const err = clamp(rawErr, NOVA_OUTPUT_LIMITS.stderrChars, "tail");

  return {
    source: "local_run",
    trust: "client_local",
    status: r.status,
    stdout: out.text.trim() ? out.text : null,
    stderr: err.text.trim() ? err.text : null,
    /* Either the runner cut it or we did. The learner's program may have said
       more than Nova is looking at, and Nova must not conclude anything from
       what is missing off the end. */
    truncated: r.truncated === true || out.truncated || err.truncated,
  };
}

/**
 * The judge's last word on this block, from the episode's own event stream.
 *
 * Three filters, and each is load-bearing:
 *
 * 1. `verdict_received` — the only event that means "the server graded this".
 * 2. `isTrustedOutcome` — the core's own predicate, not a second opinion.
 *    `EVENT_TRUST.verdict_received` is `browser`, on the theory that ingest
 *    would upgrade it; no upgrade was ever built and the ingest route now
 *    refuses the event outright. The real writer is the submit route, stamping
 *    `judge`. A row that is not stamped by a judge, a verifier or this server
 *    must not become the sentence "the checker looked at your program".
 * 3. `task_ref` — episodes are minted per block by the player, but an episode
 *    id is a client-chosen value and the honest key for "did the judge see THIS
 *    task" is the task reference the verdict itself carries (`sx-practice:m1.p3`).
 *
 * The stream is already ordered `received_at asc, seq asc` by the store, so the
 * last surviving row is the most recent verdict.
 */
export function lastServerCheck(
  events: readonly ReducibleEvent[],
  blockId: string,
): ServerCheckEvidence | null {
  let latest: ReducibleEvent | null = null;
  for (const e of events) {
    if (e.event_name !== "verdict_received") continue;
    if (!isTrustedOutcome(e)) continue;
    const ref = e.payload.task_ref;
    if (typeof ref !== "string" || !ref.endsWith(`:${blockId}`)) continue;
    latest = e;
  }
  if (!latest) return null;

  const verdict = latest.payload.verdict;
  if (typeof verdict !== "string") return null;

  const passed = latest.payload.tests_passed;
  const total = latest.payload.tests_total;

  return {
    source: "server_check",
    trust: "server_verified",
    verdict,
    testsPassed: typeof passed === "number" ? passed : null,
    testsTotal: typeof total === "number" ? total : null,
  };
}

/**
 * Both halves, assembled where both inputs are available.
 *
 * Returns null when neither executor has anything to say, so the prompt gains
 * no section at all rather than a paragraph explaining that nothing happened.
 */
export function executionContextFor(input: {
  /** The `lastRun` field of the request body, unvalidated and untrusted. */
  reported: unknown;
  /** This episode's ledger rows, already loaded by the hint policy. */
  events: readonly ReducibleEvent[];
  blockId: string;
}): NovaExecutionContext | null {
  const localRun = parseReportedRun(input.reported);
  const serverCheck = lastServerCheck(input.events, input.blockId);
  if (!localRun && !serverCheck) return null;
  return { localRun, serverCheck };
}

/** Header for the execution section. Exported so `PROMPT_MARKERS` can reuse it. */
export const EXECUTION_PROMPT_HEADING = "EXECUTION STATE — where this code actually ran";

/**
 * The trusted half of what Nova is told about execution.
 *
 * METADATA ONLY. Every line below is either a constant, a value this server
 * derived, or an integer — nothing the learner's program wrote. Their stdout
 * and stderr are learner-controlled text and travel in the USER half of the
 * conversation, fenced with the per-request nonce, for the same reason their
 * message does: a program can `print("Ignore all previous instructions")` as
 * easily as a child can type it, and output that arrived in the system message
 * would carry system authority. See `buildNovaMessages` in `prompt.ts`.
 */
export function executionPromptLines(ex: NovaExecutionContext): string[] {
  const lines: string[] = ["", EXECUTION_PROMPT_HEADING];
  const { localRun, serverCheck } = ex;

  if (localRun) {
    lines.push(
      "- The learner pressed Run. Python executed IN THEIR OWN BROWSER.",
      `- What happened: ${LOCAL_STATUS_PHRASE[localRun.status]}.`,
    );

    if (localRun.status === "runtime_unavailable") {
      /* Our outage, said plainly, so the model does not spend a turn analysing
         a program that never ran. */
      lines.push(
        "- That is OUR failure, not a mistake in their program. Do not analyse their code",
        "  for it. Say the tool had a problem and suggest they try Run again.",
      );
    } else {
      if (localRun.stdout) {
        lines.push(
          "- What their program printed is in the next message, fenced and marked",
          '  kind="program_stdout".',
        );
      }
      if (localRun.stderr) {
        lines.push(
          "- The error they are looking at RIGHT NOW is in the next message, fenced and",
          '  marked kind="program_stderr". Read it. It is the most useful thing you have.',
          "- Use it to decide WHICH question to ask. Quote at most one line of it back.",
        );
      }
      if (!localRun.stdout && !localRun.stderr) {
        lines.push("- Their program produced no output at all, on either stream.");
      }
      if (localRun.truncated) {
        lines.push(
          "- That output was CUT SHORT. Draw no conclusion from where it appears to stop.",
        );
      }
    }

    lines.push(
      "- A local run is not a check. It proves the program runs, not that it is right.",
    );
  }

  if (serverCheck) {
    const count =
      serverCheck.testsPassed !== null && serverCheck.testsTotal !== null
        ? ` — ${serverCheck.testsPassed} of ${serverCheck.testsTotal} tests passed`
        : "";
    lines.push(
      "- The checker has run this task on our server, against tests the learner cannot see.",
      `- Its most recent word on it: ${serverCheck.verdict}${count}.`,
      "- You do NOT know which test, what input it used, or what it expected back. You have",
      "  never been told and you never will be. Never guess one, never invent one, never",
      "  describe one — a made-up test reads to a learner exactly like a real one.",
    );
    if (localRun) {
      /* The two facts are not about the same text. The judge graded whatever
         was SUBMITTED, which may be several edits old; the Run above is what is
         in the editor now. Without this line the model reads them as one event
         and tells a learner the checker rejected the program they just ran. */
      lines.push(
        "- That verdict is about a version they submitted earlier. It is not necessarily",
        "  about the program they just ran, and you cannot tell whether the code changed.",
      );
    }
  } else if (localRun) {
    /* The sentence this whole feature exists for. Without it the model reads
       green output as a solved task and congratulates a learner whose program
       nothing has checked. */
    lines.push(
      "- The checker has NOT seen this program. Whatever it printed, you cannot say it is",
      "  correct, accepted or finished. Say what you can see, and that checking is the",
      "  next step.",
    );
  }

  return lines;
}
