import type { Metadata } from "next";
import { requirePageSession } from "@schools/auth/page-guard";
import { leagueNavVisible } from "@schools/leagues/scope";
import { MONTHS } from "@schools/curriculum/months";
import { monthOutlines } from "@schools/curriculum/public";
import { knownSubjectId } from "@schools/learning/identity";
import { getStore } from "@schools/store";
import { YearRoadmap } from "@/components/brilliant/app/year-roadmap";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Бағдарлама" };

export default async function PathsPage() {
  const user = await requirePageSession();
  const subjectId = await knownSubjectId();

  /* The completions the SERVER holds. Every per-month bar on this page is drawn
     from them; without this the year read `localStorage` alone, so a learner on
     a second device — or one whose school machine wipes site data between
     sessions — was shown an empty year they had in fact worked through.

     `knownSubjectId` rather than `resolveIdentity`: a page render must not mint
     a subject it can never set a cookie for, and `null` here is the truthful
     "nothing recorded yet" that an empty roadmap already says. */
  const completed = subjectId
    ? (await (await getStore()).completionsForSubject(subjectId)).map((c) => c.lessonId)
    : [];

  return (
    <YearRoadmap
      months={monthOutlines(MONTHS)}
      completed={completed}
      leagues={leagueNavVisible(user)}
    />
  );
}
