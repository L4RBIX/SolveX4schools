/**
 * One command that answers the whole live brief for Judge0 CE via RapidAPI.
 *
 *   npm run judge0:validate
 *   npm run judge0:validate -- --only=languages,conformance --max-submissions=20
 *
 * ## Read this first: it has never run against RapidAPI
 *
 * **There is no key in this repository and none in the shell environment.**
 * `env | grep -i rapidapi` is empty, no `.env*` file carries one, and nothing in
 * SolveX has ever contacted `judge0-ce.p.rapidapi.com`. Run today, this script
 * detects that, says so, spends nothing and stops. It is not a validation that
 * has passed; it is a validation that is ARMED. The document it writes,
 * `docs/infrastructure/JUDGE0_LIVE_VALIDATION.md`, is deliberately not created
 * until a run actually happens — a file full of `UNKNOWN` sitting in
 * `docs/infrastructure/` would eventually be read as a result.
 *
 * ## What it does, in order
 *
 * 1. **Identity.** `GET /languages`, every Python the service exposes, which one
 *    the adapter's own discovery selects, and `sys.version` from the interpreter
 *    itself — because a catalogue label is a string Judge0 wrote next to an id.
 *    Plus every `x-ratelimit-*` header that arrived, and every one that did not.
 * 2. **Conformance.** Eleven programs, asserted on the NORMALISED
 *    `ExecutionResult`, including the row that matters most: the learner's slow
 *    program is `time_limit_exceeded` and the judge's bad day is not.
 * 3. **Sandbox probes.** Network, filesystem, temp files, subprocesses,
 *    `os.environ`. Observational and non-destructive. The honest answer may be
 *    that a boundary is open, and then that is the finding.
 * 4. **Parity.** The real September programs from `tests/execution/parity-fixtures.ts`.
 * 5. **Cost shape.** Submissions and API requests for one Check, measured, not
 *    modelled — they are different numbers and both are asked for.
 * 6. **Staged concurrency.** 1, 2, 4, 8, stopping permanently at the first 429.
 * 7. **The report**, rewritten to disk after every phase so a run that is
 *    interrupted still leaves something true behind.
 *
 * ## The ceiling is the point
 *
 * `--max-submissions` is a hard bound enforced at `fetch` (see `wire.ts`), not a
 * suggestion the phases cooperate with. A phase whose cost does not fit in what
 * is left is SKIPPED WHOLE and recorded as skipped, rather than run half way —
 * half a parity table is worse than none, because somebody will read it as a
 * complete one. The default is low on purpose: the free tier's real limits are
 * unknown, and the safe direction for an unknown ceiling is well under it.
 *
 * ## The key
 *
 * Read from `JUDGE0_RAPIDAPI_KEY`, carried in a header by the adapter, and never
 * printed, logged, written, or put in an error message. Its presence is
 * reported; its length is not. Everything the judge sends back is passed through
 * `scrub()` before it can reach a report field — one of the probes reads
 * `os.environ`, and "output cannot contain the key" is an assumption, not a
 * fact — and the writer refuses to save a document the key appears in.
 *
 * ## Why it does not use `getExecutionProvider()`
 *
 * That reads `schools/config.ts`, which is frozen at import and offers no way to
 * vary the concurrency limit between stages. This script constructs
 * `Judge0RapidApiProvider` directly, from the SAME environment variable names,
 * so an operator's configuration is honoured and the concurrency phase can still
 * ask its question. The adapter itself is used exactly as production uses it and
 * is not reimplemented here.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type { OutputChecker } from "@schools/exec";
import type { LessonBlock, Month } from "@schools/curriculum/types";
import type { ExecutionRequest, ExecutionResult } from "@schools/exec/provider";
import type { Judge0Options, Judge0RapidApiProvider } from "@schools/exec/providers/judge0";

import { loadEnvFiles } from "./env-file";
import { CONFORMANCE_CASES, SANDBOX_PROBES } from "./programs";
import { installMeter, SubmissionCeilingReached, type Meter } from "./wire";
import {
  PHASE_ORDER,
  renderReport,
  scrub,
  type ConcurrencyPhase,
  type ConformanceRow,
  type CostPhase,
  type LanguagesPhase,
  type LiveValidationReport,
  type ParityRow,
  type PhaseName,
  type ProbeRow,
  type StageResult,
} from "./report";

/* -------------------------------------------------------------------------- */
/* Constants that are decisions                                                */
/* -------------------------------------------------------------------------- */

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_REPORT_PATH = "docs/infrastructure/JUDGE0_LIVE_VALIDATION.md";

/**
 * The default ceiling. Low, and deliberately not enough for everything.
 *
 * 17 submissions buys identity + conformance + probes, which is the part that
 * answers "does this service behave" and the part worth running first. Parity,
 * cost and concurrency together need roughly four times that, and an operator
 * on a plan of a few dozen submissions a day should decide to spend it rather
 * than discover they have.
 */
const DEFAULT_MAX_SUBMISSIONS = 25;
/**
 * The ceiling on the unit RapidAPI actually bills.
 *
 * Derived from the submission ceiling rather than picked: one submission is a
 * POST plus its polls, and a program that runs its whole CPU budget can poll
 * around twenty times. Ten requests per submission is a middle estimate that
 * comfortably covers ordinary programs and still refuses a run that has
 * started polling pathologically.
 *
 * It exists because a submission ceiling is NOT a spend ceiling on a plan
 * metered by request — `--max-submissions=25` alone permits something like five
 * hundred billable calls.
 */
const DEFAULT_MAX_API_REQUESTS = DEFAULT_MAX_SUBMISSIONS * 10;

/**
 * The concurrency ladder. Fixed, and 18 is not on it.
 *
 * The server already queues behind `JUDGE0_MAX_CONCURRENT_REQUESTS`, so firing
 * eighteen at once would measure our own gate, not the plan — and the plan's
 * limits are the operator's money. Escalation stops permanently at the first
 * 429 or provider error.
 */
const CONCURRENCY_STAGES = [1, 2, 4, 8] as const;

/** The pilot's class size. A fact about the pilot, not a constant of the system. */
const CLASSROOM_STUDENTS = 18;

/**
 * The quota headers `schools/ops/provider-quota.ts` knows how to read.
 *
 * Listed here so the report can say which ones were looked for and were not
 * there. "We looked and it was not sent" is a finding — it is the difference
 * between a health view that shows a number and one that shows `null` forever.
 */
