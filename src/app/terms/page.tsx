import type { Metadata } from "next";
import { TERMS } from "@schools/legal/documents";
import { LegalDocPage } from "@/components/brilliant/legal/legal-doc";

export const metadata: Metadata = {
  title: "Пайдалану шарттары",
  description: "SolveX4Schools платформасын пайдалану шарттары.",
};

export default function TermsPage() {
  return <LegalDocPage doc={TERMS} />;
}
