import type { Metadata } from "next";
import { requirePageSession } from "@schools/auth/page-guard";
import { leagueNavVisible } from "@schools/leagues/scope";
import { SchoolYou } from "@/components/brilliant/app/school-you";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Прогресс" };

export default async function YouPage() {
  const user = await requirePageSession();
  return <SchoolYou leagues={leagueNavVisible(user)} />;
}