const KNOWN_QUOTA_HEADERS = [
  "x-ratelimit-requests-limit",
  "x-ratelimit-requests-remaining",
  "x-ratelimit-requests-reset",
  "x-ratelimit-rapid-free-plans-hard-limit-limit",
  "x-ratelimit-rapid-free-plans-hard-limit-remaining",
  "x-ratelimit-rapid-free-plans-hard-limit-reset",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
] as const;

/** `GET /config_info` fields that bound what the adapter sends. */
const CONFIG_INFO_FIELDS = [
  "cpu_time_limit",
  "max_cpu_time_limit",
  "wall_time_limit",
  "max_wall_time_limit",
  "memory_limit",
  "max_memory_limit",
  "enable_network",
  "max_submission_batch_size",
  "max_queue_size",
] as const;

/** The adapter's own discovery rule, restated so the report can show what failed it. */
const PYTHON_3_NAME = /^Python\s*\((3(?:\.\d+)*)\)$/;

/* -------------------------------------------------------------------------- */
/* Arguments                                                                   */
/* -------------------------------------------------------------------------- */

export interface ParsedArgs {
  phases: PhaseName[];
  maxSubmissions: number;
  /** Ceiling on billable HTTP requests. See `DEFAULT_MAX_API_REQUESTS`. */
  maxApiRequests: number;
  reportPath: string;
  help: boolean;
  /** Override for the judge's base URL — how the offline test points at the fake. */
  baseUrl: string | null;
  host: string | null;
}

export type ArgResult = { ok: true; args: ParsedArgs } | { ok: false; problem: string };

export function parseArgs(argv: readonly string[]): ArgResult {
  const args: ParsedArgs = {
    phases: [...PHASE_ORDER],
    maxSubmissions: DEFAULT_MAX_SUBMISSIONS,
    maxApiRequests: DEFAULT_MAX_API_REQUESTS,
    reportPath: DEFAULT_REPORT_PATH,
    help: false,
    baseUrl: null,
    host: null,
  };

  for (const raw of argv) {
    if (raw === "--help" || raw === "-h") {
      args.help = true;
      continue;
    }
    const eq = raw.indexOf("=");
    const name = eq === -1 ? raw : raw.slice(0, eq);
    const value = eq === -1 ? "" : raw.slice(eq + 1);

    switch (name) {
      case "--only": {
        const wanted = value.split(",").map((s) => s.trim()).filter(Boolean);
        if (wanted.length === 0) return { ok: false, problem: "--only needs at least one phase name" };
        const unknown = wanted.filter((w) => !PHASE_ORDER.includes(w as PhaseName));
        if (unknown.length > 0) {
          return {
            ok: false,
            problem: `--only does not know ${unknown.join(", ")}. Valid: ${PHASE_ORDER.join(", ")}`,
          };
        }
        /* Kept in PHASE_ORDER rather than the order they were typed: identity
           first means everything after it knows which interpreter it measured,
           and the cheap phases genuinely should run before the expensive ones. */
        args.phases = PHASE_ORDER.filter((phase) => wanted.includes(phase));
        break;
      }
      case "--max-submissions": {
        if (!/^\d+$/.test(value)) return { ok: false, problem: "--max-submissions needs a non-negative integer" };
        args.maxSubmissions = Number(value);
        break;
      }
      case "--max-api-requests": {
        if (!/^\d+$/.test(value)) {
          return { ok: false, problem: "--max-api-requests needs a non-negative integer" };
        }
        args.maxApiRequests = Number(value);
        break;
      }
      case "--out": {
        if (value === "") return { ok: false, problem: "--out needs a path" };
        args.reportPath = value;
        break;
      }
      case "--base-url": {
        if (value === "") return { ok: false, problem: "--base-url needs a URL" };
        args.baseUrl = value;
        break;
      }
      case "--host": {
        if (value === "") return { ok: false, problem: "--host needs a hostname" };
        args.host = value;
        break;
      }
      default:
        return { ok: false, problem: `unknown option ${name}` };
    }
  }

  return { ok: true, args };
}

const HELP = [
  "npm run judge0:validate -- [options]",
  "",
  "  --only=a,b,c          phases to run, from: " + PHASE_ORDER.join(", "),
  "  --max-submissions=N   hard ceiling on billable submissions (default " + DEFAULT_MAX_SUBMISSIONS + ")",
  "  --max-api-requests=N  hard ceiling on billable HTTP requests (default " +
    DEFAULT_MAX_API_REQUESTS + ") — the unit RapidAPI meters",
  "  --out=PATH            where the report is written (default " + DEFAULT_REPORT_PATH + ")",
  "  --base-url=URL        talk to a different Judge0-compatible host",
  "  --host=HOST           the x-rapidapi-host header value",
  "  --help                this",
  "",
  "Reads JUDGE0_RAPIDAPI_KEY from the environment. Never prints it.",
  "Exit codes: 0 clean, 1 findings in a phase, 2 could not start.",
].join("\n");

/* -------------------------------------------------------------------------- */
/* Configuration, read the same way schools/config.ts reads it                 */
/* -------------------------------------------------------------------------- */

type Env = Record<string, string | undefined>;

