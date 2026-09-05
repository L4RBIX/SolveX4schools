"use client";

/**
 * What the learner has typed but not yet checked, kept per browser.
 *
 * ## Why this is not on the server
 *
 * The product deliberately does not store a learner's unsubmitted text.
 * `learning_events.payload` is allowlisted and `learning_submissions.response`
 * is documented to carry no learner text — see the `restored` flag in
 * `school-lesson.tsx`, which exists because hydration CANNOT bring an answer
 * back. That is a privacy decision and this does not reopen it: a draft never
 * leaves the device, is never read by the server, and is not part of any
 * record a teacher can see.
 *
 * ## Why it exists at all
 *
 * A fourteen-year-old writing their first program will reload the page. They
 * will also close the tab by accident, and their school laptop will sleep. In
 * every one of those cases the editor came back holding the starter frame and
 * their work was gone, with nothing anywhere saying it would be. Losing twenty
 * minutes of a first program is how a learner concludes the tool is not safe to
 * think in.
 *
 * ## Every access is guarded
 *
 * `localStorage` does not merely return null when unavailable — the accessor
 * itself throws in a private window, in a preview frame, and on a machine whose
 * browser is configured to block site data. School machines are exactly the
 * population where that configuration is common, so every call here is wrapped
 * and every failure degrades to "no draft", never to a broken page. Same rule
 * as `src/lib/progress.ts`.
 */

const PREFIX = "solvex.draft.v1:";

/** Bounded, so a runaway paste cannot fill a school laptop's quota. */
const MAX_DRAFT_BYTES = 64 * 1024;

function key(blockId: string): string {
  return `${PREFIX}${blockId}`;
}

/** What they typed here last time, or null. */
export function readDraft(blockId: string): string | null {
  try {
    return window.localStorage.getItem(key(blockId));
  } catch {
    return null;
  }
}

/**
 * Remember what they have typed.
 *
 * Writing the STARTER back is a no-op on purpose: an untouched editor is not a
 * draft, and storing one would make "has a draft" true for every block a
 * learner has ever opened.
 */
export function writeDraft(blockId: string, source: string, starter: string): void {
  try {
    if (source === starter || source.trim() === "") {
      window.localStorage.removeItem(key(blockId));
      return;
    }
    if (new TextEncoder().encode(source).length > MAX_DRAFT_BYTES) return;
    window.localStorage.setItem(key(blockId), source);
  } catch {
    /* Blocked, full, or a private window. The lesson still works; it just will
       not be remembered. */
  }
}

/** Settled work has an answer in the ledger; the draft is no longer the truth. */
export function clearDraft(blockId: string): void {
  try {
    window.localStorage.removeItem(key(blockId));
  } catch {
    /* nothing to do */
  }
}
