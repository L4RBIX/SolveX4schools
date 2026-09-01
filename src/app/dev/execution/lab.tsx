"use client";

import { useCallback, useState } from "react";
import { useCpp17 } from "@/lib/cpp17/use-cpp17";
import { usePython } from "@/lib/pyodide/use-python";
import {
  CPP_RUNTIME,
  CPP_STANDARD_FLAG,
  CPP_STANDARD_MACRO,
  MEASURED_JUDGE0_CPP_LANGUAGE_ID,
  MIN_GNU_CXX17_MAJOR,
} from "@schools/execution/cpp-runtime";
import { PYTHON_RUNTIME } from "@schools/execution/python-policy";
import { LOCAL_LIMITS, type LocalExecutionStatus, type LocalRunResult } from "@schools/execution/trust";
import { probeJudgeAction } from "./actions";
import type { ProbeOutcome, TrustedJudgeConfig } from "./probe";

/**
 * Execution lab — do the two halves agree?
 *
 * ## Why this page exists at all
 *
 * A learner presses Run and clang compiles their C++17 in the tab. They press
 * Submit and the same source is compiled by GCC on our judge. The product's
 * entire premise is that the first is a fast, free, private preview of the
 * second — and NOBODY had ever run one program through both and compared the
 * answers. A hybrid system whose two halves disagree is worse than either half
 * alone: the learner sees one thing, iterates until it looks right, and is
 * graded on another.
 *
 * So this page runs one program through both engines at once and puts the
 * results side by side. It is internal, it is not pretty, and it is honest.
 *
 * ## Which engines, exactly
 *
 * Both columns are C++17, because that is what the product ships. The left is
 * `src/lib/cpp17` — clang compiled to WebAssembly, passed `-std=c++17`
 * explicitly. The right is whatever `EXEC_PROVIDER` names, reading its language
 * and version from `schools/execution/cpp-runtime.ts`, which is the ONLY
 * authoritative runtime policy for the shipping product.
 *
 * This page used to describe the judge with `PYTHON_RUNTIME.version` and
 * `.wireVersion` from `schools/execution/python-policy.ts` and feed it Python
 * presets. That was a false claim on a screen: the provider had already been
 * moved to `CPP_RUNTIME`, so the panel confidently named an interpreter version
 * that nothing sends, next to a judge that would have answered Python source
 * with a compile error. Python survives here only in the clearly-labelled
 * backup pane at the bottom, which compares nothing and says so.
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
 * host, whether it is metered, and — after an explicit probe — the compiler the
 * judge reported: id, name, version. That is enough to answer "what am I
 * actually being compared against", which was previously unanswerable from this
 * page and is the reason a toolchain skew could go unnoticed.
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
      /* The toolchain did not start, or we refused the payload — and in the
         backup pane, Pyodide not starting lands here too. `isLearnerOutcome`
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
 * A compiler diagnostic names the file the code was written to, and the two
 * engines write it to different places — a virtual `main.cpp` under the
 * WebAssembly sysroot, a job path on the judge. They are also different
 * compilers: clang and GCC word the same error differently, point at different
 * columns, and print a different number of notes under it. Comparing them would
 * mean a permanent, unfixable red banner on every program that fails to build,
 * which is the fastest way to make this page useless. Both are shown in full;
 * the eye is a better judge of a diagnostic than a string equality.
 */
const STDERR_NOTE =
  "stderr is shown but not compared — clang and GCC word the same diagnostic differently and name different paths, by construction.";

/* -------------------------------------------------------------------------- */
/* Toolchain divergence                                                       */
/* -------------------------------------------------------------------------- */

/**
 * How worrying a finding is. Drives colour and nothing else.
 *
 * This used to be a version distance — `identical | patch | feature` — which
 * was the right vocabulary when both halves were CPython and the only question
 * was how far apart two triples were. It is the wrong vocabulary for C++: the
 * halves are not two builds of one implementation, they are clang and GCC, and
 * "same version" is not a state they can ever be in. The question worth asking
 * is not how far apart they are but whether each one is a C++17 compiler.
 */
type Verdict = "unknown" | "good" | "watch" | "bad";

interface Finding {
  kind: Verdict;
  note: string;
}

