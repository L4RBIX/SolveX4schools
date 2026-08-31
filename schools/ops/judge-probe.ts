import "server-only";
import { config, trustedProviderConfigured } from "@schools/config";
import { CPP_STANDARD_MACRO } from "@schools/execution/cpp-runtime";
import { redactUrl } from "./admin-gate";
import { counterSnapshot } from "./counters";
import { providerQuota, type ProviderQuota } from "./provider-quota";

/**
 * The trusted judge, described and — on request — actually tried.
 *
 * ## Two questions, and only one of them is free
 *
 * *Is a judge configured, and which one?* is answerable from the environment
 * and costs nothing. Every caller gets it, on every poll, unconditionally.
 *
 * *Does it work?* is only answerable by using it, and against a metered judge
 * using it costs money. So the second question is opt-in and is never asked by
 * a monitor on a timer. That split already existed in `health.ts`; this file
 * keeps it and makes the price explicit — `probeCost` says, in requests, what
 * pressing the button spends.
 *
 * ## Why it lives here rather than in `health.ts`
 *
 * Because two surfaces need it. The admin health report needs it to answer "is
 * the judge up", and the execution dev lab needs it to answer "what compiler
 * am I being compared against". Building it twice would produce two answers to
 * the same question, and the one people would believe is whichever one was
 * green.
 *
 * ## Nothing here may leak a secret
 *
 * No key, no key length, no key prefix, no header, no raw provider response
 * body, no URL with credentials in it. Endpoints are reduced to a host by
 * `redactUrl`, and every failure sentence is either one the provider wrote by
 * hand for a learner to see or one written here. The provider's own contract is
 * that `Judge0Failure.message` carries nothing derived from a response — see
 * the comment on that class — which is what makes it safe to echo.
 */

/* -------------------------------------------------------------------------- */
/* The free half: what the environment says                                    */
/* -------------------------------------------------------------------------- */

/** Judge0-only configuration, none of it secret. */
export interface MeteredJudgeConfig {
  /**
   * Whether a key is present. Never the key, never a prefix of it, never its
   * length — the only fact anybody needs from a health page is present/absent,
   * and every richer form of it is a step toward publishing the credential.
   */
  keyPresent: boolean;
  /** Host only, so "pointing at the wrong judge" is still readable. */
  host: string | null;
  /**
   * `JUDGE0_LANGUAGE_ID`, when an operator pinned one.
   *
   * Not a secret and worth stating plainly: a pinned id means nothing in this
   * system knows WHICH compiler produced a learner's evidence, because the name
   * and version only come back from discovery — and it means the GCC-11 floor
   * that guarantees a `gnu++17` default was never applied.
   */
  pinnedLanguageId: number | null;
  /** The process-wide ceiling on submissions in flight. */
  maxConcurrentRequests: number;
  /** `POST /submissions/batch`. Off by default and unverified against a real plan. */
  batchEnabled: boolean;
}

export interface TrustedJudgeConfig {
  /** `EXEC_PROVIDER`, verbatim. Includes values this build does not recognise. */
  provider: string;
  /**
   * Does this provider have everything it needs to run?
   *
   * Per provider, and deliberately not "is it piston with a URL". An
   * unrecognised `EXEC_PROVIDER` reports `false`: a typo'd value falls back to
   * the local provider at runtime, and a health view that called that
   * "configured" would report a deployment as fine while it silently ran
   * learner code in a subprocess nobody chose.
   */
  configured: boolean;
  /** Host and port only, or `null` when the provider has no endpoint at all. */
  endpoint: string | null;
  /** Whether anything this provider produces may become evidence. */
  trusted: boolean;
  /**
   * Does learner source code leave our own infrastructure?
   *
   * `null` for `piston`, honestly: a self-hosted judge is wherever `PISTON_URL`
   * points, and this process cannot know whether that host is in the same
   * building or on another continent. See `docs/CODE_EXECUTION_DECISION.md`.
   */
  leavesProviderBoundary: boolean | null;
  /** Present only when the configured provider is the metered one. */
  metered: MeteredJudgeConfig | null;
}

