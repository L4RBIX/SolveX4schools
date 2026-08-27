import "server-only";
import { PYTHON_RUNTIME } from "@schools/execution/python-policy";

/**
 * Server configuration.
 *
 * Every secret is read here and nowhere else, and none of them carries a
 * `NEXT_PUBLIC_` prefix. That is not a convention — it is the mechanism. A
 * `NEXT_PUBLIC_` variable is inlined into the client bundle at build time, so
 * prefixing one to "make something work" ships it to every browser
 * permanently, including the ones belonging to fourteen-year-olds who will
 * absolutely open DevTools.
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

export const config = {
  /** Where the PGlite data directory lives. Ignored when DATABASE_URL is set. */
  dataDir: env("LEARNING_DATA_DIR") ?? ".data/learning",

  /** Set in production. Its presence selects the Postgres driver. */
  databaseUrl: env("DATABASE_URL"),

  environment: ((): "production" | "preview" | "development" => {
    const v = env("VERCEL_ENV") ?? env("NODE_ENV");
    if (v === "production") return "production";
    if (v === "preview") return "preview";
    return "development";
  })(),

  /** Signer and verifier must hold the same value. */
  attestationSecret: env("LEARNING_ATTESTATION_SECRET"),

  /** Guards the cron entry point to the reducer. */
  cronSecret: env("LEARNING_CRON_SECRET"),

  sweep: {
    /** In-process interval. `false` disables it for serverless deployments. */
    inProcess: env("LEARNING_SWEEP_IN_PROCESS") !== "false",
    intervalMs: Number(env("LEARNING_SWEEP_INTERVAL_MS") ?? 20_000),
  },

  nova: {
    /** `echo` needs no credentials and is the default, so the product runs offline. */
    provider: env("NOVA_PROVIDER") ?? "echo",
    /**
     * Kill switch. Independent of the credential: a school that wants the tutor
     * off for a week of assessments should not have to delete a secret to do it.
     */
    enabled: env("NOVA_ENABLED") !== "false",
    apiKey: env("DEEPSEEK_API_KEY"),
    baseUrl: env("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com",
    /**
     * The model, and a corrected default.
     *
     * This was `deepseek-chat`, which DeepSeek **retired on 2026-07-24**. It no
     * longer resolves — it returns an error rather than falling back — so the
     * first thing that would have happened after adding a real API key is that
     * every single Nova request failed upstream, while the config test suite
     * went on passing because nothing here had ever been checked against the
     * provider's own documentation.
     *
     * `deepseek-v4-flash` is what `deepseek-chat` was aliased to during the
     * migration window, and it is the cheap tier: a 14-year-old asking why
     * their `if` does not fire does not need the reasoning model.
     * See `docs/nova/DEEPSEEK_SETUP.md`.
     */
    model: env("DEEPSEEK_MODEL") ?? "deepseek-v4-flash",
    /**
     * Thinking mode, off.
     *
     * V4 enables it by default at `high` effort, and reasoning tokens bill as
     * output. For a reply capped at six sentences that is most of the cost and
     * most of the latency, spent on a chain of thought the learner never sees
     * and the hint ladder already decided the shape of.
     */
    thinking: env("DEEPSEEK_THINKING") === "true",
    requestTimeoutMs: Number(env("NOVA_REQUEST_TIMEOUT_MS") ?? 30_000),
    maxOutputTokens: Number(env("NOVA_MAX_OUTPUT_TOKENS") ?? 500),

    /**
     * Ceilings.
     *
     * Per learner where the unit is a request, per deployment where the unit is
     * money. A runaway loop in one browser must not be able to spend the
     * school's whole month, and a class of eighteen must not be able to either.
     * Zero disables a limit; the default is a real number rather than zero so
     * that forgetting to configure one is the safe direction.
     */
    dailyRequestLimit: Number(env("NOVA_DAILY_REQUEST_LIMIT") ?? 60),
    monthlyInputTokenLimit: Number(env("NOVA_MONTHLY_INPUT_TOKEN_LIMIT") ?? 20_000_000),
    monthlyOutputTokenLimit: Number(env("NOVA_MONTHLY_OUTPUT_TOKEN_LIMIT") ?? 4_000_000),
    monthlyCostLimitUsd: Number(env("NOVA_MONTHLY_COST_LIMIT_USD") ?? 25),

    /**
     * Peak prices, deliberately.
     *
     * DeepSeek charges half rate off-peak; peak is 01:00–04:00 and 06:00–10:00
     * UTC, which is 06:00–09:00 and 11:00–15:00 in Almaty — the school day. So
     * peak IS the normal case here, and budgeting at the off-peak rate would
     * put the cap at roughly twice the money it claims to be.
     * v4-flash, cache miss: $0.44 / Mtok in, $1.32 / Mtok out.
     */
    inputUsdPerMTok: Number(env("DEEPSEEK_INPUT_USD_PER_MTOK") ?? 0.44),
    outputUsdPerMTok: Number(env("DEEPSEEK_OUTPUT_USD_PER_MTOK") ?? 1.32),
  },

  /**
   * The pilot's single school and class.
   *
   * A placeholder for enrolment, and deliberately a crude one: every subject is
   * scoped to this class on creation so the teacher projection has real data to
   * read. When enrolment exists, scope comes from the roster and these
   * disappear — nothing downstream reads them directly.
   */
  pilot: {
    schoolId: env("SCHOOL_ID") ?? "pilot-school",
    classId: env("CLASS_ID") ?? "grade-9a",
  },

  exec: {
    /** `local` runs a subprocess; `piston` calls a self-hosted judge. */
    provider: env("EXEC_PROVIDER") ?? "local",
    pistonUrl: env("PISTON_URL"),
    /** Interpreter for the local dev provider. */
    pythonBin: env("EXEC_PYTHON_BIN") ?? "python3",
    /**
     * The pinned learner runtime, re-exported from the one file that declares it.
     *
     * Deliberately NOT read from an environment variable, and that is the point:
     * a school operator who can change the Python version from a dashboard can
     * make two months of a child's evidence incomparable without anyone noticing
     * or being able to say when it happened. The version is a programme decision
     * that ships with the build, so changing it is a commit and a rebuild — both
     * of which leave a trace.
     *
     * Consequence for `docs/deployment/PRODUCTION_ENVIRONMENT.md`: nothing. There
     * is no new variable for its table to document, which is the intended shape.
     */
    python: PYTHON_RUNTIME,
  },

  ops: {
    /**
     * Bearer token for the ADMIN health view.
     *
     * A second door beside the `admin` role, not a replacement for it. The
     * thing that has to reach `/api/health` at 03:00 is an uptime monitor, and
     * a monitor has no session, no password to rotate and no business holding
     * one. Absent, the machine door is simply closed — the admin view is then
     * reachable only by a signed-in admin, which is the safe direction to fail
     * for an endpoint whose whole job is to describe the infrastructure.
     *
     * Never asserted at boot. A pilot that never wires a monitor is not
     * misconfigured; it just has one fewer way to be woken up.
     */
    adminToken: env("LEARNING_ADMIN_TOKEN"),
  },
} as const;

