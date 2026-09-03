import "server-only";
import { config, executionProviderProblems, trustedProviderConfigured } from "@schools/config";
import { judge0GateSnapshot } from "@schools/exec/providers/judge0";
import { getStoreHandle } from "@schools/store";
import type { Localized } from "@schools/curriculum/types";
import {
  capabilityFor,
  TRUST_POLICY,
  type ExecutionSurface,
  type SurfaceCapability,
} from "@schools/execution/trust-policy";
import { redactUrl } from "./admin-gate";
import { counterSnapshot, type CounterSnapshot } from "./counters";
import { curriculumFingerprint, type CurriculumFingerprint } from "./fingerprint";
import {
  probeTrustedJudge,
  trustedJudgeConfig,
  type JudgeProbe,
  type TrustedJudgeConfig,
} from "./judge-probe";
import { providerQuota } from "./provider-quota";
import { localRuntimeAvailability, type LocalRuntimeAvailability } from "./runtime-availability";
import {
  assistanceHealth,
  learningActivity,
  reducerHealth,
  type AssistanceHealth,
  type LearningActivity,
  type ReducerHealth,
} from "./observability";

/**
 * The health report.
 *
 * ## One builder, two audiences
 *
 * `buildAdminHealth` produces everything. `teacherHealth` projects that down to
 * what a person standing in front of a class can act on. They are built in that
 * order on purpose: a teacher view assembled independently would eventually
 * disagree with the admin view about whether the product is working, and the
 * one people trust would be the one that says "fine".
 *
 * ## Nothing here may leak a secret
 *
 * No environment values, no key material, no URL with credentials in it, no
 * database connection string, no learner identifier, no learner text. Provider
 * endpoints are reduced to a host by `redactUrl`. The config-problem strings
 * name VARIABLES, never their values — that is a property of
 * `executionProviderProblems`, which is asserted by
 * `tests/school/production-config.test.ts`, and it is why those strings can be
 * echoed here at all.
 *
 * ## Every check is individually fallible
 *
 * A health endpoint that 500s because one of its own probes threw is worse than
 * no health endpoint: it turns "the judge is unreachable" into "the whole app
 * is down", which is a different page of the runbook. So each check below is
 * wrapped, and a check that throws reports itself as `down` with its own reason
 * while the rest of the report still renders.
 */

export type CheckStatus = "ok" | "degraded" | "down";

export interface Check {
  status: CheckStatus;
  /** Machine-readable. Never a sentence, never localised. */
  detail: Record<string, string | number | boolean | null>;
  /** Things an admin should fix. Names variables, never values. */
  problems: string[];
}

/**
 * The month's model spend, against the ceilings someone chose.
 *
 * Reported because the failure it describes is silent by design: when a monthly
 * ceiling is reached, `checkAndConsumeBudget` refuses BEFORE the provider is
 * called and every learner gets the same polite line about trying later. From
 * the outside that is indistinguishable from a working tutor having a quiet
 * afternoon. The only place the difference is visible is here.
 *
 * `usedShare` is the number an operator actually acts on. "1.4 million input
 * tokens" means nothing on its own; "68% of the month, on the 11th" means buy
 * more or turn the ceiling up before a Tuesday lesson runs into it.
 */
export interface NovaSpend {
  /** `YYYY-MM` in UTC, so the window a number belongs to is never ambiguous. */
  month: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  /** Derived from the tokens at the configured price. Never billed, never authoritative. */
  costUsd: number;
  limits: {
    /** Per learner per day. Zero disables it. */
    dailyRequests: number;
    monthlyInputTokens: number;
    monthlyOutputTokens: number;
    monthlyCostUsd: number;
    inputUsdPerMTok: number;
    outputUsdPerMTok: number;
  };
  /** 0–1 against each ceiling, or null where the ceiling is disabled. */
  usedShare: {
    inputTokens: number | null;
    outputTokens: number | null;
    costUsd: number | null;
  };
}

export interface AdminHealth {
  view: "admin";
  ok: boolean;
  status: CheckStatus;
  checkedAt: string;
  web: Check;
  database: Check;
  /**
   * The judge as a service.
   *
   * `judge` is what the environment says and costs nothing to read. `probe` is
   * what happened when we actually called it, and is `null` unless a caller
   * asked — against a metered judge that call is billable, so it is opt-in and
   * never on a timer. Both are structured beside `detail` for the same reason
   * `hybrid` carries `evidence`: a flat record of strings and numbers is what a
   * `curl` in a runbook wants, and a shape with a type on it is what a UI wants,
   * and building the second from the first is how they drift.
   */
  execution: Check & { judge: TrustedJudgeConfig; probe: JudgeProbe | null };
  /**
   * The two halves together: whether a learner can run code at all, and
   * whether anything they Submit can become evidence.
   *
   * Separate from `execution` because they answer different questions.
   * `execution` is about the judge as a service — is it configured, does it
   * answer. This is about the CAPABILITY the deployment has as a result, and it
   * is the one an admin actually needs: a perfectly healthy judge that is not
   * configured produces exactly as much evidence as a broken one.
   */
  hybrid: Check & { evidence: HybridEvidence; localRuntime: LocalRuntimeAvailability };
  /** `spend` is null when the ledger could not be read — a zero would be a lie. */
  nova: Check & { spend: NovaSpend | null };
  curriculum: Check & { fingerprint: CurriculumFingerprint };
  reducer: Check & { reducer: ReducerHealth };
  learning: Check & { activity: LearningActivity | null; assistance: AssistanceHealth | null };
  counters: CounterSnapshot;
}

/**
 * What this deployment can and cannot claim about a learner.
 *
 * Every field is DERIVED from `schools/execution/trust-policy.ts` rather than
 * decided here. That is the whole reason the policy table exists: the answer to
 * "may a browser result settle this surface" must have exactly one author, and
 * a health report that computed its own version would eventually disagree with
 * the code that grades — reporting green while the product refuses, or the
 * reverse, which is worse.
 */
