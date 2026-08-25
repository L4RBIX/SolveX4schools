import "server-only";

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
    apiKey: env("DEEPSEEK_API_KEY"),
    baseUrl: env("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com",
    model: env("DEEPSEEK_MODEL") ?? "deepseek-chat",
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
  },
} as const;

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
  return problems;
}