/**
 * The permanent, deliberate divergence — stated rather than measured.
 *
 * There is no probe for this and there does not need to be one: both compilers
 * are chosen, not discovered. clang-in-WebAssembly is what `src/lib/cpp17`
 * ships; GCC is what every judge in `schools/exec/providers` reaches. They are
 * different implementations on purpose, and the ONLY contract they share is the
 * standard — which is why `-std=c++17` is passed explicitly in the browser and
 * why the judge canary prints `__cplusplus` rather than `1`.
 *
 * Two things follow that are easy to forget while reading a green banner:
 *
 * - Implementation-defined behaviour may legitimately differ. Warning text and
 *   diagnostics certainly do, which is why stderr is not compared.
 * - The judge is not SENT a standard flag. On Judge0's RapidAPI plan
 *   `compiler_options` is refused with HTTP 403, so C++17 is a property of the
 *   compiler's default, which is what makes the GCC floor below load-bearing.
 */
function toolchainNote(): Finding {
  return {
    kind: "watch",
    note:
      `Browser clang (WebAssembly), compiled with ${CPP_STANDARD_FLAG} passed explicitly. ` +
      "Judge GCC, compiled with the standard as a DEFAULT — this plan refuses " +
      "compiler_options, so there is no flag to send. Two different implementations by " +
      `design; the only shared contract is __cplusplus == ${CPP_STANDARD_MACRO}. Differences ` +
      "in diagnostics are expected. Differences in a program's OUTPUT are not, and are what " +
      "the panes below are for.",
  };
}

/**
 * The finding that is actually fixable: is the judge's GCC new enough?
 *
 * `null` until somebody probes, because before that there is no number and a
 * banner comparing a constant with itself would be theatre.
 *
 * ## Why a floor and not an equality
 *
 * The old version of this compared the judge's reported version against a
 * pinned one and called any difference a config defect. That is wrong here.
 * `CPP_RUNTIME.version` pins the gcc package for PISTON; the probe's number
 * comes from Judge0's language catalogue, so on a metered deployment the two
 * describe different judges and demanding they match would report a defect that
 * does not exist.
 *
 * What matters on either judge is the same thing and it is a floor: GCC has
 * defaulted to `gnu++17` since GCC 11, so anything older compiles the course's
 * October-onwards syntax as C++14 and rejects it — in a way that looks to a
 * learner like their own program being wrong. `MIN_GNU_CXX17_MAJOR` is that
 * floor and `schools/execution/cpp-runtime.ts` argues it.
 *
 * The canary in the probe panel is still the ground truth: it asks the compiler
 * itself what `__cplusplus` is. This is the cheap structural check beside it.
 */
