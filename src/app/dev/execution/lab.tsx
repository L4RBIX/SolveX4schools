"use client";

import { useCallback, useEffect, useState } from "react";
import { usePython } from "@/lib/pyodide/use-python";
import { DEFAULT_PYODIDE_BASE_URL } from "@/lib/pyodide/worker";
import { PYTHON_RUNTIME } from "@schools/execution/python-policy";
import { LOCAL_LIMITS, type LocalExecutionStatus, type LocalRunResult } from "@schools/execution/trust";
import { probeJudgeAction } from "./actions";
import type { ProbeOutcome, TrustedJudgeConfig } from "./probe";

/**
 * Execution lab — do the two halves agree?
 *
 * ## Why this page exists at all
 *
 * A learner presses Run and Python executes in their browser. They press Submit
 * and the same source executes on our judge. The product's entire premise is
 * that the first is a fast, free, private preview of the second — and NOBODY
 * had ever run one program through both and compared the answers. A hybrid
 * system whose two halves disagree is worse than either half alone: the learner
 * sees one thing, iterates until it looks right, and is graded on another.
 *
 * So this page runs one program through both engines at once and puts the
 * results side by side. It is internal, it is not pretty, and it is honest.
 *
 * ## What it deliberately does not claim
 *
 * Neither column is evidence. The local one is `client_local` by type and can
 * never be anything else. The server one goes through `/api/exec/run`, which is
 * RUN — it writes nothing, signs nothing and grades nothing. The only path that
 * produces evidence is `/api/learning/submit`, and it is not on this page,
 * because a lab that could mint a verdict is a lab someone will eventually use
 * to mint one.
 *
 * Nothing here sends a hidden test, an expected output or a reference solution
 * anywhere. There is no comparison against an answer key on this page and there
 * cannot be one: the browser has none, and if it ever did, the key has leaked.
 *
 * ## What the trusted column may say, and what it may not
 *
 * It names the provider, whether it is configured, its endpoint reduced to a
 * host, whether it is metered, and — after an explicit probe — the interpreter
 * the judge reported: id, name, version. That is enough to answer "what am I
 * actually being compared against", which was previously unanswerable from this
 * page and is the reason a version skew could go unnoticed.
 *
 * It never renders an API key, a key prefix, a key length, a request header or
 * a raw provider response body. It cannot: everything it receives comes from
 * `schools/ops/judge-probe.ts`, which does not produce those. The browser also
 * never contacts the judge — every call on this page goes to our own origin,
 * and a vendor host appears here as TEXT and never as a request.
 *
 * The vendor is named on this page because this page is for whoever is running
 * the deployment. Nothing a learner sees knows the word: a lesson shows
 * «Тексерілуде…» and then a localised result, and `teacherOutcome` collapses
 * every provider failure to "not checked".
 */

/* -------------------------------------------------------------------------- */
/* Outcome classes — the two status unions, mapped onto one vocabulary         */
/* -------------------------------------------------------------------------- */

/**
 * `LocalExecutionStatus` and the server's `ExecutionStatus` are deliberately
 * different unions (see `schools/execution/trust.ts`), so comparing the status
 * STRINGS would report a divergence on every syntax error — the browser says
 * `syntax_error`, the judge says `compile_error`, and they mean the same thing.
 * That false alarm would fire on the most common failure a beginner produces
 * and would train anyone reading this page to ignore the red banner.
 *
 * So each union is projected onto the coarse vocabulary below, and the
 * comparison happens there. What survives the projection is what actually
 * matters to a learner: did it run, did their program break, was it too slow,
 * was the output cut, or did we fail to measure it.
 */
type Outcome =
  | "ok"
  | "learner_error"
  | "too_slow"
  | "output_capped"
  | "too_much_memory"
  /** Nothing was measured. Never a statement about the program. */
  | "not_measured";

function localOutcome(status: LocalExecutionStatus): Outcome {
  switch (status) {
    case "ok":
      return "ok";
    case "syntax_error":
    case "runtime_error":
      return "learner_error";
    case "time_limit_exceeded":
      return "too_slow";
    case "output_limit_exceeded":
      return "output_capped";
    case "runtime_unavailable":
      /* Pyodide did not start, or we refused the payload. `isLearnerOutcome`
         is false for exactly this, and the comparison below must not treat it
         as a disagreement about the program. */
      return "not_measured";
  }
}

/** The server's statuses arrive as JSON, so this takes a string, not the union. */
function serverOutcome(status: string): Outcome {
  switch (status) {
    case "ok":
      return "ok";
    case "compile_error":
    case "runtime_error":
      return "learner_error";
    case "time_limit_exceeded":
      return "too_slow";
    case "memory_limit_exceeded":
      return "too_much_memory";
    /* provider_timeout, provider_error, provider_rate_limited,
       payload_too_large — the judge did not answer, the judge is broken, the
       judge refused us on quota, or we refused before it ran. None of them says
       anything about the program.

       `provider_rate_limited` is new with the metered judge and lands here by
       the default branch rather than by a case of its own, which is correct and
       worth stating: this page's coarse vocabulary is about what happened to the
       PROGRAM, and over-quota is a fact about a plan. A dev page that showed it
       as a distinct outcome class would be inviting a comparison against the
       browser, which has no plan and can never produce it. */
    default:
      return "not_measured";
  }
}

