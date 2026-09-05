import { notFound } from "next/navigation";
import { requirePageSession } from "@schools/auth/page-guard";
import { leagueNavVisible } from "@schools/leagues/scope";
import type { Metadata } from "next";
import { MONTHS, MONTH_BY_INDEX } from "@schools/curriculum/months";
import { monthOutline, monthOutlines } from "@schools/curriculum/public";
import { resolveTrack } from "@schools/learning/track";
import { gateFor } from "@schools/curriculum/gate";
import { currentLearnerMayEnter, unlockStateForSubject } from "@schools/learning/access";
import { knownSubjectId } from "@schools/learning/identity";
import { getStore } from "@schools/store";
import { blockingRequirement } from "@schools/presentation/adapters";
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
  const user = await requirePageSession();

  const { index } = await params;
  const month = MONTH_BY_INDEX.get(Number(index));
  if (!month) notFound();

  /* An unapproved month is not a 404 here, unlike its lessons.
     The board is the learner's map of the year, and a month they cannot open
     yet is a real and useful thing to see — what is NOT acceptable is a board
     full of nodes that each 404 when tapped. So the month renders as closed,
     with a reason, rather than as absent or as a set of dead links. */
  /* The track still decides WHICH BLOCKS this month's outline carries —
     `monthOutline(month, track)` below, and the same `resolveTrack` the lesson
     and assessment pages use. What was removed is the CONTROL that let a
     learner change it from this page, not the mechanism: a support-track
     learner must still be handed the support-track month. */
  const track = await resolveTrack(month.index);

  const gate = await gateFor(month);
  if (!gate.open) return <MonthNotOpen month={monthOutline(month)} reason="unpublished" />;

  /* Published, but not yet this learner's. Same panel and the same reasoning as
     the comment above — a closed month is a real and useful thing to see, and a
     board of nodes that each 404 when tapped is not. The learner is told what
     opens it, which is true and is theirs to act on. */
  if (!(await currentLearnerMayEnter(month.index))) {
    /*
      And say what is actually outstanding.

      The sentence alone («finish the previous month») was a false promise: the
      assessment completion policy never requires a correct answer, so a learner
      could satisfy every word of it and still find this door shut. The checklist
      names the second condition and shows where they stand in both.

      Read only on this branch — the panel is the only thing that wants it, and
      an unlocked month must not pay for a query it does not use. Counts and
      booleans cross to the browser; `blockingRequirement` is where that is
      enforced.
    */
    const subjectId = await knownSubjectId();
    const requirement = subjectId
      ? blockingRequirement(monthOutlines(MONTHS), await unlockStateForSubject(subjectId))
      : null;

    return (
      <MonthNotOpen
        month={monthOutline(month)}
        reason="locked"
        requirement={requirement}
      />
    );
  }

  /*
   * The completions the SERVER has, handed to the board.
   *
   * The map's ticks and lock marks came from a `localStorage` snapshot and
   * nothing else, so they were a browser's opinion: a second device showed an
   * empty year to a learner who had finished September, and clearing site data
   * erased a school's record from the learner's own view of it.
   * `lesson_completions` — the row `/api/learning/complete` refuses to write
   * unless the policy is satisfied against the ledger — was never consulted.
   *
   * `useProgress` unions this with the local copy rather than replacing it: the
   * local one is what makes the board change in the same frame as a completion,
   * and a lesson that finishes and lights nothing up reads as broken even when
   * every part works. Both are written by the same route, so neither can be
   * wrong in the direction that matters.
   *
   * Ids only. Which lessons are finished is the learner's own progress; the
   * counts and timestamps beside them are not what a board renders.
   */
  const boardSubject = await knownSubjectId();
  const completed = boardSubject
    ? (await (await getStore()).completionsForSubject(boardSubject)).map((c) => c.lessonId)
    : [];

  return (
    <MonthBoard
      month={monthOutline(month, track)}
      completed={completed}
      leagues={leagueNavVisible(user)}
    />
  );
}

/* Per request, because the answer depends on a cookie. `generateStaticParams`
   stays as the routable-month allowlist; it is no longer a prebuild list. Two
   learners in the same class are on different routes, and a cached board would
   show one of them the other's. */
export const dynamic = "force-dynamic";
export const dynamicParams = false;
