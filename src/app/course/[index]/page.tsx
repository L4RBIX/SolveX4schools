import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MONTHS, MONTH_BY_INDEX } from "@schools/curriculum/months";
import { MonthBoard } from "@/components/brilliant/gameboard/month-board";

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
  const { index } = await params;
  const month = MONTH_BY_INDEX.get(Number(index));
  if (!month) notFound();

  return <MonthBoard month={month} />;
}

export const dynamicParams = false;