/* -------------------------------------------------------------------------- */
/* The server half                                                            */
/* -------------------------------------------------------------------------- */

type ServerOutcome =
  | {
      kind: "ran";
      status: string;
      stdout: string;
      stderr: string;
      exitCode: number | null;
      /** As the judge measured it. */
      timeMs: number;
      infrastructureError: boolean;
      /** As this browser measured it, network included. */
      roundTripMs: number;
    }
  | {
      /** 400/413/429/503 — the route refused before or instead of executing. */
      kind: "refused";
      httpStatus: number;
      body: string;
      roundTripMs: number;
    };

interface ServerRunBody {
  status?: unknown;
  stdout?: unknown;
  stderr?: unknown;
  exitCode?: unknown;
  timeMs?: unknown;
  infrastructureError?: unknown;
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number => (typeof v === "number" ? v : 0);

async function callServer(source: string, stdin: string): Promise<ServerOutcome> {
  const started = performance.now();
  try {
    const res = await fetch("/api/exec/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sourceCode: source, stdin }),
    });
    const roundTripMs = Math.round(performance.now() - started);
    const text = await res.text();

    if (!res.ok) {
      /* Kept as raw text. A 413 names the ceiling and the actual size, a 429
         names the retry delay, and paraphrasing either would hide the thing
         somebody opened this page to see. */
      return { kind: "refused", httpStatus: res.status, body: text, roundTripMs };
    }

    const body = JSON.parse(text) as ServerRunBody;
    return {
      kind: "ran",
      status: str(body.status),
      stdout: str(body.stdout),
      stderr: str(body.stderr),
      exitCode: typeof body.exitCode === "number" ? body.exitCode : null,
      timeMs: num(body.timeMs),
      infrastructureError: body.infrastructureError === true,
      roundTripMs,
    };
  } catch (err) {
    /* The fetch itself failed — offline, dev server restarting. Reported as a
       refusal rather than as an execution, because nothing ran. */
    return {
      kind: "refused",
      httpStatus: 0,
      body: err instanceof Error ? err.message : String(err),
      roundTripMs: Math.round(performance.now() - started),
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Divergence                                                                 */
/* -------------------------------------------------------------------------- */

type Agreement =
  | { kind: "pending" }
  /** One side produced no measurement. Not a disagreement — an absence. */
  | { kind: "not_comparable"; why: string }
  | { kind: "agree" }
  /** Identical once trailing whitespace is ignored. The default checker would not care. */
  | { kind: "whitespace"; why: string }
  | { kind: "diverged"; why: string };

/** Trailing whitespace per line, and at the end. What `token` normalisation ignores. */
function trimTrailing(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

function compare(local: LocalRunResult | null, server: ServerOutcome | null): Agreement {
  if (!local || !server) return { kind: "pending" };

  if (server.kind === "refused") {
    return {
      kind: "not_comparable",
      why: `the server refused the request (HTTP ${server.httpStatus}), so there is nothing to compare against.`,
    };
  }

  const lo = localOutcome(local.status);
  const so = serverOutcome(server.status);

  if (lo === "not_measured" || so === "not_measured") {
    return {
      kind: "not_comparable",
      why:
        lo === "not_measured"
          ? "the browser runtime produced no measurement (`runtime_unavailable`) — that is our infrastructure, not the program."
          : `the judge produced no measurement (\`${server.status}\`) — that is infrastructure, not the program.`,
    };
  }

  if (lo !== so) {
    return {
      kind: "diverged",
      why: `the engines disagree about what happened: browser \`${local.status}\` (${lo}) vs judge \`${server.status}\` (${so}).`,
    };
  }

  if (local.stdout !== server.stdout) {
    if (trimTrailing(local.stdout) === trimTrailing(server.stdout)) {
      return {
        kind: "whitespace",
        why:
          "stdout differs only in trailing whitespace. The default `token` checker would " +
          "still pass this; a block declaring `exact` would fail it on one of the two engines.",
      };
    }
    return { kind: "diverged", why: "the same program printed different things." };
  }

  return { kind: "agree" };
}

/**
 * stderr is deliberately NOT compared.
 *
 * A traceback names the file the code was written to, and the two engines write
 * it to different places — `<exec>` under Pyodide's harness, a temp path on the
 * judge — with different frame counts around the learner's own. Comparing them
 * would mean a permanent, unfixable red banner on every program that raises,
 * which is the fastest way to make this page useless. Both are shown in full;
 * the eye is a better judge of a traceback than a string equality.
 */
const STDERR_NOTE =
  "stderr is shown but not compared — tracebacks name different paths and frames on the two engines by construction.";

/* -------------------------------------------------------------------------- */
/* Version skew                                                               */
/* -------------------------------------------------------------------------- */

type SkewKind = "unknown" | "identical" | "patch" | "feature";

interface Skew {
  kind: SkewKind;
  note: string;
}

/** How far apart two version strings are. `null` on either side is `unknown`. */
function distance(a: string | null, b: string | null): SkewKind {
  if (!a || !b) return "unknown";
  if (a === b) return "identical";
  const [aMajor, aMinor] = a.split(".");
  const [bMajor, bMinor] = b.split(".");
  return aMajor === bMajor && aMinor === bMinor ? "patch" : "feature";
}

/**
 * Pyodide ships its own CPython. There is no mechanism that makes it the same
 * number as the judge's, and it very probably is not — a real finding for the
 * infrastructure docs, not something to round off.
 *
 * ## Three numbers, not two
 *
 * This used to compare the browser against `PYTHON_RUNTIME.version` and stop.
 * That was right while there was one judge and its version was pinned in a file
 * we control. With a rented judge it is no longer enough, because
 * `PYTHON_RUNTIME.version` is a number somebody WROTE DOWN — `python-policy.ts`
 * says so itself — and the judge's actual interpreter is only knowable by
 * asking it. So there are three:
 *
 * - what this browser is running (or would run, per the lock file),
 * - what this build CLAIMS the judge runs,
 * - what the judge, when probed, actually said.
 *
 * The second and third disagreeing is its own finding and a worse one than the
 * first-versus-third skew: it means the constant the rest of the system reasons
 * about is wrong, and nothing else in the product would ever notice.
 *
 * `judge` is null until somebody probes. Absent a probe this behaves exactly as
 * it did before, against the written-down number, and says which it used.
 */
function versionSkew(browserPython: string | null, judgePython: string | null): Skew {
  const pinned = PYTHON_RUNTIME.version;
  /* The probed number wins when there is one: it is a measurement, and the
     pinned one is an assertion. */
  const judgeSide = judgePython ?? pinned;
  const source = judgePython
    ? "as the judge reported it"
    : `as pinned in python-policy.ts — the judge has not been probed, so this is a written-down number`;

  if (!browserPython) {
    return {
      kind: "unknown",
      note:
        "Neither the running interpreter nor the shipped lock file has said which " +
        "Python this browser would get, so there is nothing to compare.",
    };
  }

  const kind = distance(browserPython, judgeSide);
  const heading = `Browser ${browserPython} vs judge ${judgeSide} (${source}).`;

  if (kind === "identical") {
    return { kind, note: `${heading} Both halves are on the same interpreter version.` };
  }
  if (kind === "patch") {
    return {
      kind,
      note:
        `${heading} Same feature release, different patch. Nothing a Grade 9 program can ` +
        "observe, but the two halves are still not byte-identical interpreters.",
    };
  }
  return {
    kind,
    note:
      `${heading} That is a different FEATURE release, so syntax, error text and ` +
      "standard-library behaviour can legitimately differ between what a learner sees on " +
      "Run and what they are graded on. Neither number is wrong — Pyodide ships its own " +
      "CPython — and the skew belongs in docs/infrastructure, not in a shrug.",
  };
}

/**
 * The second skew: what this build CLAIMS the judge runs versus what it said.
 *
 * Reported separately and only once a probe has produced a real number, because
 * it is a different kind of defect from the browser/judge skew. That one is
 * inherent and permanent — two interpreters, on purpose. This one is a stale
 * constant, it is fixable, and until it is fixed every other statement in the
 * product about the judge's Python is wrong.
 */
function pinSkew(judgePython: string | null): Skew | null {
  if (!judgePython) return null;
  const pinned = PYTHON_RUNTIME.version;
  const kind = distance(pinned, judgePython);
  if (kind === "identical") {
    return {
      kind,
      note: `python-policy.ts pins ${pinned} and the judge reported ${judgePython}. They match.`,
    };
  }
  return {
    kind,
    note:
      `python-policy.ts pins Python ${pinned}; the judge reported ${judgePython}. The pinned ` +
      "number is what the rest of the system reasons about — the parity fixtures, the error " +
      "dictionary, the version-skew docs — and it is now wrong. This is a config defect, not " +
      "an inherent property of a hybrid runtime.",
  };
}

/* -------------------------------------------------------------------------- */
/* Presets                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Each preset probes one way the halves could differ. The `probes` line says
 * what to look at, so the page teaches what it is for without a README.
 */
const PRESETS: { label: string; source: string; stdin: string; probes: string }[] = [
  {
    label: "normal",
    source: "n = int(input())\nprint(n * n)",
    stdin: "7",
    probes: "the control. Both should print 49 and agree.",
  },
  {
    label: "stdin, two values",
    source: "a, b = map(int, input().split())\nprint(a + b)",
    stdin: "3 4",
    probes: "stdin handling — the browser passes it through a worker, the judge through a pipe.",
  },
  {
    label: "float formatting",
    source: "print(0.1 + 0.2)\nprint(7 / 3)\nprint(10 // 3, 10 % 3)",
    stdin: "",
    probes: "repr of floats. Same CPython algorithm, so a divergence here would be alarming.",
  },
  {
    label: "syntax error",
    source: "print(",
    stdin: "",
    probes:
      "the unions differ by design — browser `syntax_error`, judge `compile_error`. Both map to " +
      "`learner_error`, so this must NOT show as a divergence.",
  },
  {
    label: "runtime error",
    source: "print(1 / 0)",
    stdin: "",
    probes: "stdout is empty on both; the traceback text will differ and is not compared.",
  },
  {
    label: "infinite loop",
    source: "while True: pass",
    stdin: "",
    probes:
      `both cut it off — the browser at ${LOCAL_LIMITS.timeLimitMs} ms, the judge at its own ` +
      "5 s. Same outcome class, deliberately different budgets.",
  },
  {
    label: "large output",
    source: "for i in range(200000):\n    print(i)",
    stdin: "",
    probes:
      "the caps are identical (64 KiB) and the STATUSES are not: the browser reports " +
      "`output_limit_exceeded`, the judge truncates and stays `ok`. A real divergence.",
  },
  {
    label: "interpreter identity",
    source: "import sys\nprint(sys.version_info[:3])",
    stdin: "",
    probes: "the version skew, made concrete. Expect these to differ.",
  },
  {
    label: "platform",
    source: "import sys, os\nprint(sys.platform)\nprint(os.name)",
    stdin: "",
    probes:
      "`emscripten` in the browser, `linux` on the judge. Any learner program that branches " +
      "on the platform will be graded differently from what it showed them.",
  },
  {
    label: "third-party absence",
    source: "import numpy\nprint(numpy.__version__)",
    stdin: "",
    probes:
      "the library policy is enforced by ABSENCE on both halves. Both should raise " +
      "ModuleNotFoundError.",
  },
  {
    label: "environment scrub",
    source: "import os\nprint(os.environ.get('DEEPSEEK_API_KEY'))",
    stdin: "",
    probes: "None on both. The judge's child process env is scrubbed; the browser never had one.",
  },
];

/* -------------------------------------------------------------------------- */
/* The page                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The Python version Pyodide SHIPS, read from the lock file it is served with.
 *
 * A fallback for the state an operator is most likely to be in when they open
 * this page: Pyodide is not booting, so `pythonVersion` is null and the skew —
 * the thing they came to check — would show as "unknown" precisely when the
 * runtime is too broken to answer for itself. The lock file is a static asset
 * next to the WASM, so it answers even when the 13 MB download does not.
 *
 * Preferred SECOND, never first. `RunnerStatus.pythonVersion` is what the
 * interpreter actually reports about itself; this is a written-down number, and
 * a written-down number is exactly what `python-policy.ts` warns can drift.
 */
function useDeclaredPythonVersion(): string | null {
  const [declared, setDeclared] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${DEFAULT_PYODIDE_BASE_URL}pyodide-lock.json`);
        if (!res.ok) return;
        const lock = (await res.json()) as { info?: { python?: unknown } };
        const version = lock.info?.python;
        if (!cancelled && typeof version === "string") setDeclared(version);
      } catch {
        /* The lab shows one fewer fact. It is a dev page; a failed fetch of an
           optional detail must not take the tool down with it. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return declared;
}

export function ExecutionLab({ judge }: { judge: TrustedJudgeConfig }) {
  const python = usePython();
  const declaredPython = useDeclaredPythonVersion();
  const [source, setSource] = useState(PRESETS[0].source);
  const [stdin, setStdin] = useState(PRESETS[0].stdin);
  const [local, setLocal] = useState<LocalRunResult | null>(null);
  const [server, setServer] = useState<ServerOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  /* Null until somebody presses the button. NOTHING probes on mount: against a
     rented judge that would spend requests every time this page was opened, and
     a dev tool that costs money to look at is a dev tool nobody opens. */
  const [probe, setProbe] = useState<ProbeOutcome | null>(null);
  const [probing, setProbing] = useState(false);

  const { run: runLocal } = python;

  const runBoth = useCallback(async () => {
    setBusy(true);
    setLocal(null);
    setServer(null);
    /* Concurrently, because the question is "same program, both engines" and
       serialising would add the judge's latency to the browser's wall clock for
       no reason. Neither call rejects. */
    const [l, s] = await Promise.all([runLocal({ source, stdin }), callServer(source, stdin)]);
    setLocal(l);
    setServer(s);
    setBusy(false);
  }, [runLocal, source, stdin]);

  const runProbe = useCallback(async () => {
    setProbing(true);
    try {
      setProbe(await probeJudgeAction());
    } catch (err) {
      /* The action itself failed to reach us — a dev server restarting, most
         likely. Rendered as a refusal, because nothing was probed. */
      setProbe({ kind: "refused", why: err instanceof Error ? err.message : String(err) });
    }
    setProbing(false);
  }, []);

  const agreement = compare(local, server);
  /* What the interpreter says about itself, or failing that what the lock file
     says it would be. The label below names which, because they are not the
     same kind of claim. */
  const observedPython = python.pythonVersion ?? declaredPython;
  /* The judge's own answer, and only ever its own answer: `runtime.version` is
     null for an operator-pinned language id, and a null here correctly falls
     back to the written-down number rather than inventing one. */
  const judgePython =
    probe?.kind === "probed" ? (probe.probe.runtime?.version ?? null) : null;
  const skew = versionSkew(observedPython, judgePython);
  const pin = pinSkew(judgePython);
  const versionSource = python.pythonVersion
    ? "reported by the running interpreter"
    : declaredPython
      ? "declared by the shipped pyodide-lock.json — the runtime itself has not started"
      : null;

  return (
    <div className="flex flex-col gap-6">
      <RuntimeStrip
        phase={python.phase}
        pyodideVersion={python.pyodideVersion}
        pythonVersion={python.pythonVersion}
        declaredPython={declaredPython}
        error={python.error}
        skew={skew}
        pin={pin}
        versionSource={versionSource}
        judge={judge}
        probe={probe}
        probing={probing}
        onProbe={runProbe}
      />

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setSource(p.source);
              setStdin(p.stdin);
              setLocal(null);
              setServer(null);
            }}
            className="rounded-full border-2 border-b-edge px-3 py-1 text-[13px] hover:border-b-fg/40"
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="text-[13px] leading-5 text-b-fg/50">
        {PRESETS.find((p) => p.source === source)?.probes ?? "Custom program."}
      </p>

      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        rows={10}
        spellCheck={false}
        className="w-full rounded-[12px] border-2 border-b-edge bg-black p-4 font-b-mono text-[14px]"
      />
      <input
        value={stdin}
        onChange={(e) => setStdin(e.target.value)}
        placeholder="stdin"
        className="h-12 rounded-[12px] border-2 border-b-edge bg-black px-4 font-b-mono text-[14px]"
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={runBoth}
          disabled={busy}
          className="h-12 w-56 rounded-full bg-b-blue font-medium disabled:opacity-40"
        >
          {busy ? "running both…" : "Run both engines"}
        </button>
        <span className="text-[13px] text-b-fg/40">
          Same source, same stdin, dispatched together.
        </span>
      </div>

      <AgreementBanner agreement={agreement} />

      <div className="grid gap-4 md:grid-cols-2">
        <LocalPane result={local} busy={busy} />
        <ServerPane result={server} busy={busy} judge={judge} />
      </div>

      {agreement.kind === "diverged" || agreement.kind === "whitespace" ? (
        <StdoutDiff
          left={local?.stdout ?? ""}
          right={server && server.kind === "ran" ? server.stdout : ""}
        />
      ) : null}

      <p className="text-[13px] leading-5 text-b-fg/40">
        Neither column is evidence. The left is <code>client_local</code> by type and can never be
        anything else; the right went through <code>/api/exec/run</code>, which is RUN — it writes
        nothing and grades nothing. Evidence comes only from{" "}
        <code>/api/learning/submit</code>, which is not on this page. {STDERR_NOTE}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

/** Shared by both skew banners, so the two cannot be coloured by different rules. */
function skewTone(kind: SkewKind): string {
  return kind === "feature"
    ? "border-sx-partial text-sx-partial"
    : kind === "patch"
      ? "border-sx-unknown text-sx-text-2"
      : kind === "identical"
        ? "border-sx-correct text-sx-correct"
        : "border-b-edge text-b-fg/50";
}

function RuntimeStrip(props: {
  phase: string;
  pyodideVersion: string | null;
  pythonVersion: string | null;
  declaredPython: string | null;
  error: string | null;
  skew: Skew;
  pin: Skew | null;
  versionSource: string | null;
  judge: TrustedJudgeConfig;
  probe: ProbeOutcome | null;
  probing: boolean;
  onProbe: () => void;
}) {
  const {
    phase,
    pyodideVersion,
    pythonVersion,
    declaredPython,
    error,
    skew,
    pin,
    versionSource,
    judge,
    probe,
    probing,
    onProbe,
  } = props;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[12px] border-2 border-b-edge p-4">
          <div className="text-[12px] uppercase tracking-wide text-b-fg/40">
            Browser — Pyodide
          </div>
          <dl className="mt-2 grid grid-cols-[9rem_1fr] gap-y-1 font-b-mono text-[13px]">
            <dt className="text-b-fg/50">phase</dt>
            <dd>{phase}</dd>
            <dt className="text-b-fg/50">pyodide</dt>
            <dd>{pyodideVersion ?? "—"}</dd>
            <dt className="text-b-fg/50">python (reported)</dt>
            <dd>{pythonVersion ?? "—"}</dd>
            <dt className="text-b-fg/50">python (shipped)</dt>
            {/* From the lock file served next to the WASM, so it is knowable
                even when the runtime will not start. */}
            <dd>{declaredPython ?? "—"}</dd>
            <dt className="text-b-fg/50">trust</dt>
            <dd>client_local</dd>
          </dl>
          {error ? (
            <p className="mt-2 font-b-mono text-[12px] leading-4 text-sx-wrong">{error}</p>
          ) : null}
        </div>

        <div className="rounded-[12px] border-2 border-b-edge p-4">
          <div className="text-[12px] uppercase tracking-wide text-b-fg/40">
            Server — the trusted judge
          </div>
          <dl className="mt-2 grid grid-cols-[9rem_1fr] gap-y-1 font-b-mono text-[13px]">
            {/* Read from EXEC_PROVIDER by the Server Component wrapping this
                one. The page used to say "see /api/health" here, which meant
                the engine-comparison page could not name the engine it was
                comparing against. */}
            <dt className="text-b-fg/50">provider</dt>
            <dd>{judge.provider}</dd>
            <dt className="text-b-fg/50">configured</dt>
            <dd className={judge.configured ? undefined : "text-sx-wrong"}>
              {String(judge.configured)}
            </dd>
            <dt className="text-b-fg/50">endpoint</dt>
            {/* Host and port only — `redactUrl` dropped the rest server-side,
                including any credentials somebody put in the URL. */}
            <dd>{judge.endpoint ?? "—"}</dd>
            <dt className="text-b-fg/50">metered</dt>
            <dd className={judge.metered ? "text-sx-partial" : undefined}>
              {judge.metered ? "yes — every call is billable" : "no"}
            </dd>
            {judge.metered ? (
              <>
                <dt className="text-b-fg/50">key present</dt>
                {/* Present or absent, and that is the entire disclosure. Never
                    the key, never a prefix, never its length. */}
                <dd className={judge.metered.keyPresent ? undefined : "text-sx-wrong"}>
                  {String(judge.metered.keyPresent)}
                </dd>
                <dt className="text-b-fg/50">max in flight</dt>
                <dd>{judge.metered.maxConcurrentRequests}</dd>
              </>
            ) : null}
            <dt className="text-b-fg/50">python (pinned)</dt>
            <dd>{PYTHON_RUNTIME.version}</dd>
            <dt className="text-b-fg/50">wire version</dt>
            <dd>{PYTHON_RUNTIME.wireVersion}</dd>
            <dt className="text-b-fg/50">trust</dt>
            <dd>{judge.trusted ? "server_verified" : "none — EXEC_PROVIDER=none"}</dd>
            <dt className="text-b-fg/50">produces evidence</dt>
            <dd className="text-b-fg/40">no — RUN, not SUBMIT</dd>
            <dt className="text-b-fg/50">leaves KZ</dt>
            <dd className={judge.leavesProviderBoundary === true ? "text-sx-partial" : undefined}>
              {judge.leavesProviderBoundary === null
                ? "unknown — depends where PISTON_URL points"
                : String(judge.leavesProviderBoundary)}
            </dd>
          </dl>
        </div>
      </div>

      <JudgeProbePanel judge={judge} probe={probe} probing={probing} onProbe={onProbe} />

      <div className={`rounded-[12px] border-2 p-3 text-[13px] leading-5 ${skewTone(skew.kind)}`}>
        <strong className="font-b-mono">version skew: {skew.kind}</strong> — {skew.note}
        {versionSource ? (
          <span className="block text-b-fg/40">Local version {versionSource}.</span>
        ) : null}
      </div>

      {/* Only once a probe has produced a real number. Before that there is
          nothing to compare the pinned constant against, and a banner claiming
          otherwise would be comparing it with itself. */}
      {pin ? (
        <div className={`rounded-[12px] border-2 p-3 text-[13px] leading-5 ${skewTone(pin.kind)}`}>
          <strong className="font-b-mono">pinned vs probed: {pin.kind}</strong> — {pin.note}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The judge, actually called.
 *
 * Everything above this comes free from the environment. Everything in here
 * costs a request, so it happens on a press and never on mount, and the panel
 * prints what the press spent. Against a rented judge, a dev page that probed
 * on load would quietly burn a daily allowance the first afternoon somebody
 * left the tab open.
 */
function JudgeProbePanel(props: {
  judge: TrustedJudgeConfig;
  probe: ProbeOutcome | null;
  probing: boolean;
  onProbe: () => void;
}) {
  const { judge, probe, probing, onProbe } = props;
  const result = probe?.kind === "probed" ? probe.probe : null;
  const runtime = result?.runtime ?? null;

  const tone =
    result === null
      ? "border-b-edge"
      : result.reachable === null
        ? "border-sx-unknown"
        : result.execution?.ok
          ? "border-sx-correct"
          : "border-sx-wrong";

  return (
    <section className={`flex flex-col gap-3 rounded-[12px] border-2 p-4 ${tone}`}>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onProbe}
          disabled={probing}
          className="h-10 rounded-full border-2 border-b-edge px-4 text-[13px] hover:border-b-fg/40 disabled:opacity-40"
        >
          {probing ? "probing…" : "Probe the judge"}
        </button>
        <span className="text-[13px] text-b-fg/50">
          {judge.metered
            ? "Billable. One language listing on the first probe of this server process, one " +
              "submission, and a poll per round until it answers."
            : "Asks which interpreter the judge will use, then runs print(1) through it."}
        </span>
      </div>

      {probe === null ? (
        <p className="font-b-mono text-[13px] text-b-fg/40">
          not probed — nothing on this page calls the judge until you press that.
        </p>
      ) : probe.kind === "refused" ? (
        <p className="font-b-mono text-[13px] leading-5 text-sx-partial">{probe.why}</p>
      ) : (
        <>
          <dl className="grid grid-cols-[11rem_1fr] gap-y-1 font-b-mono text-[13px]">
            <dt className="text-b-fg/50">reachable</dt>
            <dd>
              {result?.reachable === null ? "not attempted" : String(result?.reachable ?? false)}
            </dd>
            <dt className="text-b-fg/50">runtime id</dt>
            <dd>{runtime?.id ?? "—"}</dd>
            <dt className="text-b-fg/50">runtime name</dt>
            <dd>{runtime?.name ?? "—"}</dd>
            <dt className="text-b-fg/50">runtime version</dt>
            {/* Null is a real answer, not a missing one: an operator-pinned
                language id means nothing in this system knows which interpreter
                graded a learner. */}
            <dd>{runtime?.version ?? "unknown"}</dd>
            <dt className="text-b-fg/50">discovered by</dt>
            <dd>{runtime?.operatorOverride ? "JUDGE0_LANGUAGE_ID (pinned)" : "the judge"}</dd>
            <dt className="text-b-fg/50">print(1) status</dt>
            <dd>{result?.execution?.status ?? "not run"}</dd>
            <dt className="text-b-fg/50">print(1) → 1</dt>
            <dd className={result?.execution?.ok ? "text-sx-correct" : "text-sx-wrong"}>
              {String(result?.execution?.ok ?? false)}
            </dd>
            <dt className="text-b-fg/50">judge time</dt>
            <dd>{result?.execution ? `${result.execution.timeMs} ms` : "—"}</dd>
            <dt className="text-b-fg/50">probe wall time</dt>
            <dd>{result ? `${result.ms} ms` : "—"}</dd>
            <dt className="text-b-fg/50">requests spent</dt>
            <dd>{result?.cost.requests ?? (result?.cost.metered ? "not counted" : "n/a")}</dd>
            {result?.cost.quota ? (
              <>
                <dt className="text-b-fg/50">quota remaining</dt>
                <dd>
                  {result.cost.quota.remaining ?? "—"}
                  {result.cost.quota.limit !== null ? ` / ${result.cost.quota.limit}` : ""}
                </dd>
              </>
            ) : null}
          </dl>
          {/* Indexed keys, because the two sentences are legitimately IDENTICAL
              when nothing was called at all — the probe gives the same reason
              for both halves — and a duplicate React key on a text node is a
              console warning nobody would ever trace back to here. */}
          {[result?.runtimeProblem, result?.executionProblem]
            .filter((s): s is string => typeof s === "string")
            .map((s, i) => (
              <p key={i} className="font-b-mono text-[12px] leading-4 text-sx-partial">
                {s}
              </p>
            ))}
          <p className="font-b-mono text-[12px] leading-4 text-b-fg/40">{result?.cost.note}</p>
        </>
      )}
    </section>
  );
}

function AgreementBanner({ agreement }: { agreement: Agreement }) {
  if (agreement.kind === "pending") return null;

  /* Loud on purpose. A divergence that looks like a footnote is a divergence
     nobody acts on, and the cost of missing one is a learner graded on output
     they never saw. */
  const tone =
    agreement.kind === "agree"
      ? "border-sx-correct bg-sx-correct-soft text-sx-correct"
      : agreement.kind === "not_comparable"
        ? "border-sx-unknown bg-sx-unknown-soft text-sx-text-2"
        : agreement.kind === "whitespace"
          ? "border-sx-partial bg-sx-partial-soft text-sx-partial"
          : "border-sx-wrong bg-sx-wrong-soft text-sx-wrong";

  const heading =
    agreement.kind === "agree"
      ? "THE ENGINES AGREE"
      : agreement.kind === "not_comparable"
        ? "NOT COMPARABLE"
        : agreement.kind === "whitespace"
          ? "WHITESPACE-ONLY DIFFERENCE"
          : "DIVERGENCE";

  return (
    <div className={`rounded-[12px] border-2 p-4 ${tone}`}>
      <div className="text-[18px] font-bold tracking-wide">{heading}</div>
      <p className="mt-1 text-[14px] leading-5">
        {agreement.kind === "agree"
          ? "Same outcome class and byte-identical stdout."
          : agreement.why}
      </p>
    </div>
  );
}

function LocalPane({ result, busy }: { result: LocalRunResult | null; busy: boolean }) {
  return (
    <section className="flex flex-col gap-2 rounded-[12px] border-2 border-b-edge p-4">
      <h2 className="text-[13px] uppercase tracking-wide text-b-fg/40">browser</h2>
      {!result ? (
        <p className="font-b-mono text-[13px] text-b-fg/40">{busy ? "running…" : "no run yet"}</p>
      ) : (
        <>
          <dl className="grid grid-cols-[9rem_1fr] gap-y-1 font-b-mono text-[13px]">
            <dt className="text-b-fg/50">status</dt>
            <dd>{result.status}</dd>
            <dt className="text-b-fg/50">outcome</dt>
            <dd>{localOutcome(result.status)}</dd>
            <dt className="text-b-fg/50">wall time</dt>
            {/* Main-thread wall time, which a backgrounded tab can stretch.
                Tolerable precisely because this can never be evidence. */}
            <dd>{result.runtimeMs} ms</dd>
            <dt className="text-b-fg/50">truncated</dt>
            <dd>{String(result.truncated)}</dd>
            <dt className="text-b-fg/50">trust</dt>
            <dd>{result.trust}</dd>
          </dl>
          <Stream label="stdout" text={result.stdout} />
          <Stream label="stderr" text={result.stderr} />
        </>
      )}
    </section>
  );
}

function ServerPane({
  result,
  busy,
  judge,
}: {
  result: ServerOutcome | null;
  busy: boolean;
  judge: TrustedJudgeConfig;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-[12px] border-2 border-b-edge p-4">
      <h2 className="text-[13px] uppercase tracking-wide text-b-fg/40">
        judge — {judge.provider}
      </h2>
      {!result ? (
        <p className="font-b-mono text-[13px] text-b-fg/40">{busy ? "running…" : "no run yet"}</p>
      ) : result.kind === "refused" ? (
        <>
          <dl className="grid grid-cols-[9rem_1fr] gap-y-1 font-b-mono text-[13px]">
            <dt className="text-b-fg/50">http</dt>
            <dd className="text-sx-partial">{result.httpStatus || "fetch failed"}</dd>
            <dt className="text-b-fg/50">round trip</dt>
            <dd>{result.roundTripMs} ms</dd>
          </dl>
          <Stream label="response" text={result.body} />
        </>
      ) : (
        <>
          <dl className="grid grid-cols-[9rem_1fr] gap-y-1 font-b-mono text-[13px]">
            <dt className="text-b-fg/50">status</dt>
            <dd>{result.status}</dd>
            <dt className="text-b-fg/50">outcome</dt>
            <dd>{serverOutcome(result.status)}</dd>
            <dt className="text-b-fg/50">judge time</dt>
            <dd>{result.timeMs} ms</dd>
            <dt className="text-b-fg/50">round trip</dt>
            {/* Shown next to the judge's own figure because the two are not the
                same measurement, and neither is comparable to the browser's. */}
            <dd>{result.roundTripMs} ms</dd>
            <dt className="text-b-fg/50">exit code</dt>
            <dd>{result.exitCode ?? "—"}</dd>
            <dt className="text-b-fg/50">infrastructure</dt>
            <dd className={result.infrastructureError ? "text-sx-partial" : undefined}>
              {String(result.infrastructureError)}
            </dd>
            <dt className="text-b-fg/50">trust</dt>
            {/*
              DERIVED here, and it has to be, because `/api/exec/run` does not
              return a trust field — deliberately, since RUN produces no
              evidence and a route that stamped `server_verified` on a response
              would be minting a word it has no authority over.

              So the two halves are stated separately: WHO executed it (our
              server, if the provider is a trusted one) and whether that can be
              claimed (never, on this route). An infrastructure result executed
              nothing at all, so it gets neither.
            */}
            <dd>
              {result.infrastructureError
                ? "— nothing executed"
                : judge.trusted
                  ? "server_verified executor · not evidence (RUN)"
                  : "no trusted executor"}
            </dd>
          </dl>
          <Stream label="stdout" text={result.stdout} />
          <Stream label="stderr" text={result.stderr} />
        </>
      )}
    </section>
  );
}

/** Bounded on purpose: 200 000 lines of output must not take the page with it. */
const MAX_RENDERED_CHARS = 8_000;

function Stream({ label, text }: { label: string; text: string }) {
  const clipped = text.length > MAX_RENDERED_CHARS;
  return (
    <div className="flex flex-col gap-1">
      <div className="font-b-mono text-[12px] text-b-fg/40">
        {label} · {text.length} chars{clipped ? " (showing the first 8 000)" : ""}
      </div>
      <pre className="max-h-64 overflow-auto rounded-[8px] border border-b-edge bg-black p-3 font-b-mono text-[12px] leading-4">
        {text.slice(0, MAX_RENDERED_CHARS) || "(empty)"}
      </pre>
    </div>
  );
}

/**
 * Line-by-line, aligned by index.
 *
 * Not an LCS diff. The interesting case here is not "a line was inserted" but
 * "line 3 says 3.13.2 on one engine and 3.12.0 on the other", and index
 * alignment shows that immediately while a real diff algorithm would be a
 * hundred lines of code on an internal page.
 */
function StdoutDiff({ left, right }: { left: string; right: string }) {
  const l = left.split("\n");
  const r = right.split("\n");
  const rows = Math.min(Math.max(l.length, r.length), 120);
  const clipped = Math.max(l.length, r.length) > rows;

  return (
    <section className="flex flex-col gap-2 rounded-[12px] border-2 border-sx-wrong p-4">
      <h2 className="text-[13px] uppercase tracking-wide text-sx-wrong">stdout, line by line</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] font-b-mono text-[12px]">
          <thead>
            <tr className="text-b-fg/40">
              <th className="w-10 text-left font-normal">#</th>
              <th className="text-left font-normal">browser</th>
              <th className="text-left font-normal">judge</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, i) => {
              const a = l[i];
              const b = r[i];
              const same = a === b;
              return (
                <tr key={i} className={same ? "text-b-fg/50" : "bg-sx-wrong-soft text-sx-wrong"}>
                  <td className="pr-2 align-top">{i + 1}</td>
                  <td className="whitespace-pre-wrap break-all pr-4 align-top">{a ?? "∅"}</td>
                  <td className="whitespace-pre-wrap break-all align-top">{b ?? "∅"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {clipped ? (
        <p className="text-[12px] text-b-fg/40">
          Showing the first {rows} lines. ∅ means the stream had no such line.
        </p>
      ) : null}
    </section>
  );
}
