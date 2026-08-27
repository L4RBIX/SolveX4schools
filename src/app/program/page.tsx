import type { Metadata } from "next";
import { requirePageSession } from "@schools/auth/page-guard";
import { MONTHS } from "@schools/curriculum/months";
import { monthOutlines } from "@schools/curriculum/public";
import { YearRoadmap } from "@/components/brilliant/app/year-roadmap";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Бағдарлама" };

export default async function PathsPage() {
  await requirePageSession();
  return <YearRoadmap months={monthOutlines(MONTHS)} />;
}