function compilerFloor(judgeVersion: string | null): Finding | null {
  if (!judgeVersion) return null;

  const major = Number.parseInt(judgeVersion.split(".")[0] ?? "", 10);
  if (!Number.isFinite(major)) {
    return {
      kind: "unknown",
      note:
        `The judge named its compiler "${judgeVersion}", which no major version can be read ` +
        "out of. The canary's __cplusplus answer below is the only thing that settles it.",
    };
  }

  if (major >= MIN_GNU_CXX17_MAJOR) {
    return {
      kind: "good",
      note:
        `The judge reported GCC ${judgeVersion}, at or above the GCC ${MIN_GNU_CXX17_MAJOR} ` +
        "floor, so it defaults to gnu++17. Confirm with the canary — a default is what the " +
        "catalogue implies, and __cplusplus is what the compiler says.",
    };
  }

  return {
    kind: "bad",
    note:
      `The judge reported GCC ${judgeVersion}, BELOW the GCC ${MIN_GNU_CXX17_MAJOR} floor. ` +
      "That compiler defaults to gnu++14 and this plan refuses compiler_options, so there is " +
      "no flag that fixes it: every lesson from October onwards would be marked wrong for " +
      "using syntax the course had just taught. The fix is a newer compiler on the judge.",
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
    source:
      "#include <iostream>\nint main() {\n  long long n;\n  std::cin >> n;\n  std::cout << n * n << \"\\n\";\n}\n",
    stdin: "7",
    probes: "the control. Both should print 49 and agree.",
  },
  {
    label: "stdin, two values",
    source:
      "#include <iostream>\nint main() {\n  long long a, b;\n  std::cin >> a >> b;\n  std::cout << a + b << \"\\n\";\n}\n",
    stdin: "3 4",
    probes:
      "stdin handling — the browser feeds a virtual file to the WebAssembly program, the judge " +
      "a pipe. `>>` skipping whitespace is the same operator in both standard libraries.",
  },
  {
    label: "iostream formatting",
    source:
      "#include <iostream>\nint main() {\n  std::cout << 0.1 + 0.2 << \"\\n\";\n  std::cout << 7.0 / 3 << \"\\n\";\n  std::cout << -7 / 2 << \" \" << -7 % 2 << \"\\n\";\n}\n",
    stdin: "",
    probes:
      "`<<` default precision is 6 significant digits in both libraries, and C++11 onwards " +
      "requires integer division to truncate toward zero (-3 and -1). A divergence here would " +
      "mean one half is not a conforming C++17 library.",
  },
  {
    label: "compile error",
    source: "#include <iostream>\nint main() { std::cout << 1 }\n",
    stdin: "",
    probes:
      "the unions differ by design — browser `syntax_error`, judge `compile_error`. Both map to " +
      "`learner_error`, so this must NOT show as a divergence. The diagnostics WILL differ: " +
      "clang and GCC word a missing semicolon differently, and stderr is not compared.",
  },
  {
    label: "runtime error",
    source:
      "#include <iostream>\n#include <vector>\nint main() {\n  std::vector<int> v;\n  std::cout << v.at(3);\n}\n",
    stdin: "",
    probes:
      "an uncaught std::out_of_range. Both abort with a non-zero exit; stdout is empty on both. " +
      "The terminate handler's sentence goes to stderr and is not compared.",
  },
  {
    label: "infinite loop",
    source: "int main() { while (true) {} }\n",
    stdin: "",
    probes:
      `both cut it off — the browser at ${LOCAL_LIMITS.timeLimitMs} ms of RUN time (the compile ` +
      "has its own, larger budget), the judge at its own 5 s. Same outcome class, deliberately " +
      "different budgets.",
  },
  {
    label: "large output",
    source:
      "#include <iostream>\nint main() {\n  for (int i = 0; i < 200000; i++) std::cout << i << \"\\n\";\n}\n",
    stdin: "",
    probes:
      "the caps are identical (64 KiB) and the STATUSES are not: the browser reports " +
      "`output_limit_exceeded`, the judge truncates and stays `ok`. A real divergence.",
  },
  {
    label: "compiler identity",
    source:
      "#include <iostream>\nint main() {\n  std::cout << __cplusplus << \"\\n\";\n#if defined(__clang__)\n  std::cout << \"clang \" << __clang_major__ << \"\\n\";\n#elif defined(__GNUC__)\n  std::cout << \"gcc \" << __GNUC__ << \"\\n\";\n#endif\n}\n",
    stdin: "",
    probes:
      `the toolchain divergence, made concrete. Line 1 must be ${CPP_STANDARD_MACRO} on BOTH — ` +
      "that is the whole contract, and a mismatch there is the worst finding this page can " +
      "produce. Line 2 will say clang on the left and gcc on the right, so expect a DIVERGENCE " +
      "banner and read the first line rather than the banner.",
  },
  {
    label: "platform",
    source:
      "#include <iostream>\nint main() {\n#ifdef __EMSCRIPTEN__\n  std::cout << \"emscripten\\n\";\n#elif defined(__linux__)\n  std::cout << \"linux\\n\";\n#else\n  std::cout << \"other\\n\";\n#endif\n  std::cout << sizeof(void*) << \"\\n\";\n}\n",
    stdin: "",
    probes:
      "wasm in the browser, linux on the judge — and 4-byte pointers against 8. Any learner " +
      "program that branches on the platform, or leans on pointer width, is graded differently " +
      "from what it showed them.",
  },
  {
    label: "bits/stdc++.h",
    source:
      "#include <bits/stdc++.h>\nint main() { std::vector<int> v{3,1,2}; std::sort(v.begin(), v.end()); for (int x : v) std::cout << x; std::cout << \"\\n\"; }\n",
    stdin: "",
    probes:
      "a libstdc++ extension GCC ships and libc++ does not. It builds in the browser only " +
      "because `src/lib/cpp17/bits-stdcpp.ts` puts the header into the sysroot deliberately. " +
      "Slow on the left (~4 s) and that is expected. May's contest lessons teach this header, " +
      "so a divergence here is a curriculum problem, not a curiosity.",
  },
  {
    label: "third-party absence",
    source: "#include <boost/version.hpp>\nint main() {}\n",
    stdin: "",
    probes:
      "the library policy is enforced by ABSENCE on both halves — see the header policy in " +
      "`schools/execution/cpp-runtime.ts`. Both should fail to compile on a missing header.",
  },
  {
    label: "environment scrub",
    source:
      "#include <cstdlib>\n#include <iostream>\nint main() {\n  const char* v = std::getenv(\"DEEPSEEK_API_KEY\");\n  std::cout << (v ? \"LEAKED\" : \"absent\") << \"\\n\";\n}\n",
    stdin: "",
    probes:
      "`absent` on both. The judge's child process env is scrubbed; the WebAssembly program " +
      "never had one to scrub.",
  },
];

