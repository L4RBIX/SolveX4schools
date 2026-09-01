import type { Metadata } from "next";
import { requirePageSession } from "@schools/auth/page-guard";
import { leagueNavVisible } from "@schools/leagues/scope";
import { SchoolReview } from "@/components/brilliant/app/school-review";

/**
 * `/review` — the delayed re-solve.
 *
 * A thin page over a client component, the same shape `/you` uses: everything
 * it needs arrives from `/api/learning/review`, which is scoped to the caller's
 * own cookie and is the only place the fresh episode is minted. Rendering the
 * queue here as a Server Component would mean resolving identity in a place
 * that cannot set a cookie, and would put the task content into the RSC payload
 * before the learner had opened anything.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Қайталау" };

export default async function ReviewPage() {
  const user = await requirePageSession();
  return <SchoolReview leagues={leagueNavVisible(user)} />;
}