export function trustedJudgeConfig(): TrustedJudgeConfig {
  const { provider } = config.exec;
  const trusted = trustedProviderConfigured(provider);

  switch (provider) {
    case "judge0_rapidapi":
      return {
        provider,
        configured: Boolean(config.exec.judge0.apiKey),
        endpoint: redactUrl(config.exec.judge0.baseUrl),
        trusted,
        /* The one unambiguous case. RapidAPI is not in Kazakhstan and this is
           the fact the programme decision turns on, so it is stated rather than
           inferred from a hostname. */
        leavesProviderBoundary: true,
        metered: {
          keyPresent: Boolean(config.exec.judge0.apiKey),
          host: config.exec.judge0.host,
          pinnedLanguageId: config.exec.judge0.languageId ?? null,
          maxConcurrentRequests: config.exec.judge0.maxConcurrentRequests,
          batchEnabled: config.exec.judge0.batchEnabled,
        },
      };
    case "piston":
      return {
        provider,
        configured: Boolean(config.exec.pistonUrl),
        endpoint: redactUrl(config.exec.pistonUrl),
        trusted,
        leavesProviderBoundary: null,
        metered: null,
      };
    case "local":
      return {
        provider,
        // A subprocess on this machine. Nothing to configure and nowhere to go.
        configured: true,
        endpoint: null,
        trusted,
        leavesProviderBoundary: false,
        metered: null,
      };
    case "none":
      return {
        /* Configured, and configured to have no judge. A supported deployment,
           not a broken one — the capability loss is stated by `hybridCheck`,
           which is where it belongs, and reporting `configured: false` here
           would put a red light on a deliberate choice. */
        provider,
        configured: true,
        endpoint: null,
        trusted,
        leavesProviderBoundary: false,
        metered: null,
      };
    default:
      return {
        provider,
        configured: false,
        endpoint: null,
        trusted,
        leavesProviderBoundary: null,
        metered: null,
      };
  }
}

/* -------------------------------------------------------------------------- */
/* The paid half: what happens when we actually call it                        */
/* -------------------------------------------------------------------------- */

/** The compiler the judge says it will use, as far as it can be established. */
export interface DiscoveredRuntime {
  /** The language id the judge will be sent. */
  id: number;
  /** The judge's own name for it, verbatim — e.g. `C++ (GCC 14.1.0)`. */
  name: string;
  /**
   * The version parsed out of that name, or `null` when nothing knows it.
   *
   * `null` is what an operator override produces, and it is a real answer with
   * a real consequence: a learner's evidence was produced by a compiler this
   * system cannot name.
   */
  version: string | null;
  /** `true` when the id came from `JUDGE0_LANGUAGE_ID` and not from the judge. */
  operatorOverride: boolean;
}