export interface HybridEvidence {
  /**
   * Is there a judge whose word counts? `EXEC_PROVIDER=none` means no, and
   * that is a supported deployment rather than an outage.
   */
  trustedProviderConfigured: boolean;
  /**
   * The load-bearing line. False means every check that was supposed to prove
   * a learner solved something unaided produces NOTHING — not weaker evidence,
   * not evidence with an asterisk — and a human has to do it instead.
   */
  submitProducesEvidence: boolean;
  /** Per surface, so "which parts still work" is readable rather than inferred. */
  surfaces: {
    surface: ExecutionSurface;
    checkProducesEvidence: boolean;
    degradedMode: SurfaceCapability["degradedMode"];
  }[];
}

/** What a teacher is told. Plain language, both languages, no infrastructure. */
export interface TeacherHealth {
  view: "teacher";
  ok: boolean;
  status: CheckStatus;
  checkedAt: string;
  capabilities: { id: TeacherCapability; status: CheckStatus; message: Localized }[];
}

export type TeacherCapability =
  | "lessons"
  | "saving_progress"
  /**
   * Can a learner press Run and see output?
   *
   * Separate from `code_checking`, because to a teacher they fail differently
   * and on different afternoons. Running happens in the child's browser and
   * breaks when a 13 MB download does not arrive; checking happens on our
   * judge and breaks when the judge does. A class that cannot run anything is
   * stuck at the first line; a class that cannot be checked can keep working
   * all lesson and be marked later. One sentence cannot say both.
   */
  | "running_code"
  | "code_checking"
  | "nova"
  | "class_view";

/* -------------------------------------------------------------------------- */

/** The process's own start, so uptime is real rather than "since this request". */
const STARTED_AT = Date.now();

function worst(...statuses: CheckStatus[]): CheckStatus {
  if (statuses.includes("down")) return "down";
  if (statuses.includes("degraded")) return "degraded";
  return "ok";
}

/**
 * `guarded`, for the one check that returns more than a `Check`.
 *
 * Its own function rather than a generic parameter on `guarded`: the fallback
 * has to supply `judge` and `probe` as well as the three `Check` fields, and a
 * generic that takes an "extra" object to spread would make every other call
 * site pass an empty one to serve this single case.
 *
 * The fallback still reports the CONFIGURATION. If `executionCheck` threw, the
 * environment read is almost certainly not the thing that broke, and an admin
 * looking at a failed check still needs to know which judge was supposed to be
 * answering. It is wrapped again because a fallback that throws leaves the
 * whole report 500ing, which is the failure mode this pattern exists to avoid.
 */
async function guardedExecution(probe: boolean): Promise<AdminHealth["execution"]> {
  try {
    return await executionCheck(probe);
  } catch (err) {
    let judge: TrustedJudgeConfig;
    try {
      judge = trustedJudgeConfig();
    } catch {
      judge = {
        provider: "(unreadable)",
        configured: false,
        endpoint: null,
        trusted: false,
        leavesProviderBoundary: null,
        metered: null,
      };
    }
    return {
      status: "down",
      detail: { checked: false, provider: judge.provider, endpoint: judge.endpoint },
      problems: [`execution check failed: ${errText(err)}`],
      judge,
      probe: null,
    };
  }
}

async function guarded(name: string, fn: () => Promise<Check>): Promise<Check> {
  try {
    return await fn();
  } catch (err) {
    return failed(name, err);
  }
}

function failed(name: string, err: unknown): Check {
  return {
    status: "down",
    detail: { checked: false },
    /* The message, not the stack, and not the exception object. A driver
       error message can contain a connection string; `String(err)` on a
       `pg` error frequently does. Trimmed hard for the same reason. */
    problems: [`${name} check failed: ${errText(err)}`],
  };
}

/**
 * An error reduced to something safe to publish.
 *
 * Truncated, and stripped of anything that looks like a URL with credentials.
 * The alternative — printing the raw message — is how a health endpoint ends up
 * publishing `postgres://user:hunter2@…` the first time the database refuses a
 * connection.
 */
function errText(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw.replace(/[a-z+]+:\/\/[^\s]*/gi, "(url)").slice(0, 200);
}

/* -------------------------------------------------------------------------- */

function webCheck(): Check {
  return {
    status: "ok",
    detail: {
      // We are answering, so the app is up. The value of this check is the
      // context beside it, not the verdict.
      environment: config.environment,
      runtime: "nodejs",
      uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
      startedAt: new Date(STARTED_AT).toISOString(),
      nodeVersion: process.version,
      sweepInProcess: config.sweep.inProcess,
      /* Whether verdicts can be signed. The absence of the secret is reported;
         the secret itself is not, and neither is its length. */
      attestationConfigured: Boolean(config.attestationSecret),
    },
    problems:
      !config.attestationSecret && config.environment === "production"
        ? ["LEARNING_ATTESTATION_SECRET is unset in production — every verdict downgrades to browser trust."]
        : [],
  };
}

async function databaseCheck(): Promise<Check> {
  const started = Date.now();
  const { sql } = await getStoreHandle();
  await sql.query("select 1");
  const latencyMs = Date.now() - started;

  const problems: string[] = [];
  /* Ephemeral storage is the failure that looks like nothing until a redeploy,
     at which point a month of a class's work is gone. It is a `degraded` rather
     than a `down` because the product genuinely works — right up until it
     doesn't. */
  const durable = Boolean(config.databaseUrl) || !config.dataDir.startsWith(".");
  if (!durable && config.environment !== "development") {
    problems.push(
      "No DATABASE_URL and LEARNING_DATA_DIR is a relative path. On an ephemeral " +
        "filesystem every learner's progress is lost on redeploy.",
    );
  }

  return {
    status: problems.length > 0 ? "degraded" : "ok",
    detail: {
      // WHICH driver, never WHERE. `config.databaseUrl` is a connection string
      // with a password in it and is never reported, in any form.
      driver: config.databaseUrl ? "postgres" : "pglite",
      durable,
      latencyMs,
    },
    problems,
  };
}

