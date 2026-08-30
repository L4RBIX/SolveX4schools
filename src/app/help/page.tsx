import type { Metadata } from "next";
import { HelpCenter } from "@/components/brilliant/help/help-center";

export const metadata: Metadata = {
  title: "Анықтама",
  description:
    "SolveX4Schools туралы жиі қойылатын сұрақтар: бағдарлама, Nova AI, аккаунт және деректер.",
};

export default function HelpPage() {
  return <HelpCenter />;
}
