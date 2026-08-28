import "server-only";
import { randomUUID } from "node:crypto";
import { getStoreHandle } from "@schools/store";

/**
 * An episode id the caller is actually allowed to write into.
 *
 * ## The hole this closes
 *
 * `episodeId` arrives in the request body of both `/api/learning/submit` and
 * `/api/nova/hint`, and until this function existed nothing checked whose
 * episode it was. The subject is read from an httpOnly cookie and cannot be
 * forged, so no route could ever be pointed at another child's *identity* — but
 * the episode is a second key into the same ledger, and it was accepted on the
 * browser's word.
 *
 * Two consequences, and they run in opposite directions:
 *
 * 1. **Reading.** `enforceHintPolicy` derives the hint ceiling from
 *    `lastGrantedLevel(episodeId)`, `lastHintAt(episodeId)` and
 *    `eventsForEpisode(episodeId)` — all keyed on the episode alone. Posting a
 *    classmate's episode id would compute the grant from THEIR history, and the
 *    grant is echoed straight back to the caller in the `policy` frame. That is
 *    a read of another learner's work, small but real. The same key drives
 *    `priorFailures` on submit, which decides whether an answer is revealed.
 *
 * 2. **Writing.** Both routes then append events and interventions under the
 *    caller's `subject_id` and the supplied `episode_id`. The reducer folds an
 *    episode by `eventsForEpisode(episodeId)` and attributes the result to the
 *    single `subject_id` `staleEpisodes` happens to return, so a foreign
 *    episode id mixes two children's events into one episode and charges one
 *    learner's assistance against the other's independence weight. That is
 *    fabricated evidence about a child, which is the one class of defect this
 *    product treats as unacceptable.
 *
 * ## Why this is worth fixing even though it is nearly unexploitable
 *
 * Episode ids are v4 UUIDs minted in the browser and are never shown to another
 * learner, so guessing one is guessing 122 bits. The realistic path here is not
 * an attacker; it is a bug — a shared device, a copied request in a debugging
 * session, a future feature that puts an episode id in a URL. The check costs
 * one indexed lookup on a path that already does several, and it converts
 * "nobody can currently reach this" into "this cannot happen".
 *
 * ## Why it substitutes rather than refusing
 *
 * A 403 would be correct and would also mean a learner whose request carried a
 * stale id gets an error instead of a graded answer. Minting a fresh id keeps
 * the attempt working and confines the damage: the foreign episode is neither
 * read nor written, and the caller's own work lands in an episode of their own.
 * The caller is told which id was used — both routes already return
 * `episodeId` — so a legitimate client simply continues under the new one.
 */
export async function ownedEpisodeId(
  subjectId: string,
  requested: unknown,
): Promise<string> {
  if (typeof requested !== "string" || !isUuid(requested)) return randomUUID();

  const { sql } = await getStoreHandle();

  /* Both tables, because the hint route writes `interventions` before it writes
     `learning_events`: a request that failed between the two leaves an episode
     that exists in one and not the other, and checking only the ledger would
     hand it to whoever asked next.

     `limit 1` on each side and an existence test rather than a fetch — the
     question is "is this episode already somebody else's", not "what is in it". */
  /* Each branch is parenthesised: Postgres will not accept a bare `limit`
     immediately before `union all`, and PGlite reports it as "syntax error at
     or near union" — which is a long way from the line that caused it. */
  const r = await sql.query<{ foreign_rows: number }>(
    `select count(*)::int as foreign_rows from (
       (select 1 from learning_events
         where episode_id = $1 and subject_id <> $2 limit 1)
       union all
       (select 1 from interventions
         where episode_id = $1 and subject_id <> $2 limit 1)
     ) t`,
    [requested, subjectId],
  );

  return Number(r.rows[0]?.foreign_rows ?? 0) > 0 ? randomUUID() : requested;
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