/**
 * The judge.
 *
 * ## The free half and the paid half
 *
 * Everything an operator can know without spending anything is reported on
 * every call: which provider, whether it is configured, where it points,
 * whether it is metered, and — for a metered one — the last quota reading any
 * real submission happened to observe. None of that costs a request, so a
 * monitor polling every thirty seconds costs the plan nothing.
 *
 * `probe` is the paid half, and it is OFF by default and must stay that way.
 * Against a rented judge it is not merely load, it is money: a `GET /languages`
 * on the first probe of a process, a `POST /submissions`, and a poll per round
 * until an answer arrives. A monitor doing that twice a minute would burn a
 * free tier's daily allowance before the first lesson. It exists for the one
 * moment it is worth its cost — a human asking "is the judge actually up, and
 * is it compiling C++17?" during a lesson — and `detail.probeRequests` says
 * what pressing it spent.
 *
 * ## The three questions the probe answers, in the order it stops asking them
 *
 * 1. Is anything there, and will it take our credentials? (`GET /languages`)
 * 2. Which compiler will it use — id, name, version?
 * 3. Does the canary come back reporting `__cplusplus` as 201703?
 *
 * (3) is the one that changed shape with the language and is worth reading
 * twice: it is not "does the judge run a program", which every compiler in the
 * catalogue would pass, but "does the judge run THIS standard". See
 * `runTrivialProgram` in `judge-probe.ts`.
 *
 * A failure at (1) skips (3) rather than spending a second request to fail the
 * same way twice.
 */
async function executionCheck(probe: boolean): Promise<AdminHealth["execution"]> {
  const problems = executionProviderProblems(config.environment, config.exec);
  const judge = trustedJudgeConfig();
  /* Free on every call: whatever the last REAL submission observed. This is the
     number that says "the class is about to stop working", and making it wait
     for an opt-in probe would mean the one call that costs money is the only
     one that can warn you about running out of money. */
  const quota = judge.metered ? providerQuota() : null;

  const detail: Check["detail"] = {
    provider: judge.provider,
    /* Host and port only, and now for whichever provider has an endpoint — it
       used to read `config.exec.pistonUrl` unconditionally, which reported
       `null` for a Judge0 deployment and made a correctly-configured rented
       judge look like it pointed nowhere. See `redactUrl` for why the rest of a
       URL is dropped. */
    endpoint: judge.endpoint,
    /* Per provider. The old expression was `provider !== "piston" || pistonUrl`,
       which answered "is it a configured piston" and said `true` for everything
       else — including a `judge0_rapidapi` deployment with no key, which is the
       exact case an admin most needs to see, and including a typo'd
       EXEC_PROVIDER that silently falls back to running code in a local
       subprocess. */
    configured: judge.configured,
    /* Reported here as a fact about the provider, and acted on in `hybridCheck`
       where it becomes a capability. Repeated in both places on purpose: this
       is the check somebody reads when they are looking at the judge, and
       leaving it out would make a `none` deployment look like a configured
       one until they scrolled. */
    trustedProvider: judge.trusted,
    /* Whether learner source code leaves our own infrastructure. `null` for a
       self-hosted judge, honestly — that depends on where PISTON_URL points and
       this process cannot know. See docs/CODE_EXECUTION_DECISION.md. */
    leavesProviderBoundary: judge.leavesProviderBoundary,
    metered: judge.metered !== null,
    probed: probe,
  };

  if (judge.metered) {
    /* Facts about the plan, none of them secret. Present/absent for the key and
       nothing more — not a prefix, not a length. */
    detail.keyPresent = judge.metered.keyPresent;
    detail.languageIdPinned = judge.metered.pinnedLanguageId;
    detail.maxConcurrentRequests = judge.metered.maxConcurrentRequests;
    detail.batchEnabled = judge.metered.batchEnabled;
    /*
     * How loaded the gate is RIGHT NOW, on this instance.
     *
     * The number an operator wants during a lesson and could not previously
     * get: `queueDepth` is how many Checks are waiting for a slot, and a
     * sustained non-zero value is a class arriving faster than the plan's
     * concurrency can serve — which reaches learners as "the judge was too busy
     * to take this in time" and reaches nobody else at all.
     *
     * Per instance, and stated as such, because that is what it is: the gate
     * lives in a Node process and the platform runs several. It is a load
     * signal, not a total.
     *
     * `null` before any submission has been graded on this instance, which is
     * the honest answer for a cold lambda and is distinct from a depth of zero.
     * The per-key holdings the gate also tracks are deliberately NOT here: a
     * map keyed by subject id is learner data, and a health payload is not
     * where it belongs.
     */
    const gate = judge0GateSnapshot();
    detail.gateActive = gate?.active ?? null;
    detail.gateQueueDepth = gate?.waiting ?? null;
    detail.maxConcurrentPerLearner = gate?.perKeyLimit ?? null;
    /* `null` throughout when nothing has ever seen a quota header — which is
       either "nothing has called the judge yet" or "this plan does not send
       them". Neither is "no quota left", and a zero here would read as the
       second. */
    detail.quotaRemaining = quota?.remaining ?? null;
    detail.quotaLimit = quota?.limit ?? null;
    detail.quotaResetSeconds = quota?.resetSeconds ?? null;
    detail.quotaObservedAt = quota?.observedAt ?? null;
    /* What `quotaRemaining` is measuring, because on the plan actually rented
       it is NOT requests-left: `limit: 0` with `remaining: -1786` is overage
       already incurred, and the same run made 42 submissions with zero 429s.
       Shipped beside the number so a dashboard cannot render a negative as
       headroom, or clamp it to zero and imply a class is about to be stopped.
       See `schools/ops/provider-quota.ts`. */
    detail.quotaMeaning = quota?.meaning ?? null;
  }

  let status: CheckStatus = problems.length > 0 ? "down" : "ok";

  if (judge.trusted && !judge.configured && problems.length === 0) {
    /*
     * A judge whose word WOULD count, missing the thing it needs to answer.
     *
     * In production this is already a boot failure — `executionProviderProblems`
     * refuses to start — so this branch only fires outside it, which is exactly
     * where it is needed: on a laptop and in preview, a `judge0_rapidapi`
     * deployment with no key used to report a clean green light while every
     * Submit 401'd.
     *
     * Distinct from `EXEC_PROVIDER=none`, which is a CHOICE and is stated by
     * `hybridCheck` without a fault light. This is a half-finished
     * configuration, and `degraded` is the honest colour for it.
     */
    status = worst(status, "degraded");
    problems.push(
      `EXEC_PROVIDER=${judge.provider} names a trusted judge, but it is not fully ` +
        "configured — every Submit will fail before anything runs. In production this " +
        "is a boot failure; outside it, nothing else says so. Note that the lesson UI " +
        "still shows the checking affordance, because trustedProviderConfigured() " +
        "answers 'is this kind of provider trusted' and does not look at credentials.",
    );
  }

  if (quota?.remaining === 0) {
    /* Not `down`: nothing is broken, and it un-breaks itself when the window
       rolls over. But every Submit between now and then produces nothing, so a
       green light would be a lie for as long as it lasts. */
    status = worst(status, "degraded");
    problems.push(
      "The judge's request quota is exhausted" +
        (quota.resetSeconds !== null ? ` and resets in ${quota.resetSeconds}s` : "") +
        ". Until then every Submit reports that nothing could be checked — nobody " +
        "is marked wrong, and nothing is recorded about any learner.",
    );
  }

  if (!probe) return { status, detail, problems, judge, probe: null };

  const result = await probeTrustedJudge();

  /* `probeOk` / `probeStatus` / `probeMs` keep their names. The learning health
     route and any runbook `curl` read them, and renaming a field to tidy it is
     how a monitor starts reporting `undefined` as green. */
  detail.probeMs = result.ms;
  detail.probeOk = result.execution?.ok ?? false;
  detail.probeStatus = result.execution?.status ?? "not_run";
  detail.reachable = result.reachable;
  /* The whole point of the probe against a rented judge: WHICH interpreter. A
     name and a version, or nulls that say plainly that nothing knows. */
  detail.runtimeId = result.runtime?.id ?? null;
  detail.runtimeName = result.runtime?.name ?? null;
  detail.runtimeVersion = result.runtime?.version ?? null;
  detail.runtimeOperatorOverride = result.runtime?.operatorOverride ?? false;
  detail.probeRequests = result.cost.requests;

  /* Both sentences, whatever happened. They were previously pushed only on the
     paths that reached the judge, which meant an explicit probe of a provider
     that was never called reported no reason at all — the single most confusing
     thing a health check can do to somebody who just pressed the button. */
  for (const sentence of [result.runtimeProblem, result.executionProblem]) {
    if (sentence !== null) problems.push(sentence);
  }

  if (result.reachable === null) {
    /*
     * Nothing was called at all.
     *
     * For `none` that is the deployment working as configured — `hybridCheck`
     * states the capability loss in words, and a red light on a deliberate
     * choice is a light somebody mutes.
     *
     * For anything else it means the provider is not configured, and somebody
     * ASKED. Outside production `executionProviderProblems` says nothing about
     * a half-configured judge, so without this an explicit probe of a
     * keyless deployment would come back green.
     */
    detail.probeStatus = judge.provider === "none" ? "no_judge" : "not_attempted";
    if (judge.provider !== "none") status = worst(status, "degraded");
    return { status, detail, problems, judge, probe: result };
  }

  if (result.execution === null || result.execution.infrastructure) {
    status = "down";
  } else if (!result.execution.ok) {
    status = worst(status, "degraded");
  }
  /* The runtime problem does NOT move the status on its own: an operator who
     pinned JUDGE0_LANGUAGE_ID produces one every time, and a judge that runs
     `print(1)` correctly is up whether or not it would name its interpreter. */
  if (result.cost.metered && result.cost.requests === null) {
    problems.push(result.cost.note);
  }

  return { status, detail, problems, judge, probe: result };
}

