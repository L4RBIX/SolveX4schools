import type { Metadata } from "next";
import { MONTHS } from "@schools/curriculum/months";
import { YearRoadmap } from "@/components/brilliant/app/year-roadmap";

export const metadata: Metadata = { title: "Бағдарлама" };

export default function PathsPage() {
  return <YearRoadmap months={MONTHS} />;
}