/**
 * The judge, checked as data rather than as ambient configuration.
 *
 * Pure, and takes its inputs rather than reading `config`, because the object
 * above resolves `process.env` once at import: anything that inspects it
 * directly can only ever be tested against whatever environment the test runner
 * happens to be in. This shape lets the whole production matrix be asserted
 * without module-reload gymnastics.
 *
 * The decision it enforces is `docs/CODE_EXECUTION_DECISION.md`: RUN is Pyodide
 * in the learner's browser and needs nothing here, SUBMIT is a self-hosted
 * Piston on a Kazakh host. There is no third option, and `local` is not one —
 * see `schools/exec/providers/local.ts`.
 */
export function executionProviderProblems(
  environment: string,
  exec: { provider: string; pistonUrl?: string },
): string[] {
  const problems: string[] = [];
  if (environment !== "production") return problems;

  if (exec.provider === "piston") {
    if (!exec.pistonUrl) {
      problems.push(
        "EXEC_PROVIDER=piston but PISTON_URL is not set. Every code submission " +
          "would fail to reach the judge and settle as unmeasured.",
      );
    }
    return problems;
  }

  /* `local` and anything unrecognised land in the same place, because
     `getExecutionProvider` falls back to `LocalExecutionProvider` for every
     value that is not exactly "piston" — and that provider throws in
     production by design. The submit route catches the throw and leaves the
     verdict `unknown`, so the failure is invisible: nineteen September code
     tasks stop being graded and every learner is told the sandbox is not
     connected. A typo in this variable is therefore as fatal as omitting it,
     and must read as loudly. */
  if (exec.provider === "local") {
    problems.push(
      "EXEC_PROVIDER=local in production. The local provider is a subprocess " +
        "with the app's filesystem, network and credentials rather than a " +
        "sandbox, so it refuses to run there and every code task would go " +
        "ungraded while telling the learner the sandbox is unavailable.",
    );
  } else {
    problems.push(
      `EXEC_PROVIDER=${JSON.stringify(exec.provider)} is not a provider this ` +
        "build knows. Execution falls back to the local subprocess, which " +
        "refuses to run in production, so every code task would go ungraded.",
    );
  }
  return problems;
}

/**
 * Fail at boot, not at the first learner.
 *
 * A missing attestation secret makes `verifyAttestation` return null, which is
 * indistinguishable from a forged token — so a misconfigured deployment looks
 * exactly like an attack, every verdict silently downgrades to browser trust,
 * no misconception ever becomes actionable, and the product goes on looking
 * like it works while it has quietly stopped learning anything.
 */
export function assertProductionConfig(): string[] {
  const problems: string[] = [];
  if (config.environment !== "production") return problems;

  if (!config.attestationSecret) {
    problems.push(
      "LEARNING_ATTESTATION_SECRET is not set. Every judge verdict would " +
        "downgrade to browser trust silently.",
    );
  } else if (config.attestationSecret.length < 32) {
    problems.push("LEARNING_ATTESTATION_SECRET is shorter than 32 characters.");
  }
  if (!config.databaseUrl && config.dataDir.startsWith(".")) {
    problems.push(
      "No DATABASE_URL and the data directory is relative. On an ephemeral " +
        "filesystem every learner's progress is lost on redeploy.",
    );
  }
  if (config.nova.provider === "deepseek" && !config.nova.apiKey) {
    problems.push("NOVA_PROVIDER=deepseek but DEEPSEEK_API_KEY is not set.");
  }
  problems.push(...executionProviderProblems(config.environment, config.exec));
  return problems;
}
