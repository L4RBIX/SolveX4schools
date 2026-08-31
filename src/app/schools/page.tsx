import type { Metadata } from "next";
import { SchoolsPage } from "@/components/brilliant/schools-page";

export const metadata: Metadata = { title: "Мектептерге" };

export default function Schools() {
  return <SchoolsPage />;
}