/**
 * The hybrid capability: can code run, and can anything it produces be claimed?
 *
 * ## Two facts, and neither one is visible from the other
 *
 * A learner presses Run and their browser compiles and executes their C++. A
 * learner presses Submit and it executes on our judge. The first produces no
 * server traffic whatsoever, so a school where the compiler fails to download
 * looks IDENTICAL, from every server-side number in this report, to a school
 * where
 * every lesson went perfectly — silence either way. The second produces the
 * only results anybody may claim anything from, and it produces none at all
 * when `EXEC_PROVIDER=none`.
 *
 * Neither fact is derivable from `execution`, which is about whether the judge
 * answers. Both belong to whoever is asking "is this working for the children
 * in front of me", so they are reported together.
 *
 * ## Why `EXEC_PROVIDER=none` is not `degraded`
 *
 * Because nothing is wrong. A school that chose to run without a judge is
 * running as configured, and turning that into a permanent 503 is how a monitor
 * gets muted before the day it matters. The capability loss is stated instead,
 * unmissably, in `evidence.submitProducesEvidence` and in a problem string that
 * names the consequence — a code task settles as unmeasured and a human has to
 * mark it. An admin reading `ok: true` next to that sentence has been told the
 * truth; one paged at 3 a.m. for a config choice has been trained to ignore it.
 *
 * The statuses here are reserved for something actually being broken: learners
 * unable to run code at all.
 */
