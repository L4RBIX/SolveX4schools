import "server-only";
import { cookies } from "next/headers";
import type { TrackLevel } from "@schools/curriculum/types";

/**
 * Which route through the month this learner is on.
 *
 * ## Why this file had to exist
 *
 * The programme sells three differentiation levels — Қолдау, Негізгі,
 * Тереңдетілген — and the curriculum declared `tracks` on five September
 * blocks. Nothing read it. `grep` for `.tracks` across `schools/`, `src/` and
 * `packages/` returned zero runtime hits, and `school-lesson.tsx` was literally
 * `const blocks = lesson.blocks`. All three levels received an identical
 * sequence, so the differentiation a school was paying for did not exist.
 *
 * ## Per topic, not per child
 *
 * The programme is explicit that a level describes *a route through a month*,
 * not a label attached to a student: "a learner can be advanced in loops and
 * support in binary search" (`types.ts`). So the track is stored per month
 * rather than as one global setting, and a learner who is finding September
 * hard is not thereby marked "support" for the year.
 *
 * ## Why a cookie, and why it is honest about that
 *
 * There is no enrolment yet, so this sits beside `identity.ts` and shares its
 * limitation: it is a device preference, not an enrolment record. It is
 * deliberately NOT httpOnly — a teacher setting a learner's route in class, or
 * the learner choosing it themselves, is not a security boundary and pretending
 * otherwise would mean a round trip for a preference.
 *
 * What DOES need to be server-side is the filtering, and that is: blocks a
 * learner's route excludes are removed in `publicLesson` before the payload is
 * built, so a browser cannot award itself the advanced set by editing a
 * variable — it can only ask for a different route, which is allowed anyway.
 */

const COOKIE_PREFIX = "sx_track_m";

export const DEFAULT_TRACK: TrackLevel = "core";

const VALID: ReadonlySet<string> = new Set<TrackLevel>(["support", "core", "advanced"]);

export function isTrackLevel(value: string | undefined): value is TrackLevel {
  return value !== undefined && VALID.has(value);
}

/** Cookie name for one month's route. */
export function trackCookieName(monthIndex: number): string {
  return `${COOKIE_PREFIX}${monthIndex}`;
}

/**
 * The learner's route for a month. `core` when nothing has been chosen — the
 * programme's own default, and the one that delivers the full task set.
 */
export async function resolveTrack(monthIndex: number): Promise<TrackLevel> {
  const jar = await cookies();
  const raw = jar.get(trackCookieName(monthIndex))?.value;
  return isTrackLevel(raw) ? raw : DEFAULT_TRACK;
}

export function trackCookie(monthIndex: number, track: TrackLevel) {
  return {
    name: trackCookieName(monthIndex),
    value: track,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 400 * 24 * 60 * 60,
  };
}
