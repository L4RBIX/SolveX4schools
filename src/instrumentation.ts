/**
 * Process startup.
 *
 * Two jobs, both of which exist because the alternative fails silently.
 *
 * 1. **Assert the configuration.** A missing `LEARNING_ATTESTATION_SECRET`
 *    makes every verdict downgrade to browser trust with no error anywhere;
 *    the product goes on looking like it works while it has stopped learning
 *    anything. Better to refuse to start.
 *
 * 2. **Start the reducer.** The imported subsystem has no scheduler — its own
 *    documentation says the reducer has only ever run from a manual admin
 *    button. A school product cannot ship that, so the sweep runs on an
 *    interval in-process. `next.config.ts` already sets `output: "standalone"`,
 *    which is a long-running Node process: exactly what an interval needs.
 */
export async function register() {
  // Only the Node runtime. The edge runtime has no filesystem and no timers
  // worth the name, and importing the store there would fail at build.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertProductionConfig } = await import("@schools/config");
  const problems = assertProductionConfig();
  if (problems.length > 0) {
    for (const p of problems) console.error(`[config] ${p}`);
    throw new Error(
      `Refusing to start: ${problems.length} configuration problem(s) that would fail silently in production.`,
    );
  }

  const { startSweepInterval } = await import("@schools/reducer/trigger");
  startSweepInterval();
}