function hybridCheck(): AdminHealth["hybrid"] {
  const trusted = trustedProviderConfigured(config.exec.provider);
  const localRuntime = localRuntimeAvailability();

  const surfaces = (Object.keys(TRUST_POLICY) as ExecutionSurface[]).map((surface) => {
    const capability = capabilityFor(surface, trusted);
    return {
      surface,
      checkProducesEvidence: capability.checkProducesEvidence,
      degradedMode: capability.degradedMode,
    };
  });

  const evidence: HybridEvidence = {
    trustedProviderConfigured: trusted,
    /* Asked of the policy table rather than restated as `trusted`. The surface
       is the one the programme counts toward its «~100 толық дербес шешім», so
       if the policy for it ever changes, this number follows instead of lying. */
    submitProducesEvidence: capabilityFor("independent_evidence", trusted).checkProducesEvidence,
    surfaces,
  };

  const problems: string[] = [];
  if (!trusted) {
    problems.push(
      "EXEC_PROVIDER=none: there is no trusted judge, so Submit produces no " +
        "evidence. Learners can still write and run code in the browser, but " +
        "every assessed task settles as unmeasured and needs a teacher. This " +
        "is a configuration choice, not an outage — set EXEC_PROVIDER=piston " +
        "with PISTON_URL to restore it.",
    );
  }

  /*
   * `broken` already carries the "enough samples" rule, so this cannot fire on
   * one learner with a blocked worker — see `MIN_SIGNALS_TO_JUDGE`.
   *
   * With a judge, a dead browser runtime is `degraded`: `/api/exec/run` is
   * still there as the fallback and the lesson works, slowly. Without one it is
   * `down`, because then there is no compiler anywhere — the browser cannot
   * start one and there is no server to ask instead, and a code lesson is
   * simply not deliverable.
   */
  let status: CheckStatus = "ok";
  if (localRuntime.broken) {
    status = trusted ? "degraded" : "down";
    problems.push(
      `The browser compiler failed to start in ${localRuntime.unavailable} of ` +
        `${localRuntime.signals} browser sessions since ${localRuntime.since}. ` +
        `Most common cause reported: ${dominantFailure(localRuntime)}.` +
        (trusted
          ? " Runs are falling back to the server judge."
          : " There is no server fallback either — no code can be run at all."),
    );
  }
  if (localRuntime.rejected > 0) {
    problems.push(
      `${localRuntime.rejected} runtime signal(s) did not match the contract and ` +
        "were not counted — a client is sending a shape this build does not know, " +
        "so the availability figures are incomplete.",
    );
  }
  if (localRuntime.dropped > 0) {
    problems.push(
      `${localRuntime.dropped} runtime signal(s) hit the per-minute ceiling and ` +
        "were discarded. Read the availability rate as a floor, not a measurement.",
    );
  }

  return {
    status,
    detail: {
      trustedProvider: trusted,
      submitProducesEvidence: evidence.submitProducesEvidence,
      /* Named `localRuntime*` rather than after whatever toolchain is in the
         browser this year: the field is about the learner being able to run
         code locally. The runtime HAS since been replaced — Pyodide out, a
         WebAssembly clang in — and this report needed no renaming, which is the
         argument the name was chosen for. */
      localRuntimeReady: localRuntime.ready,
      localRuntimeUnavailable: localRuntime.unavailable,
      localRuntimeSignals: localRuntime.signals,
      /* `null`, not 0, when nothing has reported. Nobody having opened a lesson
         is not the same measurement as nobody having failed. */
      localRuntimeUnavailableRate: localRuntime.unavailableRate,
      localRuntimeBroken: localRuntime.broken,
      signalsRejected: localRuntime.rejected,
      signalsDropped: localRuntime.dropped,
    },
    problems,
    evidence,
    localRuntime,
  };
}

/** The reason with the most reports, for a sentence a human reads. */
function dominantFailure(local: LocalRuntimeAvailability): string {
  const entries = Object.entries(local.byReason);
  const top = entries.reduce((best, e) => (e[1] > best[1] ? e : best), entries[0]);
  return top[1] > 0 ? top[0] : "unknown";
}

/**
 * How long a Nova probe may hold this endpoint open.
 *
 * Deliberately far below `NOVA_REQUEST_TIMEOUT_MS` (30 s). A learner waiting on
 * a hint can afford thirty seconds; a health endpoint cannot — a monitor that
 * blocks for half a minute has become an outage of its own, and the answer
 * "the provider did not respond within five seconds" is the same operational
 * answer as "it did not respond at all".
 */
const NOVA_PROBE_TIMEOUT_MS = 5_000;

