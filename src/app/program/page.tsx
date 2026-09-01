import type { Metadata } from "next";
import { requirePageSession } from "@schools/auth/page-guard";
import { leagueNavVisible } from "@schools/leagues/scope";
import { MONTHS } from "@schools/curriculum/months";
import { monthOutlines } from "@schools/curriculum/public";
import { YearRoadmap } from "@/components/brilliant/app/year-roadmap";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Бағдарлама" };

export default async function PathsPage() {
  const user = await requirePageSession();
  return <YearRoadmap months={monthOutlines(MONTHS)} leagues={leagueNavVisible(user)} />;
}
