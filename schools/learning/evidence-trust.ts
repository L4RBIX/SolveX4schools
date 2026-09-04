/**
 * What counts as proof that a learner did something.
 *
 * Kept free of `server-only` and free of any store import: it is a SQL fragment
 * and a set, and both the store and the teacher queries need it. One definition,
 * because two would eventually disagree and the disagreement would be silent —
 * a teacher's roster and the completion policy reporting different numbers about
 * the same child, with nothing anywhere saying which is right.
 *
 * ## The defect
 *
 * `learning_events.source_trust` is the whole trust model: `browser` for what a
 * page observed, `server` for what this service did, `judge` for a graded
 * verdict, `verifier` for an attributed failure. The ingest route lets a browser
 * author `episode_opened` — correctly, because the client uses it for its own
 * telemetry about a lesson being opened.
 *
 * Two consumers then counted those rows as submissions, with no trust filter at
 * all:
 *
 *   - `blockAttempts` in the store, which is what `schools/policies/completion.ts`
 *     reads to decide whether a lesson is finished;
 *   - `classBlockEvidence` in the teacher queries, which is what a teacher sees
 *     as "required work 1/8" and "reached 6/6".
 *
 * Measured: five `POST /api/learning/events` with `episode_opened` at browser
 * trust, then `POST /api/learning/complete` → 200, `first: true`. Six posted
 * events → the teacher's roster read "required work 1/8" and the lesson read
 * "reached 6/6", for a learner with no submission and no verdict.
 *
 * Month unlock still held — it needs a judge-signed verdict, and that filter was
 * already there. So the gate was sound and the RECORDS were not, which is the
 * worse half for a teacher: nothing looked wrong.
 *
 * ## The rule
 *
 * A browser may say what it saw. It may not say what a learner achieved.
 * Evidence is `server`, `judge` or `verifier` — the three trust levels only this
 * service can stamp. `browser` is observation, and observation is not work.
 *
 * The hint ladder already applied exactly this filter, and its comment says why:
 * *"a browser can post `verdict_received` into its own episode, and without this
 * line three `fetch()` calls opened the answer to a task nobody had attempted."*
 * This is the same sentence, applied to the two places that had not heard it.
 */

/** The trust levels only this server can stamp. */
export const EVIDENCE_TRUST = ["server", "judge", "verifier"] as const;

export type EvidenceTrust = (typeof EVIDENCE_TRUST)[number];

/**
 * The predicate, as SQL, for a query that has aliased `learning_events`.
 *
 * Written as `<> 'browser'` rather than `in (...)` deliberately: a trust level
 * added to the taxonomy later is server-side by definition — `browser` is the
 * only untrusted one there is or can be — so this stays correct without anyone
 * remembering to extend a list. The TypeScript side has the explicit set,
 * because there the compiler can check it.
 *
 * @param alias the table alias, or "" for an unaliased `learning_events`.
 */
export function evidenceTrustSql(alias = ""): string {
  const prefix = alias ? `${alias}.` : "";
  return `${prefix}source_trust <> 'browser'`;
}

/** The same question, for rows already in memory. */
export function isEvidence(sourceTrust: string): boolean {
  return sourceTrust !== "browser";
}