/* -------------------------------------------------------------------------- */
/* The page                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * There is no browser compiler VERSION to report, and that is not a gap.
 *
 * The Python lab read `pyodide-lock.json` for a second opinion on the local
 * interpreter's version, because the two halves were two CPythons and the
 * number was the whole comparison. `Cpp17Runner` deliberately exposes no such
 * field — `RunnerStatus` is phase, `initMs` and `error`, with the comment "never
 * a written-down pin" against it — because the local half's identity is not a
 * version at all. It is: clang, WebAssembly, `-std=c++17` passed explicitly.
 * That is a build-time fact, stated in the strip below from
 * `schools/execution/cpp-runtime.ts`, and there is nothing to fetch.
 *
 * What replaces the lock-file read is `initMs`, which answers the question an
 * operator opening this page actually has when the left column is slow: did the
 * 18 MB toolchain come up, and how long did it take.
 */

export function ExecutionLab({ judge }: { judge: TrustedJudgeConfig }) {
  const cpp = useCpp17({ preload: true });
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
  /* The Python backup pane is not mounted until this is true, which is the
     whole reason it is a boolean and not a CSS class: mounting it constructs a
     Pyodide runner, and an operator who came here to look at C++ should not pay
     for a runtime the product does not ship. */
  const [backupOpen, setBackupOpen] = useState(false);

  const { run: runLocal } = cpp;

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
  /* The judge's own answer, and only ever its own answer. `runtime.version` is
     null for an operator-pinned language id, and a null here correctly produces
     NO finding rather than falling back to a written-down number and dressing
     it up as a measurement. */
  const judgeCompiler =
    probe?.kind === "probed" ? (probe.probe.runtime?.version ?? null) : null;
  const toolchain = toolchainNote();
  const floor = compilerFloor(judgeCompiler);

  return (
    <div className="flex flex-col gap-6">
      <RuntimeStrip
        phase={cpp.phase}
        initMs={cpp.initMs}
        error={cpp.error}
        toolchain={toolchain}
        floor={floor}
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

      <div className="flex flex-wrap items-center gap-4 border-t-2 border-b-edge pt-6">
        <button
          type="button"
          onClick={() => setBackupOpen((open) => !open)}
          className="h-10 rounded-full border-2 border-b-edge px-4 text-[13px] hover:border-b-fg/40"
        >
          {backupOpen ? "hide the Python backup" : "show the Python backup"}
        </button>
        <span className="text-[13px] text-b-fg/40">
          Closed by default, and unmounted rather than hidden — opening it constructs a Pyodide
          runner and downloads 13 MB the product does not ship.
        </span>
      </div>

      {backupOpen ? <PythonBackupPane /> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

/** Shared by both finding banners, so the two cannot be coloured by different rules. */
function findingTone(kind: Verdict): string {
  return kind === "bad"
    ? "border-sx-wrong text-sx-wrong"
    : kind === "watch"
      ? "border-sx-unknown text-sx-text-2"
      : kind === "good"
        ? "border-sx-correct text-sx-correct"
        : "border-b-edge text-b-fg/50";
}

function RuntimeStrip(props: {
  phase: string;
  initMs: number | null;
  error: string | null;
  toolchain: Finding;
  floor: Finding | null;
  judge: TrustedJudgeConfig;
  probe: ProbeOutcome | null;
  probing: boolean;
  onProbe: () => void;
}) {
  const { phase, initMs, error, toolchain, floor, judge, probe, probing, onProbe } = props;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-[12px] border-2 border-b-edge p-4">
          <div className="text-[12px] uppercase tracking-wide text-b-fg/40">
            Browser — clang in WebAssembly
          </div>
          <dl className="mt-2 grid grid-cols-[9rem_1fr] gap-y-1 font-b-mono text-[13px]">
            <dt className="text-b-fg/50">phase</dt>
            <dd>{phase}</dd>
            <dt className="text-b-fg/50">standard</dt>
            {/* Passed explicitly on every compile. `clang -cc1` defaults to C++14
                here, so this flag is the only reason October's syntax builds. */}
            <dd>{CPP_STANDARD_FLAG}</dd>
            <dt className="text-b-fg/50">version</dt>
            {/* Deliberately absent rather than "—" by accident. `RunnerStatus`
                exposes no compiler version, so inventing one on this page would
                be the exact class of written-down number the strip exists to
                distrust. */}
            <dd className="text-b-fg/40">not reported by the runtime</dd>
            <dt className="text-b-fg/50">toolchain up in</dt>
            <dd>{initMs === null ? "—" : `${initMs} ms`}</dd>
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
            {/* The judge's half of the C++ contract, from the one authoritative
                module. Which row applies depends on the provider, so the rows
                are rendered per provider rather than all at once — a panel that
                showed a Piston gcc pin next to a Judge0 deployment would be
                describing a judge nobody configured. */}
            <dt className="text-b-fg/50">standard required</dt>
            <dd>
              __cplusplus == {CPP_STANDARD_MACRO}
            </dd>
            {judge.provider === "piston" ? (
              <>
                <dt className="text-b-fg/50">gcc (pinned)</dt>
                <dd>{CPP_RUNTIME.version}</dd>
                <dt className="text-b-fg/50">wire version</dt>
                <dd>{CPP_RUNTIME.wireVersion}</dd>
                <dt className="text-b-fg/50">source file</dt>
                {/* The extension is what makes Piston's gcc package build C++
                    rather than C. Not cosmetic. */}
                <dd>{CPP_RUNTIME.sourceFileName}</dd>
              </>
            ) : null}
            {judge.provider === "judge0_rapidapi" ? (
              <>
                <dt className="text-b-fg/50">language id</dt>
                {/* The id whose C++17 behaviour was actually measured against
                    the live service, not read off a catalogue name. An operator
                    override replaces it, and the probe says when it did. */}
                <dd>
                  {judge.metered?.pinnedLanguageId ?? MEASURED_JUDGE0_CPP_LANGUAGE_ID}
                  {judge.metered?.pinnedLanguageId ? " (JUDGE0_LANGUAGE_ID)" : " (measured)"}
                </dd>
                <dt className="text-b-fg/50">gcc floor</dt>
                <dd>{`>= ${MIN_GNU_CXX17_MAJOR}`}</dd>
              </>
            ) : null}
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

      <div
        className={`rounded-[12px] border-2 p-3 text-[13px] leading-5 ${findingTone(toolchain.kind)}`}
      >
        <strong className="font-b-mono">toolchain: two compilers by design</strong> —{" "}
        {toolchain.note}
      </div>

      {/* Only once a probe has produced a real version. Before that there is
          nothing to check the floor against, and a banner claiming otherwise
          would be checking a constant against itself. */}
      {floor ? (
        <div
          className={`rounded-[12px] border-2 p-3 text-[13px] leading-5 ${findingTone(floor.kind)}`}
        >
          <strong className="font-b-mono">judge compiler floor: {floor.kind}</strong> —{" "}
          {floor.note}
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
            : "Asks which compiler the judge will use, then makes it print __cplusplus."}
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
                language id means nothing in this system knows which compiler
                graded a learner. */}
            <dd>{runtime?.version ?? "unknown"}</dd>
            <dt className="text-b-fg/50">discovered by</dt>
            <dd>{runtime?.operatorOverride ? "JUDGE0_LANGUAGE_ID (pinned)" : "the judge"}</dd>
            <dt className="text-b-fg/50">canary status</dt>
            <dd>{result?.execution?.status ?? "not run"}</dd>
            <dt className="text-b-fg/50">{`__cplusplus == ${CPP_STANDARD_MACRO}`}</dt>
            {/* The ground truth on this whole page. The canary is a C++ program
                that prints the macro, so this is the compiler's own answer to
                "did you build my source as C++17" rather than an inference from
                a catalogue name. */}
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
 * "line 1 says 201703 on one engine and 201402 on the other", and index
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

/* -------------------------------------------------------------------------- */
/* The Python backup                                                          */
/* -------------------------------------------------------------------------- */

/**
 * BACKUP PATH. Not the product, and it compares nothing.
 *
 * ## Why this exists at all
 *
 * Production ships C++17 only. The Python runtime is nevertheless RETAINED in
 * the repository as a backup — `src/lib/pyodide/**`, the pinned interpreter and
 * the library policy in `schools/execution/python-policy.ts`, all deliberately
 * kept rather than deleted. Retained code that nothing can run is retained code
 * that has quietly stopped working, so there is one way to exercise it by hand,
 * and this is it.
 *
 * ## Why it has one column and not two
 *
 * Because there is no Python judge to be the second one. `ExecutionRequest`'s
 * `language` is the one-member union `"cpp17"`; `/api/exec/run` compiles C++;
 * handing it `print(1)` produces a compile error, not a comparison. A second
 * column here would be exactly the false claim this pane replaced: the page
 * used to describe that C++ judge with `PYTHON_RUNTIME.version` and feed it
 * Python presets, which made a screen say something untrue about a running
 * service.
 *
 * So this runs CPython in the browser and reports what CPython said. That is
 * the entire claim. Nothing is compared, nothing is graded, and the pinned
 * backup judge version is shown ONLY as what it is: a number nothing sends.
 *
 * ## What it needs to work
 *
 * `public/pyodide` and `public/pyodide-worker.js`, which `predev` writes and
 * `scripts/strip-python-assets.mjs` deletes before a production build. On a
 * machine that has only ever run `npm run build`, the runtime will not start
 * and the phase below will say so — which is correct, not broken.
 */
function PythonBackupPane() {
  /* `preload: false` even though this component only mounts on demand: an
     operator opening the section to READ it should not start a 13 MB download
     they did not ask for. `run` warms the runner itself on first press. */
  const python = usePython({ preload: false });
  const [source, setSource] = useState("n = int(input())\nprint(n * n)\n");
  const [stdin, setStdin] = useState("7");
  const [result, setResult] = useState<LocalRunResult | null>(null);
  const [busy, setBusy] = useState(false);

  const { run } = python;
  const runBackup = useCallback(async () => {
    setBusy(true);
    setResult(null);
    setResult(await run({ source, stdin }));
    setBusy(false);
  }, [run, source, stdin]);

  return (
    <section className="flex flex-col gap-4 rounded-[12px] border-2 border-sx-partial p-4">
      <h2 className="text-[16px] font-bold uppercase tracking-wide text-sx-partial">
        Backup path — Python. Not the product.
      </h2>

      <p className="text-[13px] leading-5 text-b-fg/60">
        Production ships C++17 only. This runs CPython in <strong>this browser</strong> and
        compares it against <strong>nothing</strong>: there is no Python judge to compare it to.{" "}
        <code>ExecutionRequest.language</code> is the one-member union <code>&quot;cpp17&quot;</code>
        , <code>/api/exec/run</code> compiles C++, and sending Python source to it would produce a
        compile error rather than a second opinion. Nothing on this pane describes the live judge —
        for that, read the strip at the top of the page.
      </p>

      <p className="text-[13px] leading-5 text-b-fg/40">
        Kept so the retained runtime under <code>src/lib/pyodide</code> can still be exercised by
        hand. Needs <code>public/pyodide</code>, which <code>predev</code> writes and{" "}
        <code>scripts/strip-python-assets.mjs</code> removes before a production build. See the
        header of <code>schools/execution/python-policy.ts</code> before wiring anything to this.
      </p>

      <dl className="grid grid-cols-[12rem_1fr] gap-y-1 font-b-mono text-[13px]">
        <dt className="text-b-fg/50">phase</dt>
        <dd>{python.phase}</dd>
        <dt className="text-b-fg/50">pyodide</dt>
        <dd>{python.pyodideVersion ?? "—"}</dd>
        <dt className="text-b-fg/50">python (reported)</dt>
        <dd>{python.pythonVersion ?? "—"}</dd>
        <dt className="text-b-fg/50">backup judge pin</dt>
        {/* Rendered here and NOWHERE else on this page. It is a decision the
            backup module records, not a description of anything running: no
            provider sends it and no request carries it. */}
        <dd className="text-b-fg/40">
          {PYTHON_RUNTIME.version} · nothing sends this
        </dd>
        <dt className="text-b-fg/50">trust</dt>
        <dd>client_local</dd>
      </dl>

      {python.error ? (
        <p className="font-b-mono text-[12px] leading-4 text-sx-wrong">{python.error}</p>
      ) : null}

      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        rows={6}
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
          onClick={runBackup}
          disabled={busy}
          className="h-12 w-64 rounded-full border-2 border-sx-partial font-medium text-sx-partial disabled:opacity-40"
        >
          {busy ? "running…" : "Run in the browser only"}
        </button>
        <span className="text-[13px] text-b-fg/40">
          One engine. No judge call, no comparison, no agreement banner.
        </span>
      </div>

      <LocalPane result={result} busy={busy} />
    </section>
  );
}
