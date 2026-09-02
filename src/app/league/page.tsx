import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageSession } from "@schools/auth/page-guard";
import { knownSubjectId } from "@schools/learning/identity";
import { leagueNavVisible } from "@schools/leagues/scope";
import { leagueUnlockFor, unlockFrom } from "@schools/leagues/unlock";
import { getStoreHandle } from "@schools/store";
import {
  SchoolLeague,
  type LeagueUnlockState,
} from "@/components/brilliant/app/league/school-league";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Лига" };

/**
 * The league page.
 *
 * `notFound()` rather than a redirect or an "unavailable" screen when the
 * feature is off for this school, matching the API route beside it: a page that
 * exists but refuses tells a learner at school B that school A has something
 * they do not, and 404 is the answer the product gives everywhere else that a
 * response would otherwise be an oracle.
 *
 * The gate is read HERE and not in the client component because `config` is
 * `server-only` — a client component importing it fails the build, which is the
 * mechanism `check:bundle` exists to protect.
 *
 * ## One predicate, shared with the nav
 *
 * `leagueNavVisible` is what every other surface asks before rendering the
 * league tab, so a tab that appears and a page that 404s cannot happen. It also
 * closed a real gap: this page used to gate on the SCHOOL alone, so a teacher at
 * an enabled school could open `/league` — and then `GET /api/league/me` refused
 * them, because `requireLearner` 403s anybody who is not an enrolled student,
 * and the screen rendered its «не удалось загрузить» failure state. An adult
 * would file that as a bug. `leagueNavVisible` refuses non-students up front,
 * which is the same answer `leagueScopeForCurrentUser` has always given.
 *
 * ## And the unlock, which the gate above does NOT cover
 *
 * `leagueNavVisible` answers "does this school have a league" and "is this
 * person a student". Neither of those is "has this learner earned their way in
 * yet", and they must not be conflated: the tab is shown to every student at an
 * enabled school from their first day, so a learner below `LEAGUE_UNLOCK_XP`
 * can and does arrive here. What they used to find was the board's loading
 * shape followed by a table with one row on it reading 0 XP — a picture of
 * losing, shown to somebody who has not started.
 *
 * The unlock is read here rather than in the client because it is a database
 * fact, and it is read the same way `/home` reads it: `sum(amount)` over
 * `league_xp_awards`, the one ledger the whole XP model rests on. There is no
 * second counter.
 */
export default async function LeaguePage() {
  /* `requirePageSession` returns null on the anonymous DEVELOPMENT path — in
     production and preview it has already redirected to /login. An anonymous
     subject has no school and therefore no competition, so `leagueNavVisible`
     answers false for it and this is a 404 rather than a crash on
     `user.schoolId`. */
  const user = await requirePageSession();
  if (!leagueNavVisible(user)) notFound();

  return <SchoolLeague unlock={await unlockState()} />;
}

/**
 * The learner's unlock, or `null` if it could not be established.
 *
 * `null` is not "locked" — it is "unknown", and the screen treats it as the
 * unlocked path. That direction is deliberate and it is the same one
 * `src/app/home/page.tsx` takes: telling a learner who has earned their league
 * that they have not is a much worse failure than showing the board to somebody
 * a failed query could not vouch for, and the API is the real gate on what they
 * are actually allowed to read.
 *
 * `knownSubjectId` rather than `resolveIdentity`: a page render must not mint a
 * learning subject it can never set a cookie for. No subject means no evidence
 * has ever been recorded for this learner, which is a lifetime total of zero —
 * genuinely locked, and the truthful answer.
 */
async function unlockState(): Promise<LeagueUnlockState | null> {
  try {
    const subjectId = await knownSubjectId();
    /* `unlockFrom(0)` rather than a hand-written triple: `needed` is the
       threshold minus the total and that subtraction has exactly one
       definition, in `unlock.ts`. Writing the zero case out by hand here is how
       a screen ends up saying «Ещё 0 XP» to somebody who has earned none. */
    if (!subjectId) return unlockFrom(0);
    const { sql } = await getStoreHandle();
    return await leagueUnlockFor(sql, subjectId);
  } catch {
    return null;
  }
}