export interface JudgeProbe {
  ranAt: string;
  /** Wall time for the whole probe, ours and the judge's together. */
  ms: number;
  /**
   * Did anything at the other end answer?
   *
   * `null` when nothing was attempted — `EXEC_PROVIDER=none`, or a provider
   * that is not configured. False means a call was made and nothing usable came
   * back, which is the difference between "not set up" and "set up and broken".
   */
  reachable: boolean | null;
  /** What discovery found, when the provider can be asked. */
  runtime: DiscoveredRuntime | null;
  /**
   * Why there is no runtime above. A sentence an operator can act on, never a
   * provider response body.
   */
  runtimeProblem: string | null;
  /** The canary program, run through the real provider on the real path. */
  execution: {
    /** The port's `ExecutionStatus`, as a string. Judge0 ids never reach here. */
    status: string;
    /**
     * Did the judge answer with the standard this course requires?
     *
     * The canary prints `__cplusplus`, so this is `true` only when the judge
     * compiled as C++17. A probe that asserted nothing about the standard would
     * go green against a GCC 9 that rejects every lesson from October onwards —
     * a probe that keeps passing while pointed at the wrong compiler is worse
     * than one that fails, because it is the thing people check first.
     */
    ok: boolean;
    /** As the judge measured it. */
    timeMs: number;
    /** True means nothing was measured — the judge, not the program. */
    infrastructure: boolean;
  } | null;
  executionProblem: string | null;
  /**
   * Requests this probe spent, as counted at the provider's HTTP boundary.
   *
   * `null` has two meanings and they are separated by `cost.metered`: for an
   * unmetered provider nothing is counted because nothing is billed; for the
   * metered one, `null` after a probe that definitely made calls means a
   * request reached the judge without passing through `httpJson`, where the
   * accounting lives. Every cost figure in this report would then be measuring
   * nothing, which is worth surfacing rather than reporting a confident zero.
   *
   * This check was written when `recordJudge0Request` had no caller at all —
   * it was documented, referenced by the setup runbook, and dead. It is wired
   * now (`tests/ops/judge0-accounting.test.ts` proves it), so the branch has
   * gone from describing the normal case to describing an anomaly. Kept
   * because a silent zero on a metered plan is the wrong thing to show an
   * operator whichever way it happens.
   */
  cost: {
    metered: boolean;
    requests: number | null;
    submissions: number | null;
    polls: number | null;
    /** The last quota reading the provider observed, if it ever has. */
    quota: ProviderQuota | null;
    note: string;
  };
}

const NOT_ATTEMPTED = (why: string, ranAt: string): JudgeProbe => ({
  ranAt,
  ms: 0,
  reachable: null,
  runtime: null,
  runtimeProblem: why,
  execution: null,
  executionProblem: why,
  cost: {
    metered: false,
    requests: null,
    submissions: null,
    polls: null,
    quota: null,
    note: "Nothing was called, so nothing was spent.",
  },
});

/**
 * Call the judge, once.
 *
 * Costs, against Judge0: one `GET /languages` on the first probe of a process
 * (discovery is cached afterwards), one `POST /submissions`, and one poll per
 * round until it answers. Three or four requests in the ordinary case, and
 * that is why nothing calls this on a timer. A compile makes the polls a little
 * more likely than an interpreted run did; it does not change the shape.
 *
 * Never throws. Every failure is a field.
 */
export async function probeTrustedJudge(): Promise<JudgeProbe> {
  const ranAt = new Date().toISOString();
  const started = Date.now();
  const cfg = trustedJudgeConfig();
  const before = counterSnapshot().values;

  if (cfg.provider === "none") {
    return NOT_ATTEMPTED(
      "EXEC_PROVIDER=none — this deployment has no trusted judge, by choice. " +
        "Nothing was called.",
      ranAt,
    );
  }
  if (!cfg.configured) {
    /* Refusing to call rather than calling and failing. A judge0 deployment
       with no key would 401 on every request, and spending a request to
       discover something the environment already said is the sort of thing that
       looks harmless until a monitor does it every thirty seconds. */
    return NOT_ATTEMPTED(
      `EXEC_PROVIDER=${cfg.provider} is not fully configured, so no call was made. ` +
        "Fix the configuration problems reported beside this check first.",
      ranAt,
    );
  }

  let runtime: DiscoveredRuntime | null = null;
  let runtimeProblem: string | null = null;
  let reachable: boolean | null = null;

  if (cfg.provider === "judge0_rapidapi") {
    const discovery = await discoverRuntime();
    runtime = discovery.runtime;
    runtimeProblem = discovery.problem;
    reachable = discovery.reachable;
  } else {
    runtimeProblem =
      `The ${cfg.provider} provider does not report which compiler it will use. ` +
      "The version this system claims for it is the written-down number in " +
      "schools/execution/cpp-runtime.ts, which nothing verifies at runtime. For " +
      "piston that number carries an open question of its own: which standard " +
      "its c++ run script compiles with has never been checked against a real " +
      "host, and the canary below is the thing that would answer it.";
  }

  let execution: JudgeProbe["execution"] = null;
  let executionProblem: string | null = null;

  if (runtimeProblem !== null && reachable === false) {
    /* Discovery already proved the judge will not talk to us. The canary would
       fail identically and cost another request to say so. */
    executionProblem =
      "Skipped: the judge could not be reached for language discovery, so a " +
      "submission would fail the same way and spend another request proving it.";
  } else {
    const ran = await runTrivialProgram();
    execution = ran.execution;
    executionProblem = ran.problem;
    if (ran.execution !== null && !ran.execution.infrastructure) reachable = true;
    else if (reachable === null) reachable = false;
  }

  const after = counterSnapshot().values;
  const metered = cfg.provider === "judge0_rapidapi";
  const delta = (key: "judge0.requests" | "judge0.submissions" | "judge0.polls"): number =>
    after[key] - before[key];

  return {
    ranAt,
    ms: Date.now() - started,
    reachable,
    runtime,
    runtimeProblem,
    execution,
    executionProblem,
    cost: {
      metered,
      requests: metered && delta("judge0.requests") > 0 ? delta("judge0.requests") : null,
      submissions: metered && delta("judge0.requests") > 0 ? delta("judge0.submissions") : null,
      polls: metered && delta("judge0.requests") > 0 ? delta("judge0.polls") : null,
      quota: metered ? providerQuota() : null,
      note: metered
        ? delta("judge0.requests") > 0
          ? "Billable requests this probe spent, counted at the provider's HTTP boundary."
          : "This probe called a metered judge and the request counters did not move. " +
            "`recordJudge0Request` IS wired into the provider's HTTP layer " +
            "(`classifyJudge0Request` in providers/judge0.ts), so this should not happen: " +
            "either the probe made no call at all, or a request reached the judge by some " +
            "path that does not go through `httpJson`. Every cost and quota figure below " +
            "is therefore measuring nothing. It is NOT a claim that the probe was free."
        : "This provider is not metered, so nothing counts requests for it.",
    },
  };
}

