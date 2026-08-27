import "server-only";
import { config, executionProviderProblems } from "@schools/config";
import { getStoreHandle } from "@schools/store";
import type { Localized } from "@schools/curriculum/types";
import { redactUrl } from "./admin-gate";
import { counterSnapshot, type CounterSnapshot } from "./counters";
import { curriculumFingerprint, type CurriculumFingerprint } from "./fingerprint";
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
  execution: Check;
  /** `spend` is null when the ledger could not be read — a zero would be a lie. */
  nova: Check & { spend: NovaSpend | null };
  curriculum: Check & { fingerprint: CurriculumFingerprint };
  reducer: Check & { reducer: ReducerHealth };
  learning: Check & { activity: LearningActivity | null; assistance: AssistanceHealth | null };
  counters: CounterSnapshot;
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
    probed: probe,
  };

  let status: CheckStatus = problems.length > 0 ? "down" : "ok";

  if (probe) {
    const { getExecutionProvider } = await import("@schools/exec");
    const started = Date.now();
    try {
      const provider = await getExecutionProvider();
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
  const execution = await guarded("execution", () => executionCheck(opts.probeExecution === true));
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
  const codeChecking: CheckStatus = admin.execution.status;
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
      id: "code_checking",
      status: codeChecking,
      message:
        codeChecking === "ok"
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