/** `YYYY-MM` in UTC. Passed to `monthlySpend` so the label and the row agree. */
function utcMonthKey(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * The tutor.
 *
 * ## Why the probe had to exist
 *
 * Without it this check performed NO network call at all: it awaited the
 * provider factory and read three static fields. A revoked key, a base URL with
 * a typo in it, an expired billing account, a DNS failure and a retired model
 * id all produced `nova: ok`, because every one of them is a property of a
 * request nobody had made. The first thing that would have discovered any of
 * them is a fourteen-year-old pressing the hint button in the middle of a
 * lesson, and what they would see is the retry line — which looks identical to
 * a slow network.
 *
 * ## And why it is opt-in
 *
 * Same bargain as `executionCheck`: it costs a real request. The probe is four
 * output tokens and a fraction of a cent, but a monitor polling every thirty
 * seconds is 86 400 requests a month against a budget sized for eighteen
 * students, and the health check would become the thing that exhausts the
 * ceiling it reports on. It runs when a human asks.
 *
 * It goes through `getNovaProvider()` rather than a hand-rolled `fetch`, and
 * that is the whole point: the key resolution, the base URL, the model id and
 * the thinking flag are then exactly the ones a hint would use. A probe that
 * builds its own request can pass while the real path fails.
 *
 * ## What may be reported
 *
 * Configured, reachable, the model id, how long it took, and what it cost.
 * Never the key, never a request header, never a byte of the response body — a
 * provider's own error text can quote the prompt or the credential back, which
 * is why `errText` is used on every failure path here as well.
 */
async function novaCheck(probe: boolean): Promise<Check & { spend: NovaSpend | null }> {
  const { getNovaProvider } = await import("@schools/nova");
  const provider = await getNovaProvider();

  const problems: string[] = [];
  if (config.nova.provider === "deepseek" && !config.nova.apiKey) {
    problems.push("NOVA_PROVIDER=deepseek but DEEPSEEK_API_KEY is not set; Nova fell back to echo.");
  }
  if (!config.nova.enabled) {
    problems.push("NOVA_ENABLED=false — the tutor is switched off for every learner.");
  }

  /* `degraded`, not `down`. Nova being offline does not stop a lesson: the
     ladder, the caps and the refusal to name a misconception all run above
     the provider, and the panel says plainly that there is no model. */
  let status: CheckStatus = provider.degraded ? "degraded" : "ok";

  const detail: Check["detail"] = {
    provider: provider.id,
    // From configuration, never from the model. Asking an LLM what it is
    // produces confident fiction.
    model: provider.model,
    degraded: provider.degraded,
    /* Whether a hint would actually be attempted. `enabled` is the school's
       kill switch and is independent of the credential, so a term of
       assessments does not require deleting a secret. */
    enabled: config.nova.enabled,
    // The host the requests leave to, for the residency question. Never the
    // key, and never a URL with userinfo in it.
    endpoint: provider.id === "echo" ? null : redactUrl(config.nova.baseUrl),
    // Whether a request leaves Kazakhstan at all. See docs/pilot/PRIVACY_DATA_FLOWS.md.
    leavesProviderBoundary: provider.id !== "echo",
    configured: provider.id !== "echo",
    probed: false,
  };

  /* Probing `echo` would answer a question nobody asked: it is a local string
     generator, it is always reachable, and reporting `reachable: true` for it
     is the same false comfort this probe exists to remove. */
  if (probe && !provider.degraded) {
    detail.probed = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NOVA_PROBE_TIMEOUT_MS);
    const started = Date.now();
    try {
      let chars = 0;
      let usedInput = 0;
      let usedOutput = 0;
      for await (const chunk of provider.stream({
        /* The smallest exchange that still proves the credential, the host, the
           model id and the response shape. The reply is counted, never read:
           whatever a model says is not health information. */
        messages: [
          { role: "system", content: "Reply with the single word: ok" },
          { role: "user", content: "ok" },
        ],
        maxTokens: 4,
        temperature: 0,
        signal: controller.signal,
        onUsage: (u) => {
          usedInput = u.inputTokens;
          usedOutput = u.outputTokens;
        },
      })) {
        chars += chunk.length;
      }
      detail.probeMs = Date.now() - started;
      detail.reachable = chars > 0;
      detail.probeInputTokens = usedInput;
      detail.probeOutputTokens = usedOutput;
      if (chars === 0) {
        status = worst(status, "degraded");
        problems.push(
          "The model provider accepted the request and returned no text. A hint " +
            "would reach the learner empty and fall back to a question.",
        );
      }
    } catch (err) {
      detail.probeMs = Date.now() - started;
      detail.reachable = false;
      /* `down`, not `degraded`, and the distinction is real: an unconfigured
         Nova is a lesson without a tutor, which the product is designed for. A
         CONFIGURED Nova that cannot be reached is a deployment that believes it
         has a tutor and does not. */
      status = "down";
      problems.push(
        controller.signal.aborted
          ? `The model provider did not answer within ${NOVA_PROBE_TIMEOUT_MS} ms.`
          : `The model provider could not be called: ${errText(err)}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  /* Spend is read separately and is allowed to fail on its own. Folding it into
     the check would mean an unreachable database reporting the TUTOR as down,
     which sends whoever is reading this to the wrong page of the runbook. */
  let spend: NovaSpend | null = null;
  try {
    const { monthlySpend } = await import("@schools/nova/budget");
    const month = utcMonthKey();
    const s = await monthlySpend(month);
    const n = config.nova;
    const share = (used: number, limit: number) => (limit > 0 ? used / limit : null);

    spend = {
      month,
      requests: s.requests,
      inputTokens: s.inputTokens,
      outputTokens: s.outputTokens,
      // Four decimals: the ceiling is $25 and a rounded-to-cents figure hides
      // the first week of a month entirely.
      costUsd: Math.round(s.costUsd * 10_000) / 10_000,
      limits: {
        dailyRequests: n.dailyRequestLimit,
        monthlyInputTokens: n.monthlyInputTokenLimit,
        monthlyOutputTokens: n.monthlyOutputTokenLimit,
        monthlyCostUsd: n.monthlyCostLimitUsd,
        inputUsdPerMTok: n.inputUsdPerMTok,
        outputUsdPerMTok: n.outputUsdPerMTok,
      },
      usedShare: {
        inputTokens: share(s.inputTokens, n.monthlyInputTokenLimit),
        outputTokens: share(s.outputTokens, n.monthlyOutputTokenLimit),
        costUsd: share(s.costUsd, n.monthlyCostLimitUsd),
      },
    };

    const exhausted = Object.entries(spend.usedShare).filter(
      ([, v]) => v !== null && v >= 1,
    );
    const nearly = Object.entries(spend.usedShare).filter(
      ([, v]) => v !== null && v >= 0.8 && v < 1,
    );
    if (exhausted.length > 0) {
      status = worst(status, "degraded");
      problems.push(
        `Nova's monthly ceiling is reached (${exhausted.map(([k]) => k).join(", ")}). ` +
          "Every learner is now refused before the provider is called, and the " +
          "refusal reads to them like an ordinary 'try again later'.",
      );
    } else if (nearly.length > 0) {
      problems.push(
        `Nova is past 80% of its monthly ceiling (${nearly.map(([k]) => k).join(", ")}) ` +
          `with ${spend.requests} request(s) recorded in ${month}.`,
      );
    }
  } catch (err) {
    /* Reported as a problem, not as a status. The budget layer fails OPEN by
       design — see `schools/nova/budget.ts` — so an unreadable spend row means
       hints keep working and nobody can see what they cost, which is worth
       saying out loud and is not an outage. */
    problems.push(`Nova spend could not be read: ${errText(err)}`);
  }

  return { status, detail, problems, spend };
}

/* -------------------------------------------------------------------------- */

export interface HealthOptions {
  /** Run a real submission through the judge. Off by default; see `executionCheck`. */
  probeExecution?: boolean;
  /** Put one four-token request through the model provider. Off by default; see `novaCheck`. */
  probeNova?: boolean;
}

