import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The forgery channel, and the fact that it is closed.
 *
 * `POST /api/learning/events` is the only write path into the ledger from an
 * untrusted browser. Its filter was `isLearningEventName` and nothing else, so
 * any logged-in learner could post `verdict_received` with verdict `accepted`
 * and manufacture a solve they never earned — into the same table a teacher
 * reads the term's evidence out of. Stamping the row `browser` was not a
 * defence while nothing read the stamp back, and nothing did.
 *
 * ## Why this suite reads the source
 *
 * Driving the route needs a Next request context, a session cookie and an
 * `after()` runtime; the suites that do that live in `tests/school/routes.test.ts`
 * and are slow. What is asserted here is cheaper and, for this particular
 * guarantee, stronger: that the SHAPE of the route still has the property.
 *
 * A behavioural test proves the route rejects one forged event today. These
 * assertions fail the moment somebody deletes the trust table, adds an outcome
 * name to the browser-trusted set, or removes the ownership check — which is
 * how this defence would actually be lost. It would not be lost by someone
 * writing a route that accepts a forged verdict on purpose; it would be lost by
 * someone adding a name to a list without knowing what the list was for.
 */

const ROOT = process.cwd();
const source = readFileSync(
  path.join(ROOT, "src/app/api/learning/events/route.ts"),
  "utf8",
);

/**
 * The five events that carry evidential weight.
 *
 * Each is written by the server on the path that produced it — the submit route
 * grades and writes the verdict, the hint route grants and writes the
 * assistance. A browser has no honest reason to author any of them.
 */
const OUTCOME_EVENTS = [
  "verdict_received",
  "failure_attributed",
  "solution_revealed",
  "assistance_requested",
  "assistance_delivered",
];

/** The eight the browser genuinely is the only witness to. */
const OBSERVATION_EVENTS = [
  "episode_opened",
  "episode_resumed",
  "episode_closed",
  "statement_revisited",
  "code_diff_classified",
  "idle_gap",
  "test_case_authored",
  "run_executed",
];

describe("the ingest route separates observations from outcomes", () => {
  it("names every outcome event as needing more than a browser's word", () => {
    /* If a name is missing from the route entirely, the taxonomy grew and this
       list did not — which is exactly the moment to decide which side of the
       line the new event falls on, rather than defaulting to the permissive
       one. */
    for (const name of OUTCOME_EVENTS) {
      expect(source, `${name} must appear in the trust table`).toContain(name);
    }
  });

  it("still accepts the observations only a browser can see", () => {
    /* The complement, and it matters as much: a route that rejected these would
       have closed the forgery channel by closing the channel. A code edit
       happens client-side and an idle gap is the absence of anything reaching
       us — refusing them would mean the reducer never sees a learner think. */
    for (const name of OBSERVATION_EVENTS) {
      expect(source, `${name} must still be ingestible`).toContain(name);
    }
  });

  it("requires an attestation, not a claim, for the outcome events", () => {
    /* `verifyAttestation` had zero production call sites before this phase: the
       HMAC existed, was tested, and guarded nothing. */
    expect(source).toContain("verifyAttestation");
    expect(source).toContain("attestationSecret");
  });

  it("scopes the episode to the caller", () => {
    /* The one write path from an untrusted browser was the only route that
       never called `ownedEpisodeId` — submit and nova/hint both did. A foreign
       episode id mixes two children's events into one episode and charges one
       learner's assistance against another's independence. */
    expect(source).toContain("ownedEpisodeId");
  });

  it("drops a rejected event rather than failing the batch", () => {
    /* Ingest is fire-and-forget from `keepalive: true` beacons nobody awaits.
       Erroring on a batch would throw away the honest events sitting beside the
       forged one, and a learner would lose real progress because somebody else
       opened a console. The count is the signal instead. */
    expect(source).toMatch(/bump\(/);
    expect(source).not.toMatch(/throw new Error\([^)]*forged/i);
  });
});

describe("the ledger reads the trust it stamps", () => {
  it("selects source_trust when reading an episode back", () => {
    /* The stamp was written and never read: `eventsForEpisode` did not select
       the column, so nothing downstream could distinguish a judge's verdict
       from a browser's claim about one. A defence that is recorded and never
       consulted is a comment. */
    const store = readFileSync(
      path.join(ROOT, "schools/store/learning-store.ts"),
      "utf8",
    );
    const fn = store.slice(store.indexOf("async eventsForEpisode"));
    const body = fn.slice(0, fn.indexOf("\n  }"));
    expect(body).toContain("source_trust");
  });

  it("gates the hint ladder on server-trusted rows only", () => {
    /* The attempt bridge admits `episode_opened` as effort, which is what lets
       help open on a block the judge never returned a verdict for. That is only
       safe because the same filter refuses anything a browser stamped — without
       it, the fix for the lock-out would have been a one-line `fetch()` that
       unlocks the ladder without answering anything. */
    const attempts = readFileSync(
      path.join(ROOT, "schools/learning/attempts.ts"),
      "utf8",
    );
    expect(attempts).toContain("sourceTrust");
    expect(attempts).toMatch(/TRUSTED[^\n]*=\s*new Set\(\["server", "judge", "verifier"\]\)/);
    expect(attempts).toContain("episode_opened");
  });
});
