import "server-only";
import { config } from "@schools/config";
import { getStore } from "@schools/store";
import { runSweep } from "./sweep";

/**
 * Sweep triggers.
 *
 * Three of them, one implementation:
 *
 * 1. **An in-process interval.** This is what makes "nobody clicks anything"
 *    true. `next.config.ts` already sets `output: "standalone"`, so the app is
 *    a long-running Node process — which is what an interval needs and what
 *    data residency forces anyway.
 * 2. **An opportunistic hook after ingest.** Debounced, so a burst of events
 *    from one lesson does not start a sweep per event.
 * 3. **An external cron**, for a deployment that cannot keep a process warm.
 *
 * All three take the same lease, so extra triggers are harmless.
 */

let lastSweepStartedAt = 0;
/** Two sweeps for the same learner inside this window is wasted work. */
const DEBOUNCE_MS = 3_000;

export async function maybeSweep(_subjectId: string): Promise<void> {
  const now = Date.now();
  if (now - lastSweepStartedAt < DEBOUNCE_MS) return;
  lastSweepStartedAt = now;
  try {
    const store = await getStore();
    await runSweep(store, { limit: 50 });
  } catch (err) {
    // A failed sweep must never fail the learner's request. The episodes stay
    // stale and the next trigger retries them.
    console.error("[sweep] opportunistic sweep failed", err);
  }
}

let interval: ReturnType<typeof setInterval> | null = null;

export function startSweepInterval(): void {
  if (interval || !config.sweep.inProcess) return;
  interval = setInterval(() => {
    void (async () => {
      try {
        const store = await getStore();
        const result = await runSweep(store, { limit: 200 });
        if (result.errors.length > 0) {
          console.error("[sweep] episode errors", result.errors);
        }
      } catch (err) {
        console.error("[sweep] interval sweep failed", err);
      }
    })();
  }, config.sweep.intervalMs);
  // Never hold the process open on its own account.
  interval.unref?.();
}
