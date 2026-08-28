"use client";

import { useCallback, useState } from "react";
import { usePython } from "@/lib/pyodide/use-python";
import { PYTHON_RUNTIME } from "@schools/execution/python-policy";
import { LOCAL_LIMITS, type LocalExecutionStatus, type LocalRunResult } from "@schools/execution/trust";

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
    /* provider_timeout, provider_error, payload_too_large — the judge did not
       answer, or we refused. None of them says anything about the program. */
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

/**
 * Pyodide ships its own CPython. `PYTHON_RUNTIME.version` pins the judge's.
 * There is no mechanism that makes those the same number and they are very
 * probably not — which is a real finding for the infrastructure docs, not
 * something to round off.
 */
function versionSkew(localPython: string | null): Skew {
  if (!localPython) {
    return { kind: "unknown", note: "The browser runtime has not reported its Python version yet." };
  }
  const pinned = PYTHON_RUNTIME.version;
  if (localPython === pinned) {
    return { kind: "identical", note: "Both halves are on the same interpreter version." };
  }

  const [lMajor, lMinor] = localPython.split(".");
  const [pMajor, pMinor] = pinned.split(".");
  if (lMajor === pMajor && lMinor === pMinor) {
    return {
      kind: "patch",
      note:
        "Same feature release, different patch. Nothing a Grade 9 program can observe, " +
        "but the two halves are still not byte-identical interpreters.",
    };
  }
  return {
    kind: "feature",
    note:
      `The browser runs Python ${localPython}; the judge is pinned to ${pinned}. That is a ` +
      "different FEATURE release, so syntax, error text and standard-library behaviour can " +
      "legitimately differ between what a learner sees on Run and what they are graded on. " +
      "Neither number is wrong — Pyodide ships its own CPython — and the skew belongs in " +
      "docs/infrastructure, not in a shrug.",
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

export default function ExecutionLab() {
  const python = usePython();
  const [source, setSource] = useState(PRESETS[0].source);
  const [stdin, setStdin] = useState(PRESETS[0].stdin);
  const [local, setLocal] = useState<LocalRunResult | null>(null);
  const [server, setServer] = useState<ServerOutcome | null>(null);
  const [busy, setBusy] = useState(false);

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

  const agreement = compare(local, server);
  const skew = versionSkew(python.pythonVersion);

  return (
    <div className="flex flex-col gap-6">
      <RuntimeStrip
        phase={python.phase}
        pyodideVersion={python.pyodideVersion}
        pythonVersion={python.pythonVersion}
        error={python.error}
        skew={skew}
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
        <ServerPane result={server} busy={busy} />
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

function RuntimeStrip(props: {
  phase: string;
  pyodideVersion: string | null;
  pythonVersion: string | null;
  error: string | null;
  skew: Skew;
}) {
  const { phase, pyodideVersion, pythonVersion, error, skew } = props;

  const skewTone =
    skew.kind === "feature"
      ? "border-sx-partial text-sx-partial"
      : skew.kind === "patch"
        ? "border-sx-unknown text-sx-text-2"
        : skew.kind === "identical"
          ? "border-sx-correct text-sx-correct"
          : "border-b-edge text-b-fg/50";

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
            <dt className="text-b-fg/50">python</dt>
            <dd>{pythonVersion ?? "—"}</dd>
            <dt className="text-b-fg/50">trust</dt>
            <dd>client_local</dd>
          </dl>
          {error ? (
            <p className="mt-2 font-b-mono text-[12px] leading-4 text-sx-wrong">{error}</p>
          ) : null}
        </div>

        <div className="rounded-[12px] border-2 border-b-edge p-4">
          <div className="text-[12px] uppercase tracking-wide text-b-fg/40">
            Server — /api/exec/run
          </div>
          <dl className="mt-2 grid grid-cols-[9rem_1fr] gap-y-1 font-b-mono text-[13px]">
            <dt className="text-b-fg/50">python (pinned)</dt>
            <dd>{PYTHON_RUNTIME.version}</dd>
            <dt className="text-b-fg/50">wire version</dt>
            <dd>{PYTHON_RUNTIME.wireVersion}</dd>
            <dt className="text-b-fg/50">provider</dt>
            {/* Read from EXEC_PROVIDER on the server. A dev page must not be
                told which provider is configured — that is what /api/health
                is for, behind its admin gate. */}
            <dd className="text-b-fg/40">see /api/health</dd>
            <dt className="text-b-fg/50">produces evidence</dt>
            <dd className="text-b-fg/40">no — RUN, not SUBMIT</dd>
          </dl>
        </div>
      </div>

      <div className={`rounded-[12px] border-2 p-3 text-[13px] leading-5 ${skewTone}`}>
        <strong className="font-b-mono">version skew: {skew.kind}</strong> — {skew.note}
      </div>
    </div>
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

function ServerPane({ result, busy }: { result: ServerOutcome | null; busy: boolean }) {
  return (
    <section className="flex flex-col gap-2 rounded-[12px] border-2 border-b-edge p-4">
      <h2 className="text-[13px] uppercase tracking-wide text-b-fg/40">judge</h2>
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
