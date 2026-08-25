import type { Metadata } from "next";
import { YouEvidence } from "@/components/brilliant/app/you-evidence";

export const metadata: Metadata = { title: "Прогресс" };

export default function YouPage() {
  return <YouEvidence />;
}
