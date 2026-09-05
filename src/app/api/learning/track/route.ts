import { NextResponse } from "next/server";
import { MONTH_BY_INDEX } from "@schools/curriculum/months";
import { checkLearningAccess } from "@schools/auth/policy";
import { isTrackLevel, trackCookie } from "@schools/learning/track";

/**
 * Choose a route through one month.
 *
 * The curriculum declares three levels — Қолдау / Негізгі / Тереңдетілген —
 * and `blocksForTrack` has always been able to honour them. Nothing could SET
 * one, so every learner sat on the `core` default and the differentiation the
 * programme sells existed only on paper.
 *
 * ## The learner-facing control was removed; this was not
 *
 * «Осы айдағы бағытың» — the three-level switch on the month board — is gone
 * from the product on the owner's instruction, and this route is now its only
 * caller's ghost: nothing in the UI POSTs here any more. It stays because the
 * CAPABILITY is not the button. `resolveTrack` still decides which blocks a
 * lesson payload carries, `blocksForTrack` still honours `tracks: ["support"]`
 * in the curriculum, and deleting this would leave the product with no way for
 * a learner ever to be on a route other than `core` — which would quietly
 * change what a support-track learner is handed. If the switch never comes
 * back, this becomes an operator/API surface and should be documented as one
 * rather than deleted by reflex.
 *
 * ## Why this is a write and nothing else
 *
 * The route sets a cookie and returns. It deliberately does NOT filter, grade
 * or record anything: the filtering happens server-side in `publicLesson`, so
 * the worst a forged request can achieve is asking for a different set of
 * blocks — which is what the button does anyway. There is no privilege to
 * escalate here, which is exactly why the cookie is allowed to be readable.
 *
 * ## Why `monthIndex` is checked against the curriculum
 *
 * The cookie NAME is built from this number (`sx_track_m<N>`). An unvalidated
 * value would let a caller name a cookie whatever it liked, and would in any
 * case let the jar fill with routes for months that do not exist. Only a month
 * the programme actually teaches gets one.
 *
 * ## Why it is gated anyway
 *
 * This is the one learning route with nothing to steal: no store, no identity,
 * no evidence, and — as above — no privilege to escalate. It carries
 * `checkLearningAccess` because `schools/auth/policy.ts` exists precisely so
 * two routes under `/api/learning` cannot hold different opinions about who may
 * be here, and "this particular one happens to be harmless today" is how the
 * exception survives until the day somebody adds a store call to it. Choosing a
 * differentiation route through a month — Қолдау, Негізгі, Тереңдетілген — is a
 * decision about an enrolled learner's teaching, so requiring enrolment is also
 * simply true.
 */

export const runtime = "nodejs";

interface TrackBody {
  monthIndex?: unknown;
  track?: unknown;
}

export async function POST(request: Request) {
  /* Production and preview require a session; development may stay anonymous.
     See `schools/auth/policy.ts` — one place decides, so two routes cannot
     disagree about whether a stranger may accumulate learning evidence. */
  const access = await checkLearningAccess();
  if (!access.ok) return Response.json({ error: access.reason }, { status: access.status });

  let body: TrackBody;
  try {
    body = (await request.json()) as TrackBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const monthIndex = body.monthIndex;
  if (
    typeof monthIndex !== "number" ||
    !Number.isInteger(monthIndex) ||
    !MONTH_BY_INDEX.has(monthIndex)
  ) {
    return NextResponse.json({ error: "unknown month" }, { status: 400 });
  }

  const track = body.track;
  /* `isTrackLevel` is the same predicate `resolveTrack` uses to decide whether
     to trust a cookie it finds. One definition of "valid", so a value this
     route accepts can never be one the reader silently discards. */
  if (typeof track !== "string" || !isTrackLevel(track)) {
    return NextResponse.json({ error: "unknown track" }, { status: 400 });
  }

  const res = NextResponse.json({ monthIndex, track });
  res.cookies.set(trackCookie(monthIndex, track));
  return res;
}
