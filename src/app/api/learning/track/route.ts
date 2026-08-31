import { NextResponse } from "next/server";
import { MONTH_BY_INDEX } from "@schools/curriculum/months";
import { isTrackLevel, trackCookie } from "@schools/learning/track";

/**
 * Choose a route through one month.
 *
 * The curriculum declares three levels — Қолдау / Негізгі / Тереңдетілген —
 * and `blocksForTrack` has always been able to honour them. Nothing could SET
 * one, so every learner sat on the `core` default and the differentiation the
 * programme sells existed only on paper.
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
 */

export const runtime = "nodejs";

interface TrackBody {
  monthIndex?: unknown;
  track?: unknown;
}

export async function POST(request: Request) {
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
