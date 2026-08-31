import type { Metadata } from "next";
import { AboutPage } from "@/components/brilliant/about/about-page";

export const metadata: Metadata = {
  title: "Біз туралы",
  description:
    "SolveX4Schools — мектепке арналған тоғыз айлық спорттық бағдарламалау бағдарламасы.",
};

export default function About() {
  return <AboutPage />;
}
