import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { PreferencesPanel } from "@/components/brilliant/settings/preferences-panel";

export const metadata: Metadata = { title: "Параметрлер" };
export const dynamic = "force-dynamic";

export default async function PreferencesSettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <PreferencesPanel user={user} />;
}
