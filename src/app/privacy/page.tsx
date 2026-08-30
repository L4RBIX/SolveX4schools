import type { Metadata } from "next";
import { PRIVACY } from "@schools/legal/documents";
import { LegalDocPage } from "@/components/brilliant/legal/legal-doc";

export const metadata: Metadata = {
  title: "Құпиялылық саясаты",
  description: "SolveX4Schools қандай деректерді сақтайды және оны кім көреді.",
};

export default function PrivacyPage() {
  return <LegalDocPage doc={PRIVACY} />;
}
