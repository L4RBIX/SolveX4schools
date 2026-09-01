import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageSession } from "@schools/auth/page-guard";
import { leagueNavVisible } from "@schools/leagues/scope";
import { SchoolLeague } from "@/components/brilliant/app/league/school-league";

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
 */
export default async function LeaguePage() {
  /* `requirePageSession` returns null on the anonymous DEVELOPMENT path — in
     production and preview it has already redirected to /login. An anonymous
     subject has no school and therefore no competition, so `leagueNavVisible`
     answers false for it and this is a 404 rather than a crash on
     `user.schoolId`. */
  const user = await requirePageSession();
  if (!leagueNavVisible(user)) notFound();

  return <SchoolLeague />;
}
