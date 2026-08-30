import "server-only";
import { getStore } from "@schools/store";
import { isPublicAttemptBlock } from "./checking";
import { knownSubjectId } from "./identity";
import { projectHydration, type LessonHydration } from "./hydration";
import type { PublicBlock } from "@schools/curriculum/public";

/**
 * Read one lesson's restorable state, for the learner making this request.
 *
 * The server half of `schools/learning/hydration.ts`. That module decides what
 * the rows MEAN and is pure; this one does the reading and is `server-only`.
 *
 * ## Called from the page, not from a fetch
 *
 * `/lesson/[lessonId]` is already `force-dynamic`, already calls
 * `requirePageSession()` and already opens the store for the publication gate.
 * So the state travels down as a prop, in the same render, and there is no
 * mount-time GET to flash past.
 *
 * That matters more here than it usually does. The alternative — render the
 * lesson blank, fetch, then repaint — means every learner briefly sees the
 * exact bug this phase exists to remove, and a learner on a school Wi-Fi that
 * drops sees it permanently. A wrong first frame that corrects itself is still
 * a wrong first frame, and this one says "none of your work is here".
 *
 * ## Identity is resolved read-only, and that is not an optimisation
 *
 * `knownSubjectId()` rather than `resolveIdentity()`. The writing form touches
 * `last_seen_at`, upserts the class scope, and on the anonymous branch mints a
 * subject and returns `isNew` for the caller to set as a cookie — which a
 * Server Component cannot do. Using it here would create an orphan subject on
 * every render of the busiest route in the product. See `knownSubjectId`.
 *
 * A learner with no subject yet has no history, so `null` is the honest answer
 * and an empty hydration is the correct render.
 *
 * ## Cost
 *
 * Four queries for a lesson of any size, not one per block. Each of the three
 * per-block reads takes the whole id list and groups server-side. A twelve-block
 * lesson costs the same as a three-block one.
 */
export async function lessonHydration(
  lessonId: string,
  blocks: readonly PublicBlock[],
): Promise<LessonHydration> {
  const empty: LessonHydration = { lessonId, blocks: {}, completedAt: null };

  const subjectId = await knownSubjectId();
  if (!subjectId) return empty;

  /* Only attempt blocks are asked about. A concept card has nothing to grade,
     and asking the ledger whether somebody read a paragraph would be inventing
     a claim the event taxonomy deliberately refuses to make. */
  const blockIds = blocks.filter((b) => isPublicAttemptBlock(b)).map((b) => b.id);
  if (blockIds.length === 0) {
    const store = await getStore();
    const completion = await store.lessonCompletion(subjectId, lessonId);
    return { ...empty, completedAt: completion?.completedAt ?? null };
  }

  const store = await getStore();

  /* Concurrent because they are independent reads of the same snapshot-ish
     state and the page is waiting on all of them. Sequential would make the
     lesson open four round trips slower for no ordering benefit. */
  const [settled, evidence, assistance, completion] = await Promise.all([
    store.settledBlocks(subjectId, blockIds),
    store.blockAttempts(subjectId, blockIds),
    store.assistanceByBlock(subjectId, blockIds),
    store.lessonCompletion(subjectId, lessonId),
  ]);

  return projectHydration({
    lessonId,
    blocks: blocks.map((b) => ({ id: b.id, isAttempt: isPublicAttemptBlock(b) })),
    settled,
    evidence,
    assistance,
    completedAt: completion?.completedAt ?? null,
  });
}