export async function buildAdminHealth(opts: HealthOptions = {}): Promise<AdminHealth> {
  const checkedAt = new Date().toISOString();

  const web = webCheck();
  const database = await guarded("database", databaseCheck);
  const execution = await guardedExecution(opts.probeExecution === true);
  /* Not `guarded`: every input is either frozen policy data or an in-memory
     counter read, so there is nothing here that can throw and a wrapper would
     only make the "it failed" branch unreachable and untestable. */
  const hybrid = hybridCheck();
  /* Not `guarded`, because this check carries a payload of its own and a
     `Check` without `spend` would not satisfy the report's shape. Same
     contract: a check that throws reports itself down and the rest still
     renders. */
  let nova: AdminHealth["nova"];
  try {
    nova = await novaCheck(opts.probeNova === true);
  } catch (err) {
    nova = { ...failed("nova", err), spend: null };
  }

  const fingerprint = curriculumFingerprint();
  const curriculum: AdminHealth["curriculum"] = {
    /* `implemented` content is servable and is what the pilot ships; the
       publication gate is documented and deliberately not enforced (remediation
       report §7.3). Reporting it as `degraded` would cry wolf on every poll for
       a state the school chose, so it is reported as a fact in `detail` and left
       to a human. */
    status: fingerprint.months.some((m) => m.routable) ? "ok" : "down",
    detail: {
      version: fingerprint.version,
      contentHash: fingerprint.contentHash,
      routableMonths: fingerprint.months.filter((m) => m.routable).length,
      tasks: fingerprint.months.reduce((n, m) => n + m.tasks, 0),
      publishedTasks: fingerprint.publishedTasks,
      humanReviewed: fingerprint.publishedTasks > 0,
    },
    problems: fingerprint.months.some((m) => m.routable)
      ? []
      : ["No month is routable — every lesson is draft or empty. Learners would see nothing."],
    fingerprint,
  };

  /* The two ledger-derived blocks share a connection and both fail the same way
     if the database is unreachable, so they are guarded together rather than
     twice — and they report `null` payloads rather than zeroes, because a zero
     is a measurement and "we could not look" is not. */
  let activity: LearningActivity | null = null;
  let assistance: AssistanceHealth | null = null;
  let reducer: ReducerHealth = {
    lastSweepAt: null,
    sweepAgeSeconds: null,
    unreducedEvents: 0,
    staleEpisodes: 0,
    staleLearnerStates: 0,
    behind: false,
    projectionBehind: false,
  };
  const ledgerProblems: string[] = [];

  try {
    const { sql, store } = await getStoreHandle();
    activity = await learningActivity(sql);
    assistance = await assistanceHealth(sql);
    reducer = await reducerHealth(sql, await store.lastSweepAt());

    if (reducer.behind) {
      ledgerProblems.push(
        `${reducer.unreducedEvents} episode event(s) across ${reducer.staleEpisodes} ` +
          `episode(s) unreduced and the last sweep was ${reducer.sweepAgeSeconds}s ago — ` +
          "the teacher projection is stale.",
      );
    }
    /* Separate from the line above, because the remedy is different. Unreduced
       EPISODES clear themselves on the next tick. A stale learner_state that
       the sweep never revisits — the shape a `LEARNER_STATE_VERSION` bump
       creates — does not clear on its own, and an operator who reads the
       episode line and waits will wait forever. See the note above the subject
       loop in `schools/reducer/sweep.ts`. */
    if (reducer.projectionBehind) {
      ledgerProblems.push(
        `${reducer.staleLearnerStates} learner projection(s) are missing, built by an ` +
          "older state version, or older than the episodes they summarise. The teacher " +
          "is reading frozen evidence for those learners while every route still " +
          "answers normally.",
      );
    }
    if (activity.verdicts.total > 0 && activity.verdicts.judged === 0) {
      ledgerProblems.push(
        "No verdict carries judge trust — the attestation secret or the grading path is broken.",
      );
    }
  } catch (err) {
    ledgerProblems.push(`ledger read failed: ${errText(err)}`);
  }

  const learning: AdminHealth["learning"] = {
    status: activity === null ? "down" : "ok",
    detail: {
      /* The honest denominator. Eighteen students is the pilot's shape, and a
         health view that reports "3 active" without "of 18" is a number nobody
         can act on. */
      activeToday: activity?.activeToday ?? 0,
      activeThisWeek: activity?.activeThisWeek ?? 0,
      enrolledSubjects: activity?.enrolledSubjects ?? 0,
      verdictsToday: activity?.verdictsToday ?? 0,
      judgedShare: activity?.verdicts.judgedShare ?? null,
      hintsRequested: assistance?.requested ?? 0,
      hintsDelivered: assistance?.delivered ?? 0,
      hintsUndelivered: assistance?.undelivered ?? 0,
    },
    problems: activity === null ? ledgerProblems : [],
    activity,
    assistance,
  };

  const reducerCheck: AdminHealth["reducer"] = {
    status:
      reducer.behind || reducer.projectionBehind
        ? "degraded"
        : activity === null
          ? "down"
          : "ok",
    detail: {
      lastSweepAt: reducer.lastSweepAt,
      sweepAgeSeconds: reducer.sweepAgeSeconds,
      unreducedEvents: reducer.unreducedEvents,
      staleEpisodes: reducer.staleEpisodes,
      staleLearnerStates: reducer.staleLearnerStates,
      behind: reducer.behind,
      projectionBehind: reducer.projectionBehind,
    },
    problems: activity === null ? [] : ledgerProblems,
    reducer,
  };

  const status = worst(
    web.status,
    database.status,
    execution.status,
    hybrid.status,
    nova.status,
    curriculum.status,
    reducerCheck.status,
    learning.status,
  );

  return {
    view: "admin",
    /* `ok` is reserved for "nothing is wrong". A degraded Nova is not an
       outage, but it IS something someone should know about, so it does not
       report as ok. */
    ok: status === "ok",
    status,
    checkedAt,
    web,
    database,
    execution,
    hybrid,
    nova,
    curriculum,
    reducer: reducerCheck,
    learning,
    counters: counterSnapshot(),
  };
}

/* -------------------------------------------------------------------------- */

