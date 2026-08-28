import "server-only";
import { config, executionProviderProblems, trustedProviderConfigured } from "@schools/config";
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

export interface AdminHealth {
  view: "admin";
  ok: boolean;
  status: CheckStatus;
  checkedAt: string;
  web: Check;
  database: Check;
  execution: Check;
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
  nova: Check;
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

async function guarded(name: string, fn: () => Promise<Check>): Promise<Check> {
  try {
    return await fn();
  } catch (err) {
    return {
      status: "down",
      detail: { checked: false },
      /* The message, not the stack, and not the exception object. A driver
         error message can contain a connection string; `String(err)` on a
         `pg` error frequently does. Trimmed hard for the same reason. */
      problems: [`${name} check failed: ${errText(err)}`],
    };
  }
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
 * `probe` runs a two-line Python program through the real provider. It is OFF
 * by default and must stay that way: a monitor polling every thirty seconds
 * would put a synthetic submission through a judge sized for eighteen students,
 * and the health check would become a load source. It exists for the one moment
 * it is worth its cost — a human asking "is the judge actually up?" during a
 * lesson.
 */
async function executionCheck(probe: boolean): Promise<Check> {
  const problems = executionProviderProblems(config.environment, config.exec);
  const detail: Check["detail"] = {
    provider: config.exec.provider,
    // Host and port only. See `redactUrl` for why the rest is dropped.
    endpoint: redactUrl(config.exec.pistonUrl),
    configured: config.exec.provider !== "piston" || Boolean(config.exec.pistonUrl),
    /* Reported here as a fact about the provider, and acted on in `hybridCheck`
       where it becomes a capability. Repeated in both places on purpose: this
       is the check somebody reads when they are looking at the judge, and
       leaving it out would make a `none` deployment look like a configured
       one until they scrolled. */
    trustedProvider: trustedProviderConfigured(config.exec.provider),
    probed: probe,
  };

  let status: CheckStatus = problems.length > 0 ? "down" : "ok";

  if (probe) {
    const { getExecutionProvider } = await import("@schools/exec");
    const started = Date.now();
    try {
      const provider = await getExecutionProvider();
      if (provider === null) {
        /*
         * Nothing to probe, and that is not a failure.
         *
         * This branch used to return `degraded` with a problem string saying
         * Submit produces no evidence. The sentence was right and the place was
         * wrong, in two ways.
         *
         * It only fired when a caller passed `?probe=1`, so the DEFAULT health
         * call — the one a monitor and a hurried admin actually make — reported
         * a judgeless deployment as fully `ok` and said nothing at all about
         * the missing capability. Whether there is a judge is knowable without
         * calling one; making it depend on an opt-in probe hid the single most
         * consequential fact in the report behind a query parameter.
         *
         * And `degraded` here meant a permanent 503 for a deployment that is
         * doing exactly what it was configured to do. `EXEC_PROVIDER=none` is
         * supported. A monitor that goes red forever is a monitor somebody
         * mutes, and then the real outage arrives to an audience of nobody —
         * the same wolf-crying this file already refuses for an idle reducer.
         *
         * So the capability moved to `hybridCheck`, which reports it on every
         * call, probe or not, as a statement rather than a page.
         */
        detail.probeOk = false;
        detail.probeStatus = "not_configured";
        return { status, detail, problems };
      }
      const result = await provider.run({
        language: "python3",
        // Deliberately trivial. The probe answers "did the judge answer", not
        // "does Python work", and a heavier program only makes it slower.
        sourceCode: "print(1)",
        stdin: "",
        timeLimitMs: 3_000,
        memoryLimitMb: 64,
      });
      detail.probeMs = Date.now() - started;
      detail.probeStatus = result.status;
      detail.probeOk = result.status === "ok" && result.stdout.trim() === "1";
      if (result.infrastructureError) {
        status = "down";
        problems.push(`The judge did not answer a trivial program: ${result.status}.`);
      } else if (detail.probeOk !== true) {
        status = worst(status, "degraded");
        problems.push(
          `The judge answered a trivial program with ${result.status} rather than a 1.`,
        );
      }
    } catch (err) {
      detail.probeMs = Date.now() - started;
      detail.probeOk = false;
      status = "down";
      problems.push(`The judge could not be called: ${errText(err)}`);
    }
  }

  return { status, detail, problems };
}

/**
 * The hybrid capability: can code run, and can anything it produces be claimed?
 *
 * ## Two facts, and neither one is visible from the other
 *
 * A learner presses Run and Python executes in their own browser. A learner
 * presses Submit and it executes on our judge. The first produces no server
 * traffic whatsoever, so a school where Pyodide fails to download looks
 * IDENTICAL, from every server-side number in this report, to a school where
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
   * `down`, because then there is no interpreter anywhere — the browser cannot
   * start CPython and there is no server to ask instead, and a code lesson is
   * simply not deliverable.
   */
  let status: CheckStatus = "ok";
  if (localRuntime.broken) {
    status = trusted ? "degraded" : "down";
    problems.push(
      `Python failed to start in ${localRuntime.unavailable} of ` +
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
      /* Named `localRuntime*` rather than `pyodide*`: the field is about the
         learner being able to run Python locally, and the day the runtime is
         replaced this report should not need renaming. */
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

async function novaCheck(): Promise<Check> {
  const { getNovaProvider } = await import("@schools/nova");
  const provider = await getNovaProvider();

  const problems: string[] = [];
  if (config.nova.provider === "deepseek" && !config.nova.apiKey) {
    problems.push("NOVA_PROVIDER=deepseek but DEEPSEEK_API_KEY is not set; Nova fell back to echo.");
  }

  return {
    /* `degraded`, not `down`. Nova being offline does not stop a lesson: the
       ladder, the caps and the refusal to name a misconception all run above
       the provider, and the panel says plainly that there is no model. */
    status: provider.degraded ? "degraded" : "ok",
    detail: {
      provider: provider.id,
      // From configuration, never from the model. Asking an LLM what it is
      // produces confident fiction.
      model: provider.model,
      degraded: provider.degraded,
      // The host the requests leave to, for the residency question. Never the
      // key, and never a URL with userinfo in it.
      endpoint: provider.id === "echo" ? null : redactUrl(config.nova.baseUrl),
      // Whether a request leaves Kazakhstan at all. See docs/pilot/PRIVACY_DATA_FLOWS.md.
      leavesProviderBoundary: provider.id !== "echo",
    },
    problems,
  };
}

/* -------------------------------------------------------------------------- */

export interface HealthOptions {
  /** Run a real submission through the judge. Off by default; see `executionCheck`. */
  probeExecution?: boolean;
}

export async function buildAdminHealth(opts: HealthOptions = {}): Promise<AdminHealth> {
  const checkedAt = new Date().toISOString();

  const web = webCheck();
  const database = await guarded("database", databaseCheck);
  const execution = await guarded("execution", () => executionCheck(opts.probeExecution === true));
  /* Not `guarded`: every input is either frozen policy data or an in-memory
     counter read, so there is nothing here that can throw and a wrapper would
     only make the "it failed" branch unreachable and untestable. */
  const hybrid = hybridCheck();
  const nova = await guarded("nova", novaCheck);

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
    behind: false,
  };
  const ledgerProblems: string[] = [];

  try {
    const { sql, store } = await getStoreHandle();
    activity = await learningActivity(sql);
    assistance = await assistanceHealth(sql);
    reducer = await reducerHealth(sql, await store.lastSweepAt());

    if (reducer.behind) {
      ledgerProblems.push(
        `${reducer.unreducedEvents} episode event(s) unreduced and the last sweep was ` +
          `${reducer.sweepAgeSeconds}s ago — the teacher projection is stale.`,
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
    status: reducer.behind ? "degraded" : activity === null ? "down" : "ok",
    detail: {
      lastSweepAt: reducer.lastSweepAt,
      sweepAgeSeconds: reducer.sweepAgeSeconds,
      unreducedEvents: reducer.unreducedEvents,
      behind: reducer.behind,
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
                "Кейбір компьютерлерде Python іске қосылмай тұр. Бетті қайта " +
                "жүктеп көріңіздер; көмектеспесе — әкімшіге хабарлаңыз.",
              ru:
                "На части компьютеров Python не запускается. Попробуйте " +
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