function intEnv(env: Env, name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

interface LiveConfig extends Judge0Options {
  /** Present, never reported. Reported only as "a key was found". */
  apiKey: string;
}

function readConfig(env: Env, args: ParsedArgs, apiKey: string): LiveConfig {
  const host = args.host ?? env.JUDGE0_RAPIDAPI_HOST ?? "judge0-ce.p.rapidapi.com";
  const baseUrl =
    args.baseUrl ?? env.JUDGE0_RAPIDAPI_BASE_URL ?? env.JUDGE0_BASE_URL ?? `https://${host}`;
  const languageIdRaw = env.JUDGE0_LANGUAGE_ID;
  return {
    apiKey,
    host,
    baseUrl,
    languageId:
      languageIdRaw !== undefined && /^\d+$/.test(languageIdRaw.trim())
        ? Number(languageIdRaw.trim())
        : undefined,
    maxConcurrentRequests: intEnv(env, "JUDGE0_MAX_CONCURRENT_REQUESTS", 2),
    pollIntervalMs: intEnv(env, "JUDGE0_POLL_INTERVAL_MS", 250),
    queueWaitMs: intEnv(env, "JUDGE0_QUEUE_WAIT_MS", 30_000),
    overheadBudgetMs: intEnv(env, "JUDGE0_OVERHEAD_BUDGET_MS", 15_000),
    batchEnabled: env.JUDGE0_BATCH === "true",
  };
}

/* -------------------------------------------------------------------------- */
/* The `server-only` shim                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Let a node script import the server modules it needs to validate.
 *
 * `server-only` throws on import so that a module holding a secret cannot be
 * pulled into a client bundle — a guarantee the Next build enforces and this
 * repository depends on. There is no client bundle in a tsx process, so the
 * package has nothing to say here; `vitest.config.mts` aliases it away for
 * exactly the same reason and with exactly the same reasoning.
 *
 * `registerHooks` is Node's supported resolution hook rather than a patch of
 * `Module._resolveFilename`, and it is installed by the CLI wrapper only — a
 * caller that already has its own resolution (vitest) must not have a second
 * one bolted on underneath it.
 */
export function installServerOnlyShim(): void {
  const stub = pathToFileURL(path.join(REPO_ROOT, "tests", "stubs", "server-only.ts")).href;
  registerHooks({
    resolve(specifier, context, next) {
      if (specifier === "server-only") return { url: stub, shortCircuit: true };
      return next(specifier, context);
    },
  });
}

/* -------------------------------------------------------------------------- */
/* The validator                                                               */
/* -------------------------------------------------------------------------- */

export interface ValidatorInput {
  argv: readonly string[];
  env: Env;
  /** One line of progress. The CLI prints; a test collects. */
  write: (line: string) => void;
  /** Injected so a test can prove no file was written. */
  saveFile?: (absolutePath: string, contents: string) => void;
}

export interface ValidatorOutcome {
  /** 0 clean · 1 the run found something · 2 it could not start. */
  exitCode: 0 | 1 | 2;
  /** Billable submissions actually created. `0` when nothing was attempted. */
  submissionsSpent: number;
  apiRequestsSpent: number;
  report: LiveValidationReport | null;
  reportPath: string | null;
}

/**
 * The message printed when there is no key.
 *
 * Exported so the test asserts the real sentence rather than a paraphrase of
 * it, and so nobody can quietly soften it into something that reads like a
 * validation having been attempted.
 */
export const NO_KEY_MESSAGE = [
  "JUDGE0_RAPIDAPI_KEY is not set, so nothing was called and nothing was spent.",
  "",
  "This is the expected state of this repository today: there is no RapidAPI key here,",
  "no .env file carries one, and nothing in SolveX has ever contacted",
  "judge0-ce.p.rapidapi.com. Nothing about the live service is known, and no report",
  "was written — a document full of UNKNOWN in docs/infrastructure/ would eventually",
  "be read as a result.",
  "",
  "When a key exists:",
  "",
  "  export JUDGE0_RAPIDAPI_KEY=...        # keep it out of your shell history",
  "  npm run judge0:validate -- --only=languages   # one API request, zero submissions",
  "",
  "then widen --only and raise --max-submissions once the cheap phases look right.",
].join("\n");

export async function runValidation(input: ValidatorInput): Promise<ValidatorOutcome> {
  const { write } = input;
  const parsed = parseArgs(input.argv);
  if (!parsed.ok) {
    write(`judge0:validate — ${parsed.problem}`);
    write("");
    write(HELP);
    return { exitCode: 2, submissionsSpent: 0, apiRequestsSpent: 0, report: null, reportPath: null };
  }
  const args = parsed.args;
  if (args.help) {
    write(HELP);
    return { exitCode: 2, submissionsSpent: 0, apiRequestsSpent: 0, report: null, reportPath: null };
  }

  const apiKey = (input.env.JUDGE0_RAPIDAPI_KEY ?? "").trim();
  if (apiKey === "") {
    write(NO_KEY_MESSAGE);
    /* Not exit 1. Nothing failed — nothing was asked. */
    return { exitCode: 2, submissionsSpent: 0, apiRequestsSpent: 0, report: null, reportPath: null };
  }

  const config = readConfig(input.env, args, apiKey);
  const saveFile =
    input.saveFile ??
    ((absolutePath: string, contents: string) => {
      mkdirSync(path.dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, contents, "utf8");
    });

  const meter = installMeter({
    baseUrl: config.baseUrl,
    maxSubmissions: args.maxSubmissions,
    maxApiRequests: args.maxApiRequests,
  });
  try {
    return await execute({ args, config, meter, write, saveFile });
  } finally {
    meter.uninstall();
  }
}

/* -------------------------------------------------------------------------- */
/* Orchestration                                                               */
/* -------------------------------------------------------------------------- */

/** Builds one `ExecutionRequest` at the system's real limits. */
type MakeRequest = (sourceCode: string, stdin: string, timeLimitMs?: number) => ExecutionRequest;

interface RunContext {
  args: ParsedArgs;
  config: LiveConfig;
  meter: Meter;
  write: (line: string) => void;
  saveFile: (absolutePath: string, contents: string) => void;
}

async function execute(ctx: RunContext): Promise<ValidatorOutcome> {
  const { args, config, meter, write } = ctx;

  const judge0 = await import("@schools/exec/providers/judge0");
  const execBarrel = await import("@schools/exec");
  const fixtures = await import("../../tests/execution/parity-fixtures");
  const curriculum = await import("@schools/curriculum/months");

  const limits = execBarrel.EXECUTION_LIMITS;
  const reportPath = path.resolve(REPO_ROOT, args.reportPath);

  const checks = pickCheckBlocks(curriculum.MONTHS);
  const parityFixtures = fixtures.PARITY_FIXTURES.filter((f) => f.unexecutable?.server === undefined);

  /**
   * What each phase will cost if it runs. Computed, never guessed.
   *
   * `languages` is ZERO, and that is deliberate: everything in it except
   * `sys.version` is free reconnaissance — the catalogue, which Python the
   * adapter would pick, the quota headers, `/config_info` — and an operator who
   * runs `--max-submissions=0` should get all of it. The one submission inside
   * is guarded separately, so a zero budget yields a real identity section
   * rather than a skipped phase.
   */
  const estimate: Record<PhaseName, number> = {
    languages: 0,
    conformance: CONFORMANCE_CASES.length,
    probes: SANDBOX_PROBES.length,
    parity: parityFixtures.length,
    cost: (checks.ordinary?.cases.length ?? 0) + (checks.worst?.cases.length ?? 0),
    concurrency: CONCURRENCY_STAGES.reduce((sum, w) => sum + w, 0),
  };

  const report: LiveValidationReport = {
    ranAt: new Date().toISOString(),
    finishedAt: null,
    /* Rebuilt from the PARSED arguments rather than echoed from `argv`, so a
       reader sees exactly what ran and so nothing an operator typed on the
       command line can be copied into a committed document verbatim. */
    command:
      `npm run judge0:validate -- --only=${args.phases.join(",")} ` +
      `--max-submissions=${args.maxSubmissions}`,
    host: config.host,
    baseUrl: config.baseUrl,
    phasesSelected: args.phases,
    ceiling: args.maxSubmissions,
    spend: { ...meter.state() },
    languages: null,
    conformance: null,
    probes: null,
    parity: null,
    cost: null,
    concurrency: null,
    skipped: [],
    findings: [],
  };

  const save = () => {
    report.spend = { ...meter.state() };
    const rendered = renderReport(report);
    if (config.apiKey.length > 0 && rendered.includes(config.apiKey)) {
      /* The last line of defence, and it must be a refusal rather than a scrub:
         reaching here means something bypassed `scrub`, and the right response
         to "a secret got somewhere it should not be" is to stop, not to patch
         the output and carry on. */
      throw new Error("refusing to write the report: the API key appears in it");
    }
    ctx.saveFile(reportPath, rendered);
  };

  write("judge0:validate — a key is present; the live run is starting.");
  write(`  host      ${config.host}`);
  write(`  phases    ${args.phases.join(", ")}`);
  /* BOTH numbers, because the operator is deciding whether to spend and the
     marketplace bills the second one. Printing only the submission figure was
     the defect: it made a 25-submission run look like 25 billable calls when it
     could be twenty times that. */
  write(`  ceiling   ${args.maxSubmissions} submissions / ${args.maxApiRequests} API requests`);
  write(
    `  estimate  ${args.phases.map((p) => `${p} ${estimate[p]}`).join(", ")}` +
      ` = ${args.phases.reduce((sum, p) => sum + estimate[p], 0)} submissions for everything selected`,
  );
  write("");

  const provider = new judge0.Judge0RapidApiProvider(config);
  /* One request builder for every phase, so the limits a learner is judged
     under are the limits every measurement below was taken under. Explicitly
     `number`: `EXECUTION_LIMITS` is `as const`, and inferring the literal 5000
     would make the parameter unusable by the runaway-loop fixture. */
  const request: MakeRequest = (sourceCode, stdin, timeLimitMs = limits.timeLimitMs) => ({
    language: "python3",
    sourceCode,
    stdin,
    timeLimitMs,
    memoryLimitMb: limits.memoryLimitMb,
  });

  const spent = () => `${meter.state().submissions}/${args.maxSubmissions}`;

  for (const phase of args.phases) {
    /*
     * A 429 stops the WHOLE run, not just the phase that met it.
     *
     * The ladder in `phaseConcurrency` already stopped escalating on a 429, and
     * that was the only place anything did. So a run that hit the plan's limit
     * on its fourth request carried on through conformance, probes, parity and
     * cost — dozens more calls at a provider that had just said no. The user's
     * rule was "do not violate plan limits to satisfy a test", and firing 54
     * more requests into a refusal is exactly that.
     *
     * It also fixed a lie in the report. Every one of those refusals came back
     * as an infrastructure failure and was written up as a row that did not
     * match, so the document read "Judge0 failed 55 conformance and parity
     * checks" when what actually happened was "we ran out of quota on request
     * four". Stopping here means the report says the true thing.
     */
    if (meter.state().rateLimited > 0) {
      const seen = meter.state().rateLimited;
      const why =
        `the judge returned HTTP 429 (${seen}×) before this phase started. Stopping the whole ` +
        `run rather than spending more against a plan that is already refusing — and so the ` +
        `report says "out of quota" instead of blaming the judge for rows we never got to run.`;
      write(`  ${phase}: SKIPPED — ${why}`);
      report.skipped.push({ phase, why });
      continue;
    }

    if (estimate[phase] > meter.remaining()) {
      const why =
        `would need ${estimate[phase]} submissions and only ${meter.remaining()} are left under ` +
        `--max-submissions=${args.maxSubmissions}. Skipped whole rather than run half: half a ` +
        "table is read as a complete one.";
      report.skipped.push({ phase, why });
      write(`[skip] ${phase} — ${why}`);
      save();
      continue;
    }

    write(`[${phase}] starting (spent ${spent()})`);
    switch (phase) {
      case "languages":
        report.languages = await phaseLanguages(ctx, provider, request);
        collectLanguageFindings(report);
        break;
      case "conformance":
        report.conformance = await phaseConformance(ctx, provider, request);
        for (const row of report.conformance) {
          if (!row.matched) {
            report.findings.push({
              severity: "defect",
              phase: "conformance",
              summary: `${row.id}: ${row.mismatch ?? "did not match"}`,
            });
          }
        }
        break;
      case "probes":
        report.probes = await phaseProbes(ctx, provider, request);
        for (const row of report.probes) {
          if (row.securityNote) {
            report.findings.push({ severity: "security", phase: "probes", summary: `${row.id}: ${row.securityNote}` });
          }
        }
        break;
      case "parity":
        report.parity = await phaseParity(ctx, provider, request, parityFixtures, limits.timeLimitMs);
        for (const row of report.parity) {
          if (!row.matched) {
            report.findings.push({
              severity: "defect",
              phase: "parity",
              summary: `${row.id}: ${row.mismatch ?? "diverged"}`,
            });
          }
        }
        break;
      case "cost":
        report.cost = await phaseCost(ctx, provider, execBarrel.runCases, checks);
        break;
      case "concurrency":
        report.concurrency = await phaseConcurrency(ctx, judge0, request);
        break;
    }
    write(`[${phase}] done (spent ${spent()})`);
    save();
  }

  /* The instrumentation gap, recorded on every run because it is true on every
     run until one call site changes. Phase `run` so it does not colour the exit
     code: it is a defect in OUR accounting, not a verdict about the service. */
  report.findings.push({
    severity: "defect",
    phase: "run",
    summary:
      "`recordJudge0Request` is not called from `schools/exec/providers/judge0.ts`'s " +
      "`httpJson`, so every `judge0.*` ops counter and every `providerQuota()` field " +
      "reads zero/null in production no matter what is spent. This run measured at " +
      "`fetch` instead. One call site fixes it; it is outside this script.",
  });

  report.finishedAt = new Date().toISOString();
  save();

  const state = meter.state();
  write("");
  write(`Report written to ${reportPath}`);
  write(`Spent: ${state.submissions} submissions, ${state.apiRequests} API requests, ${state.rateLimited} × 429.`);

  /* What makes the command fail, and what merely makes it informative.
     `note` never does: "the plan sends no quota headers" is worth writing down
     and is not a reason for CI to go red. `run` never does either — those are
     defects in OUR instrumentation, not verdicts about the service. */
  const actionable = report.findings.filter((f) => f.phase !== "run" && f.severity !== "note");
  for (const f of actionable) write(`  [${f.severity}] ${f.phase}: ${f.summary}`);

  return {
    exitCode: actionable.length > 0 ? 1 : 0,
    submissionsSpent: state.submissions,
    apiRequestsSpent: state.apiRequests,
    report,
    reportPath,
  };
}

/* -------------------------------------------------------------------------- */
/* Phase 1 — identity                                                          */
/* -------------------------------------------------------------------------- */

async function phaseLanguages(
  ctx: RunContext,
  provider: Judge0RapidApiProvider,
  request: MakeRequest,
): Promise<LanguagesPhase> {
  const { config, write } = ctx;
  const phase: LanguagesPhase = {
    totalLanguages: null,
    pythonEntries: [],
    catalogueProblem: null,
    selected: null,
    selectionProblem: null,
    interpreterVersion: null,
    interpreterProblem: null,
    quotaHeadersPresent: {},
    quotaHeadersAbsent: [],
    configInfo: null,
    configInfoProblem: null,
  };

  /* Our own GET, not the adapter's, because the adapter deliberately does not
     expose the catalogue or the response headers — it returns the ONE language
     it chose, which is the right shape for production and the wrong shape for a
     report that has to list everything on offer. One extra API request, zero
     submissions. */
  try {
    const body = await vendorGet(config, "/languages");
    if (!Array.isArray(body)) {
      phase.catalogueProblem = "the judge did not answer /languages with a list";
    } else {
      phase.totalLanguages = body.length;
      for (const entry of body) {
        if (typeof entry !== "object" || entry === null) continue;
        const record = entry as { id?: unknown; name?: unknown };
        if (typeof record.id !== "number" || typeof record.name !== "string") continue;
        if (!/python/i.test(record.name)) continue;
        /* Scrubbed like everything else that came off the wire. A catalogue
           name is not a plausible place for a secret; it is also not a place
           anybody checks, and the cost of scrubbing it is one function call. */
        const name = scrub(record.name.trim(), config.apiKey);
        phase.pythonEntries.push({
          id: record.id,
          name,
          matchesDiscoveryRule: PYTHON_3_NAME.test(name),
        });
      }
      phase.pythonEntries.sort((a, b) => a.id - b.id);
      write(`  catalogue: ${phase.totalLanguages} languages, ${phase.pythonEntries.length} mention Python`);
    }
  } catch (err) {
    phase.catalogueProblem = safeProblem(err, config.apiKey);
  }

  /* The adapter's OWN discovery, so the report says what production will pick
     rather than what a reader of the catalogue would pick. */
  try {
    const selected = await provider.language();
    phase.selected = {
      id: selected.id,
      name: scrub(selected.name, config.apiKey),
      version: selected.version,
      operatorOverride: selected.operatorOverride,
    };
    write(`  adapter selected: id ${selected.id} — ${selected.name}`);
  } catch (err) {
    phase.selectionProblem = safeProblem(err, config.apiKey);
  }

  /* One submission, and worth it: §6 of the setup doc is explicit that a
     catalogue label is not an interpreter, and the version is the single fact
     this phase exists to establish. It is the ONLY spend in this phase, so it is
     guarded on its own — everything above is free, and a zero budget should still
     buy the catalogue and the headers. */
  if (ctx.meter.remaining() < 1) {
    phase.interpreterProblem =
      "not asked: no submission budget left under --max-submissions. The catalogue above " +
      "is what Judge0 CALLS this runtime, which is a string beside an id and not an " +
      "interpreter answering for itself.";
  } else {
    try {
      const result = await provider.run(request("import sys\nprint(sys.version)", "", 5_000));
      if (result.infrastructureError) {
        phase.interpreterProblem = `nothing ran: ${scrub(result.stderr, config.apiKey)}`;
      } else {
        const printed = scrub(result.stdout, config.apiKey).trim();
        if (printed === "") phase.interpreterProblem = `the program printed nothing (status ${result.status})`;
        else {
          phase.interpreterVersion = printed;
          write(`  sys.version: ${printed.split("\n")[0]}`);
        }
      }
    } catch (err) {
      phase.interpreterProblem = safeProblem(err, config.apiKey);
    }
  }

  /* `GET /config_info` — one request, no submission, and it answers the one
     question §4.4 L3 says not to skip: are our limits accepted, or clamped? A
     clamp is silent and shrinks every learner's time budget. */
  try {
    const body = await vendorGet(config, "/config_info");
    if (typeof body === "object" && body !== null) {
      const record = body as Record<string, unknown>;
      const narrowed: Record<string, string> = {};
      for (const field of CONFIG_INFO_FIELDS) {
        narrowed[field] = field in record ? scrub(String(record[field]), config.apiKey) : "absent";
      }
      phase.configInfo = narrowed;
    } else {
      phase.configInfoProblem = "the judge did not answer /config_info with an object";
    }
  } catch (err) {
    phase.configInfoProblem = safeProblem(err, config.apiKey);
  }

  const observed = ctx.meter.quota();
  phase.quotaHeadersPresent = { ...observed.headers };
  phase.quotaHeadersAbsent = KNOWN_QUOTA_HEADERS.filter((name) => !(name in observed.headers));

  return phase;
}

/**
 * A plain GET to the judge, with the two vendor headers and nothing else.
 *
 * The key goes into a header object that is constructed here and dropped when
 * the call returns; it is never interpolated into the URL, never logged, and
 * the meter that wraps `fetch` never reads request headers.
 */
async function vendorGet(config: LiveConfig, endpoint: string): Promise<unknown> {
  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    method: "GET",
    headers: { "x-rapidapi-key": config.apiKey, "x-rapidapi-host": config.host },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as unknown;
}

/**
 * An error, reduced to something safe to write down.
 *
 * A thrown value can carry a URL, a response body or — through a badly-built
 * error — a header. Only the message survives, truncated and scrubbed.
 */
function safeProblem(err: unknown, key: string): string {
  if (err instanceof SubmissionCeilingReached) {
    /* Named separately because it is the one failure here that is OURS. A
       reader who sees "the judge did not answer" when what actually happened is
       "we refused to spend more" has been told something false about a vendor. */
    return `stopped by this script's own --max-submissions=${err.ceiling} ceiling; the judge was never asked`;
  }
  const message = err instanceof Error ? err.message : String(err);
  return scrub(message, key).slice(0, 300);
}

function collectLanguageFindings(report: LiveValidationReport): void {
  const l = report.languages;
  if (!l) return;

  /*
   * Discovery failing is the finding that must stop everything.
   *
   * This produced **exit 0** — "clean" — on a run where the catalogue could not
   * be read at all and every request came back refused. The operator's own
   * instruction for this phase is "if this fails, STOP, do not proceed to paid
   * execution", and an exit code of 0 is precisely the signal that tells a
   * script, a CI job, or a tired human to carry on to the phases that spend
   * money.
   *
   * It slipped through because the phase completed — it ran, wrote a section
   * saying UNKNOWN, and returned. Nothing downstream distinguished "we looked
   * and the answer is UNKNOWN" from "we could not look". They are the same
   * shape and opposite facts.
   */
  if (l.catalogueProblem !== null || l.selected === null) {
    report.findings.push({
      severity: "defect",
      phase: "languages",
      summary:
        `Language discovery failed${l.catalogueProblem ? ` (${l.catalogueProblem})` : ""}. ` +
        "No Python runtime was identified, so nothing below it can be trusted and no paid " +
        "phase should be run. Check the key, the subscription and the plan's quota before " +
        "spending anything.",
    });
  }

  if (l.quotaHeadersAbsent.length === KNOWN_QUOTA_HEADERS.length) {
    report.findings.push({
      severity: "note",
      phase: "languages",
      summary:
        "No x-ratelimit-* header arrived on any response. `providerQuota()` will stay null " +
        "forever on this plan and the RapidAPI dashboard is the only meter there is.",
    });
  }

  const version = l.selected?.version ?? null;
  if (version !== null) {
    const minor = Number.parseInt(version.split(".")[1] ?? "0", 10);
    if (minor <= 9) {
      report.findings.push({
        severity: "defect",
        phase: "languages",
        summary:
          `The selected runtime is Python ${version}. Language discovery has no ` +
          "minimum-version floor, so it took the newest on offer and the newest on offer is " +
          "EOL. September's semantics survive it; the security posture does not.",
      });
    }
  }

  if (l.interpreterVersion !== null && version !== null && !l.interpreterVersion.startsWith(version)) {
    report.findings.push({
      severity: "defect",
      phase: "languages",
      summary:
        `The catalogue calls it ${version} and sys.version says ` +
        `${l.interpreterVersion.split(" ")[0]}. The interpreter wins, and the disagreement ` +
        "is itself the finding — a catalogue label is a string beside an id.",
    });
  }

  /* We send cpu 5 s, wall 7 s, memory 262 144 KB. Anything the plan caps below
     that is either a 400 we can see or a silent clamp we cannot. */
  const sent: Record<string, number> = {
    max_cpu_time_limit: 5,
    max_wall_time_limit: 7,
    max_memory_limit: 262_144,
  };
  for (const [field, ours] of Object.entries(sent)) {
    const raw = l.configInfo?.[field];
    if (raw === undefined || raw === "absent") continue;
    const theirs = Number(raw);
    if (Number.isFinite(theirs) && theirs < ours) {
      report.findings.push({
        severity: "defect",
        phase: "languages",
        summary:
          `The plan's ${field} is ${theirs} and this system sends ${ours}. Either every ` +
          "submission is refused with a 400, or the plan clamps it silently and every " +
          "learner's budget is smaller than the curriculum says it is.",
      });
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Phase 2 — conformance                                                       */
/* -------------------------------------------------------------------------- */

async function phaseConformance(
  ctx: RunContext,
  provider: Judge0RapidApiProvider,
  request: MakeRequest,
): Promise<ConformanceRow[]> {
  const rows: ConformanceRow[] = [];
  for (const testCase of CONFORMANCE_CASES) {
    const started = Date.now();
    const raw = await provider.run(request(testCase.source, testCase.stdin, testCase.timeLimitMs));
    const wallMs = Date.now() - started;
    /* Scrubbed BEFORE `verify` sees it, not after. A mismatch message quotes the
       stdout it did not expect, so a verifier handed the raw result would
       launder anything the judge printed straight into `mismatch` and from
       there into the report — past the scrub applied to the two fields below. */
    const result: ExecutionResult = {
      ...raw,
      stdout: scrub(raw.stdout, ctx.config.apiKey),
      stderr: scrub(raw.stderr, ctx.config.apiKey),
    };
    const mismatch = result.infrastructureError
      ? `nothing was measured: ${result.stderr}`
      : testCase.verify(result);
    rows.push({
      id: testCase.id,
      what: testCase.what,
      expected: testCase.expected,
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      wallMs,
      memoryKb: result.memoryKb,
      matched: mismatch === null,
      mismatch,
    });
    ctx.write(`  ${mismatch === null ? "ok  " : "MISS"} ${testCase.id} (${result.status}, ${wallMs} ms)`);
  }
  return rows;
}

/* -------------------------------------------------------------------------- */
/* Phase 3 — sandbox probes                                                    */
/* -------------------------------------------------------------------------- */

async function phaseProbes(
  ctx: RunContext,
  provider: Judge0RapidApiProvider,
  request: MakeRequest,
): Promise<ProbeRow[]> {
  const rows: ProbeRow[] = [];
  for (const probe of SANDBOX_PROBES) {
    const result = await provider.run(request(probe.source, ""));
    const scrubbed: ExecutionResult = {
      ...result,
      /* Scrubbed BEFORE interpretation, not after: `interpret` reads the text
         and copies pieces of it into the reading, so a secret that survived to
         here would be laundered through the interpretation into the report. */
      stdout: scrub(result.stdout, ctx.config.apiKey),
      stderr: scrub(result.stderr, ctx.config.apiKey),
    };
    const reading = probe.interpret(scrubbed);
    rows.push({
      id: probe.id,
      what: probe.what,
      safety: probe.safety,
      boundary: reading.boundary,
      status: scrubbed.status,
      detail: reading.detail,
      securityNote: reading.securityNote,
    });
    ctx.write(`  ${reading.boundary.padEnd(7)} ${probe.id}`);
  }
  return rows;
}

/* -------------------------------------------------------------------------- */
/* Phase 4 — parity                                                            */
/* -------------------------------------------------------------------------- */

interface ParityFixtureLike {
  id: string;
  provenance: { kind: string; blockId?: string; how?: string; why?: string };
  source: string;
  stdin: string;
  stdout: string | null;
  server: string;
  serverTimeLimitMs?: number;
  divergence?: string;
}

async function phaseParity(
  ctx: RunContext,
  provider: Judge0RapidApiProvider,
  request: MakeRequest,
  fixtures: readonly ParityFixtureLike[],
  defaultTimeLimitMs: number,
): Promise<ParityRow[]> {
  const rows: ParityRow[] = [];
  for (const fixture of fixtures) {
    /* The same normalisation `runCases` applies, and for the same reason: a
       case declared without a trailing newline hands the last value to a
       program that then blocks waiting for the end of the line. Using the
       production rule is the whole point of running the real fixtures. */
    const stdin = fixture.stdin.endsWith("\n") ? fixture.stdin : `${fixture.stdin}\n`;
    const started = Date.now();
    const result = await provider.run(
      request(fixture.source, stdin, fixture.serverTimeLimitMs ?? defaultTimeLimitMs),
    );
    const wallMs = Date.now() - started;
    const actualStdout = scrub(result.stdout, ctx.config.apiKey);

    let mismatch: string | null = null;
    if (result.infrastructureError) {
      mismatch = `nothing was measured: ${scrub(result.stderr, ctx.config.apiKey)}`;
    } else if (result.status !== fixture.server) {
      mismatch = `status was \`${result.status}\`, the fixture expects \`${fixture.server}\``;
    } else if (fixture.stdout !== null && actualStdout !== fixture.stdout) {
      mismatch = `stdout was ${JSON.stringify(actualStdout.slice(0, 120))}, expected ${JSON.stringify(fixture.stdout)}`;
    }

    /* Error rows compare STATUS and the (empty) stdout only. CPython rewrote
       its diagnostics across 3.13 and 3.14, so traceback prose differs by
       interpreter vintage — a documented difference, not a defect, and pinning
       it would make the report fail for the wrong reason. */
    const isErrorRow = fixture.server === "compile_error" || fixture.server === "runtime_error";

    rows.push({
      id: fixture.id,
      provenance: describeProvenance(fixture.provenance),
      expectedStatus: fixture.server,
      actualStatus: result.status,
      expectedStdout: fixture.stdout,
      actualStdout,
      wallMs,
      matched: mismatch === null,
      mismatch,
      exempt: isErrorRow ? "traceback prose not compared — version-specific error wording" : null,
    });
    ctx.write(`  ${mismatch === null ? "ok  " : "MISS"} ${fixture.id} (${result.status}, ${wallMs} ms)`);
  }
  return rows;
}

function describeProvenance(p: { kind: string; blockId?: string; how?: string; why?: string }): string {
  if (p.kind === "verbatim") return `${p.blockId ?? "?"}, verbatim`;
  if (p.kind === "derived") return `${p.blockId ?? "?"} — ${p.how ?? ""}`;
  return `synthesised — ${(p.why ?? "").slice(0, 140)}`;
}

/* -------------------------------------------------------------------------- */
/* Phase 5 — cost shape                                                        */
/* -------------------------------------------------------------------------- */

interface CheckBlock {
  id: string;
  source: string;
  cases: readonly { input: string; expectedOutput: string; hidden?: boolean }[];
  checker: OutputChecker | undefined;
}

interface CheckBlocks {
  ordinary: CheckBlock | null;
  worst: CheckBlock | null;
  selection: string;
}

/**
 * The two Checks to measure, taken out of the real curriculum.
 *
 * "Ordinary" is the block with the MEDIAN case count and "worst" is the one
 * with the most, both chosen by id order among ties so a rerun measures the
 * same thing. Neither number is invented: the case count is what the block
 * declares, and one press of Check runs every case it declares — visible and
 * hidden, for a wrong answer as well as a right one.
 */
function pickCheckBlocks(months: readonly Month[]): CheckBlocks {
  const blocks: CheckBlock[] = [];
  for (const month of months) {
    const all: LessonBlock[] = [
      ...month.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)),
      ...(month.assessment?.blocks ?? []),
    ];
    for (const b of all) {
      /* Property tests rather than a block-type allowlist: `ATTEMPT_BLOCK_TYPES`
         is the curriculum's business, and what this phase needs is narrower —
         a block that declares a reference solution AND cases, which is exactly
         what one press of Check costs money for. */
      if (!("referenceSolution" in b) || typeof b.referenceSolution !== "string") continue;
      if (!("cases" in b) || !Array.isArray(b.cases) || b.cases.length === 0) continue;
      blocks.push({
        id: b.id,
        source: b.referenceSolution,
        cases: b.cases,
        checker: "checker" in b ? b.checker : undefined,
      });
    }
  }
  if (blocks.length === 0) {
    return { ordinary: null, worst: null, selection: "No block in the curriculum declares both a reference solution and cases." };
  }

  const counts = blocks.map((b) => b.cases.length).sort((a, b) => a - b);
  const median = counts[Math.floor(counts.length / 2)];
  const byId = [...blocks].sort((a, b) => a.id.localeCompare(b.id));
  const ordinary = byId.find((b) => b.cases.length === median) ?? byId[0];
  const most = Math.max(...counts);
  const worst = byId.find((b) => b.cases.length === most) ?? byId[0];

  return {
    ordinary,
    worst,
    selection:
      `Measured by running the real reference solutions through \`runCases\` — the same ` +
      `function the submit route uses. "Ordinary" is \`${ordinary.id}\`, the block with the ` +
      `median case count (${ordinary.cases.length} of ${blocks.length} blocks counted); ` +
      `"worst case" is \`${worst.id}\`, the block with the most (${worst.cases.length}). ` +
      "One press of Check runs every case a block declares, hidden and visible, for a wrong " +
      "answer as well as a right one — only an infrastructure failure short-circuits it.",
  };
}

async function phaseCost(
  ctx: RunContext,
  provider: Judge0RapidApiProvider,
  runCases: typeof import("@schools/exec").runCases,
  checks: CheckBlocks,
): Promise<CostPhase> {
  const measure = async (block: CheckBlock | null) => {
    if (!block) return null;
    const before = ctx.meter.state();
    const started = Date.now();
    /* The production entry point, unchanged: the same function the submit
       route calls, given the block's own checker so the fan-out being measured
       is the fan-out a learner pays for. */
    const outcome = await runCases(provider, block.source, block.cases, block.checker);
    const wallMs = Date.now() - started;
    const after = ctx.meter.state();
    const measured = {
      blockId: block.id,
      caseCount: block.cases.length,
      submissions: after.submissions - before.submissions,
      apiRequests: after.apiRequests - before.apiRequests,
      polls: after.polls - before.polls,
      wallMs,
      infrastructureFailed: outcome.infrastructureFailed,
    };
    ctx.write(
      `  ${block.id}: ${measured.caseCount} cases → ${measured.submissions} submissions, ` +
        `${measured.apiRequests} API requests, ${wallMs} ms`,
    );
    return measured;
  };

  let problem: string | null = null;
  let ordinary: Awaited<ReturnType<typeof measure>> = null;
  let worst: Awaited<ReturnType<typeof measure>> = null;
  try {
    ordinary = await measure(checks.ordinary);
    worst = await measure(checks.worst);
  } catch (err) {
    problem = safeProblem(err, ctx.config.apiKey);
  }

  return {
    ordinary,
    worstCase: worst,
    selection: checks.selection,
    classroomStudents: CLASSROOM_STUDENTS,
    problem,
  };
}

/* -------------------------------------------------------------------------- */
/* Phase 6 — staged concurrency                                                */
/* -------------------------------------------------------------------------- */

async function phaseConcurrency(
  ctx: RunContext,
  judge0: typeof import("@schools/exec/providers/judge0"),
  request: MakeRequest,
): Promise<ConcurrencyPhase> {
  const stages: StageResult[] = [];
  let stoppedAtWidth: number | null = null;
  let stopReason: string | null = null;

  for (const width of CONCURRENCY_STAGES) {
    if (width > ctx.meter.remaining()) {
      stoppedAtWidth = width;
      stopReason = `Not attempted: ${width} submissions would cross --max-submissions=${ctx.meter.maxSubmissions}.`;
      break;
    }

    /* The gate is process-global and first-limit-wins, which is exactly right
       for a server with one configuration and exactly wrong for a harness that
       has to ask the same question at four widths. `resetJudge0GateForTests` is
       the escape hatch its own documentation describes: without it the first
       provider constructed decides for every stage, and the ladder would
       measure one width four times. */
    judge0.resetJudge0GateForTests();
    const provider = new judge0.Judge0RapidApiProvider({ ...ctx.config, maxConcurrentRequests: width });

    const recordsBefore = ctx.meter.records().length;
    const stateBefore = ctx.meter.state();
    const stageStart = Date.now();
    const stageStartRelative = ctx.meter.elapsedMs();

    const results = await Promise.all(
      Array.from({ length: width }, async () => {
        const t0 = Date.now();
        const result = await provider.run(request("print(1)", ""));
        return { result, ms: Date.now() - t0 };
      }),
    );

    const wallMs = Date.now() - stageStart;
    const stageRecords = ctx.meter.records().slice(recordsBefore);
    const stateAfter = ctx.meter.state();

    const durations = results.map((r) => r.ms).sort((a, b) => a - b);
    /* Queue time is when each POST actually reached the wire, relative to the
       burst starting. Every run in the stage was launched in the same tick, so
       the sorted POST timestamps ARE the per-submission queue delays. It is our
       gate plus process scheduling and nothing else — Judge0's own internal
       queue is not visible from here and is not claimed. */
    const queue = stageRecords
      .filter((r) => r.submissions > 0)
      .map((r) => Math.max(0, r.startedAtMs - stageStartRelative))
      .sort((a, b) => a - b);
    const rateLimited = stateAfter.rateLimited - stateBefore.rateLimited;
    const providerErrors = results.filter((r) => r.result.infrastructureError).length;

    stages.push({
      width,
      submissions: stateAfter.submissions - stateBefore.submissions,
      p50Ms: percentile(durations, 0.5),
      p95Ms: percentile(durations, 0.95),
      queueP50Ms: percentile(queue, 0.5),
      queueMaxMs: queue.length === 0 ? 0 : queue[queue.length - 1],
      rateLimited,
      providerErrors,
      wallMs,
    });
    ctx.write(
      `  width ${width}: p50 ${percentile(durations, 0.5)} ms, p95 ${percentile(durations, 0.95)} ms, ` +
        `429×${rateLimited}, provider errors ${providerErrors}`,
    );

    if (rateLimited > 0 || providerErrors > 0) {
      stoppedAtWidth = width;
      stopReason =
        rateLimited > 0
          ? `Width ${width} drew ${rateLimited} HTTP 429. Escalation stopped permanently — the ` +
            "plan's limits belong to the operator, and a load test that exhausts a " +
            "subscription to prove the subscription can be exhausted is not a test."
          : `Width ${width} produced ${providerErrors} provider error(s). Escalation stopped ` +
            "permanently: past this width the judge is no longer answering, and pushing " +
            "harder measures nothing except how much it costs to be refused.";
      break;
    }
  }

  return { stages, stoppedAtWidth, stopReason };
}

/**
 * Nearest-rank percentile.
 *
 * At these sample sizes p95 is the maximum wearing a percentile's name, which
 * the report says out loud rather than implying otherwise.
 */
function percentile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.max(1, Math.ceil(q * sorted.length));
  return sorted[Math.min(rank, sorted.length) - 1];
}

/* -------------------------------------------------------------------------- */
/* CLI                                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Was this file run, rather than imported?
 *
 * By path rather than `require.main === module`, which only exists in one of
 * the two module systems this file has to survive: tsx compiles it to CommonJS
 * today and vitest imports it as ESM in the offline test.
 */
function invokedDirectly(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  const resolved = path.resolve(entry);
  return resolved.endsWith(path.join("scripts", "live", "judge0-validate.ts"));
}

async function main(): Promise<void> {
  /* Before anything reads `process.env`. A key pasted into `.env.local` — the
     gitignored file the setup runbook points at — must reach this script, or
     the operator is told the key is unset while looking at the line where they
     set it. A real environment variable still wins; see `loadEnvFiles`. */
  loadEnvFiles(path.resolve(import.meta.dirname, "..", ".."));
  installServerOnlyShim();
  const outcome = await runValidation({
    argv: process.argv.slice(2),
    env: process.env,
    write: (line) => process.stdout.write(`${line}\n`),
  });
  process.exitCode = outcome.exitCode;
}

if (invokedDirectly()) {
  void main().catch((err: unknown) => {
    /* Never a stack trace with a URL in it. The message only, and scrubbed
       against the key we were given, because an error thrown out of `fetch` can
       carry the request it failed on. */
    const key = (process.env.JUDGE0_RAPIDAPI_KEY ?? "").trim();
    process.stdout.write(`judge0:validate failed: ${safeProblem(err, key)}\n`);
    process.exitCode = 2;
  });
}