/**
 * `GET /languages`, and what it found.
 *
 * Goes to `judge0FromConfig` rather than through `getExecutionProvider`,
 * because discovery is not part of the execution port and must not be: nothing
 * above the port may learn that this provider has a vendor, a language
 * catalogue or a marketplace behind it. The two instances share the process's
 * language cache and its concurrency gate — both are memoised on `globalThis` —
 * so this does not double anything.
 *
 * The import is dynamic so that merely importing the health module does not
 * pull a key-holding file into its graph.
 */
async function discoverRuntime(): Promise<{
  runtime: DiscoveredRuntime | null;
  problem: string | null;
  /** `null` when no request was made — see the operator-override branch. */
  reachable: boolean | null;
}> {
  try {
    const { judge0FromConfig } = await import("@schools/exec/providers/judge0");
    const language = await judge0FromConfig().language();
    if (language.operatorOverride) {
      return {
        runtime: {
          id: language.id,
          name: language.name,
          version: language.version,
          operatorOverride: true,
        },
        /* Not an error, and still worth a sentence. A pinned id is a decision
           somebody made, and its cost is that this report cannot say which
           compiler a learner was graded on — nor whether it defaults to
           `gnu++17`, which is the check discovery exists to perform. */
        problem:
          "JUDGE0_LANGUAGE_ID is set, so discovery was skipped and the judge was not " +
          "asked which compiler this id is, or whether it is new enough to compile " +
          "C++17 without a flag this plan refuses. Unset it to have both checked.",
        /* NOT `true`. An override makes no request at all, so nothing here has
           reached anything — claiming reachable would be reporting a network
           fact we did not observe, and it would survive even when the
           submission that follows fails outright. `null` lets the execution
           probe be the one that answers, which is the only thing that will. */
        reachable: null,
      };
    }
    return {
      runtime: {
        id: language.id,
        name: language.name,
        version: language.version,
        operatorOverride: false,
      },
      problem: null,
      reachable: true,
    };
  } catch (err) {
    return { runtime: null, problem: discoveryProblem(err), reachable: false };
  }
}

