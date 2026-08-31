import { notFound } from "next/navigation";
import { requirePageSession } from "@schools/auth/page-guard";
import type { Metadata } from "next";
import { MONTHS, MONTH_BY_INDEX } from "@schools/curriculum/months";
import { monthOutline } from "@schools/curriculum/public";
import { resolveTrack } from "@schools/learning/track";
import { gateFor } from "@schools/curriculum/gate";
import { MonthBoard } from "@/components/brilliant/gameboard/month-board";
import { MonthNotOpen } from "@/components/brilliant/gameboard/month-not-open";

export function generateStaticParams() {
  return MONTHS.map((m) => ({ index: String(m.index) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ index: string }>;
}): Promise<Metadata> {
  const { index } = await params;
  const month = MONTH_BY_INDEX.get(Number(index));
  return { title: month ? month.title.kk : "Ай" };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ index: string }>;
}) {
  await requirePageSession();

  const { index } = await params;
  const month = MONTH_BY_INDEX.get(Number(index));
  if (!month) notFound();

  /* The board is where the route through this month is chosen, so it has to be
     told which one is already in force. Reading the cookie here rather than in
     the client component keeps one definition of "the learner's track" — the
     same `resolveTrack` the lesson and assessment pages use to decide which
     blocks to send — instead of a second, browser-side guess that could drift
     out of step with the payload the learner actually receives. */
  const track = await resolveTrack(month.index);

  /* An unapproved month is not a 404 here, unlike its lessons.
     The board is the learner's map of the year, and a month they cannot open
     yet is a real and useful thing to see — what is NOT acceptable is a board
     full of nodes that each 404 when tapped. So the month renders as closed,
     with a reason, rather than as absent or as a set of dead links. */
  const gate = await gateFor(month);
  if (!gate.open) return <MonthNotOpen month={monthOutline(month)} />;

  return <MonthBoard month={monthOutline(month)} track={track} />;
}

/* Per request, because the answer depends on a cookie. `generateStaticParams`
   stays as the routable-month allowlist; it is no longer a prebuild list. Two
   learners in the same class are on different routes, and a cached board would
   show one of them the other's. */
export const dynamic = "force-dynamic";
export const dynamicParams = false;
