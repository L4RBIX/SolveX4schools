import { NextResponse } from "next/server";
import { getStore } from "@schools/store";
import { anonCookie, resolveIdentity } from "@schools/learning/identity";
import { buildDictionary, resolveRef } from "@schools/learning/error-dictionary";

/**
 * The learner's error dictionary — «Жеке қателер журналы» (PDF).
 *
 * GET returns two lists: what the learner has kept, and what they could keep.
 * POST keeps one.
 *
 * ## Scoped by construction
 *
 * There is no `subjectId` parameter on either verb, so no version of this route
 * can be pointed at another child — the same shape `/api/learning/state/me` and
 * `/api/learning/activity` already use.
 *
 * ## The evidence check is the addressing scheme
 *
 * An entry is named by an opaque `ref`, and the only refs that resolve are the
 * ones derived from the caller's own attributed mistakes. "You may only save a
 * mistake you actually made" is therefore not a validation that a future edit
 * could drop — there is no other way to name an entry at all.
 *
 * ## What never crosses this boundary
 *
 * The failure class. `remainder_vs_quotient_swap` is the label the system filed
 * the mistake under, and `/api/learning/state/me` already refuses to return
 * misconception names on the grounds that what the engine decided is the
 * learner's business and what it called it is not. The learner gets the
 * author's explanation of the wrong answer, and their own words. Nothing here
 * composes a sentence about them — see `schools/learning/error-dictionary.ts`.
 */

export const runtime = "nodejs";

/** Matches the CHECK on `learner_error_dictionary.note`. */
const NOTE_MAX = 500;

export async function GET() {
  const { subjectId } = await resolveIdentity();
  const store = await getStore();

  const [mistakes, saved] = await Promise.all([
    store.attributedMistakes(subjectId),
    store.errorDictionary(subjectId),
  ]);

  return Response.json(buildDictionary(mistakes, saved));
}

interface SaveBody {
  ref?: string;
  note?: string;
}

export async function POST(request: Request) {
  let body: SaveBody;
  try {
    body = (await request.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const ref = typeof body.ref === "string" ? body.ref : "";
  if (!/^[0-9a-f]{16}$/.test(ref)) {
    return NextResponse.json({ error: "ref required" }, { status: 400 });
  }

  /* The learner's own words, or nothing. Trimmed here so a textarea containing
     only whitespace does not become a note; refused rather than truncated when
     it is over length, because silently cutting a child's sentence in half is
     worse than telling them it was too long. */
  const raw = typeof body.note === "string" ? body.note.trim() : "";
  if (raw.length > NOTE_MAX) {
    return NextResponse.json({ error: "note too long", max: NOTE_MAX }, { status: 400 });
  }

  const { subjectId, anonId, isNew } = await resolveIdentity();
  const store = await getStore();

  const [mistakes, saved] = await Promise.all([
    store.attributedMistakes(subjectId),
    store.errorDictionary(subjectId),
  ]);

  const hit = resolveRef(ref, mistakes, saved);
  if (!hit) {
    /* Not "forbidden". A ref that does not resolve names nothing at all, and
       distinguishing "someone else's mistake" from "no such mistake" would
       leak the difference. */
    return NextResponse.json({ error: "unknown entry" }, { status: 404 });
  }

  await store.saveErrorEntry({
    subjectId,
    blockId: hit.blockId,
    failureClass: hit.failureClass,
    note: raw.length > 0 ? raw : null,
  });

  const res = NextResponse.json({ ref, saved: true });
  if (isNew) res.cookies.set(anonCookie(anonId));
  return res;
}