/**
 * A discovery failure, said in words an operator can act on.
 *
 * The provider throws a `Judge0Failure` whose message is written by hand at the
 * throw site and carries nothing derived from a response — that is the class's
 * documented contract, and it is what makes echoing the message safe. The class
 * is not exported, so it is recognised by `name`; anything else is run through
 * the same URL-stripping reduction as every other error in this module.
 */
function discoveryProblem(err: unknown): string {
  if (err instanceof Error && err.name === "Judge0Failure") {
    return `Language discovery failed: ${err.message}.`;
  }
  const raw = err instanceof Error ? err.message : String(err);
  return `Language discovery failed: ${raw.replace(/[a-z+]+:\/\/[^\s]*/gi, "(url)").slice(0, 200)}`;
}

/**
 * The canary, through the real provider on the real path.
 *
 * Through `getExecutionProvider` on purpose, decorators and all: a probe that
 * bypassed the size guard and the counters would be exercising a code path no
 * learner uses.
 *
 * ## Why it prints `__cplusplus` rather than `1`
 *
 * The old probe ran `print(1)` and asked whether the judge said `1`. Ported
 * naively that becomes a C++ program printing `1`, which is a strictly worse
 * test than it looks: **every** C++ compiler in Judge0's catalogue passes it,
 * including the three GCCs that default to `gnu++14` and would reject the
 * language from October onwards. The probe would stay green while pointed at a
 * compiler that cannot run the course, which is the failure mode a probe exists
 * to prevent rather than to demonstrate.
 *
 * So the canary answers the only question worth a paid request: *did this judge
 * compile my program as C++17?* `__cplusplus` is the compiler's own answer, it
 * costs the same one submission, and `201703` is a value nothing else produces.
 * `compiler_options` is refused with HTTP 403 on this plan, so the macro is
 * also the ONLY way to find out — there is no flag to send and no field to read.
 *
 * Still deliberately trivial: no input, no allocation, one line of output.
 */
export const JUDGE_CANARY_SOURCE = [
  "#include <iostream>",
  "int main(){ std::cout << __cplusplus; }",
].join("\n");

/** What the canary must print. Anything else is a judge this course cannot use. */
const JUDGE_CANARY_EXPECTED = String(CPP_STANDARD_MACRO);

async function runTrivialProgram(): Promise<{
  execution: JudgeProbe["execution"];
  problem: string | null;
}> {
  try {
    const { getExecutionProvider } = await import("@schools/exec");
    const provider = await getExecutionProvider();
    if (provider === null) {
      return { execution: null, problem: "There is no trusted provider to call." };
    }
    const result = await provider.run({
      language: "cpp17",
      sourceCode: JUDGE_CANARY_SOURCE,
      stdin: "",
      /* Longer than the old 3 s, because this one COMPILES. A cold GCC on a
         rented judge is comfortably under a second, but a budget that fitted an
         interpreter starting up is not a budget for a toolchain, and a probe
         timing out on its own ceiling would be reported as the judge being
         down. */
      timeLimitMs: 5_000,
      memoryLimitMb: 64,
    });
    const printed = result.stdout.trim();
    const ok = result.status === "ok" && printed === JUDGE_CANARY_EXPECTED;
    return {
      execution: {
        status: result.status,
        ok,
        timeMs: result.timeMs,
        infrastructure: result.infrastructureError,
      },
      problem: result.infrastructureError
        ? `The judge did not answer the canary program: ${result.status}.`
        : ok
          ? null
          : result.status === "ok"
            ? `The judge compiled the canary but reported __cplusplus as ` +
              `${printed || "nothing at all"} rather than ${JUDGE_CANARY_EXPECTED}. It is ` +
              "running, and it is not running C++17 — every lesson using a C++17 " +
              "feature will be marked wrong. This plan refuses compiler_options, so " +
              "the fix is a newer compiler on the judge, not a flag."
            : `The judge answered the canary with ${result.status} rather than ` +
              `${JUDGE_CANARY_EXPECTED}.`,
    };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    return {
      execution: null,
      problem: `The judge could not be called: ${raw.replace(/[a-z+]+:\/\/[^\s]*/gi, "(url)").slice(0, 200)}`,
    };
  }
}