/**
 * The same facts, said to someone who is teaching.
 *
 * Every sentence names a consequence and, where there is one, an action. No
 * variable names, no provider names, no hostnames, no counts of internal
 * tables, no environment. A teacher who reads "the code checker is down, keep
 * going and the answers will be checked later" can run the lesson; one who
 * reads "EXEC_PROVIDER=piston but PISTON_URL is not set" cannot.
 *
 * The strings live here rather than in `schools/presentation/labels.ts`
 * deliberately: that file is imported by the lesson runtime and ships to the
 * browser, and none of this text is ever shown to a learner.
 */
export function teacherHealth(admin: AdminHealth): TeacherHealth {
  /*
   * Checking is the judge, and then whether its verdict counts.
   *
   * The second half is new and is the whole point of the hybrid report: with
   * `EXEC_PROVIDER=none` the judge is not down — there is no judge — and a
   * teacher told "код проверяется" would be told something false every day of
   * the pilot. So a third message exists for that, and it is NOT an amber
   * light: in a school that runs without a judge, "you mark the code" is the
   * normal state of affairs, and a permanent warning triangle over the normal
   * state of affairs is a warning nobody reads by October.
   */
  const judgeDown = admin.execution.status !== "ok";
  const noJudgeConfigured = !admin.hybrid.evidence.submitProducesEvidence;
  const codeChecking: CheckStatus = judgeDown ? admin.execution.status : "ok";
  /* Running is the learner's own browser, and `hybrid.status` moves only when
     that is actually failing across sessions — never for the judge's absence. */
  const runningCode: CheckStatus = admin.hybrid.status;
  /* Saving is the database plus the write path. A degraded (ephemeral) store
     still saves for today, which is what a teacher is asking about. */
  const saving: CheckStatus = admin.database.status === "down" ? "down" : "ok";
  const classView: CheckStatus =
    admin.reducer.status === "down" ? "down" : admin.reducer.reducer.behind ? "degraded" : "ok";

  const capabilities: TeacherHealth["capabilities"] = [
    {
      id: "lessons",
      status: admin.curriculum.status,
      message:
        admin.curriculum.status === "ok"
          ? { kk: "Сабақтар ашық.", ru: "Уроки доступны." }
          : {
              kk: "Сабақтар ашылмай тұр. Мектеп әкімшісіне хабарлаңыз.",
              ru: "Уроки не открываются. Сообщите администратору школы.",
            },
    },
    {
      id: "saving_progress",
      status: saving,
      message:
        saving === "ok"
          ? { kk: "Жауаптар сақталып жатыр.", ru: "Ответы сохраняются." }
          : {
              kk:
                "Жауаптар қазір сақталмайды. Сабақты жалғастыруға болады, бірақ бүгінгі " +
                "нәтижелер журналға түспеуі мүмкін — әкімшіге хабарлаңыз.",
              ru:
                "Ответы сейчас не сохраняются. Урок можно продолжать, но сегодняшние " +
                "результаты могут не попасть в журнал — сообщите администратору.",
            },
    },
    {
      id: "running_code",
      status: runningCode,
      message:
        runningCode === "ok"
          ? {
              kk: "Оқушылар кодты браузерде жазып, іске қоса алады.",
              ru: "Ученики могут писать и запускать код в браузере.",
            }
          : {
              /* No blame, and one thing to try. The cause is almost always the
                 connection or the machine, and neither is something a teacher
                 can be asked to diagnose mid-lesson. */
              kk:
                "Кейбір компьютерлерде код құрастырғыш іске қосылмай тұр. Бетті " +
                "қайта жүктеп көріңіздер; көмектеспесе — әкімшіге хабарлаңыз.",
              ru:
                "На части компьютеров не запускается компилятор. Попробуйте " +
                "перезагрузить страницу; если не поможет — сообщите администратору.",
            },
    },
    {
      id: "code_checking",
      status: codeChecking,
      message: noJudgeConfigured && !judgeDown
        ? {
            /* Not a fault, and it must not read like one. The product works;
               what it does not do here is mark anybody automatically, and the
               teacher needs to know that before they wait for a grade that is
               never coming. */
            kk:
              "Оқушылар кодты жазып, өз браузерінде тексере алады. Автоматты " +
              "баға қойылмайды — жауаптарды мұғалім өзі қарайды.",
            ru:
              "Ученики пишут код и проверяют его в своём браузере. " +
              "Автоматическая оценка не выставляется — ответы смотрит учитель.",
          }
        : codeChecking === "ok"
          ? { kk: "Код тексерілуде.", ru: "Код проверяется." }
          : {
              /* The promise that matters to a teacher: nobody is marked wrong.
                 It is true — the submit route leaves the verdict `unknown` when
                 the judge does not answer, and `unknown` is never a failure. */
              kk:
                "Кодты тексеру уақытша қолжетімсіз. Оқушылар жазуын жалғастыра береді; " +
                "ешкімге қате қойылмайды.",
              ru:
                "Проверка кода временно недоступна. Ученики продолжают писать; " +
                "никому не ставится ошибка.",
            },
    },
    {
      id: "nova",
      status: admin.nova.status,
      message:
        admin.nova.status === "ok"
          ? { kk: "Nova көмекшісі жұмыс істеп тұр.", ru: "Помощник Nova работает." }
          : {
              kk: "Nova түсіндірме жаза алмайды — тек сұрақ қоя алады.",
              ru: "Nova не может написать объяснение — только задать вопрос.",
            },
    },
    {
      id: "class_view",
      status: classView,
      message:
        classView === "ok"
          ? { kk: "Сынып көрінісі жаңартылған.", ru: "Класс отображается актуально." }
          : {
              kk: "Сынып көрінісі кешігуде — соңғы жауаптар әлі көрінбеуі мүмкін.",
              ru: "Класс обновляется с задержкой — последние ответы могут ещё не появиться.",
            },
    },
  ];

  const status = worst(...capabilities.map((c) => c.status));

  return {
    view: "teacher",
    ok: status === "ok",
    status,
    checkedAt: admin.checkedAt,
    capabilities,
  };
}
