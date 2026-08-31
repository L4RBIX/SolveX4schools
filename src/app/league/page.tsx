import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { config } from "@schools/config";
import { requirePageSession } from "@schools/auth/page-guard";
import { leaguesEnabledForSchool } from "@schools/leagues/gate";
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
 */
export default async function LeaguePage() {
  const user = await requirePageSession();

  /* `requirePageSession` returns null on the anonymous DEVELOPMENT path — in
     production and preview it has already redirected to /login. An anonymous
     subject has no school and therefore no competition, so this is a 404 rather
     than a crash on `user.schoolId`. */
  if (!user || !leaguesEnabledForSchool(config.leagues, user.schoolId)) notFound();

  return <SchoolLeague />;
}
