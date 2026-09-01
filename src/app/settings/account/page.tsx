import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { getStore } from "@schools/store";
import { leagueNavVisible } from "@schools/leagues/scope";
import { AccountPanel } from "@/components/brilliant/settings/account-panel";

export const metadata: Metadata = { title: "Аккаунт" };
export const dynamic = "force-dynamic";

/**
 * `/settings/account`.
 *
 * Server component, and the redirect is the point: an unauthenticated visitor
 * is sent to `/login` before any markup describing an account exists. Guarding
 * this in a client effect would ship the shell, then hide it.
 */
export default async function AccountSettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const store = await getStore();
  const classes =
    user.role === "student"
      ? await store.classesForLearner(user.userId)
      : await store.classesForTeacher(user.userId);

  return (
    <AccountPanel
      user={user}
      school={user.schoolId}
      classes={classes.map((c) => c.classId)}
      leagues={leagueNavVisible(user)}
    />
  );
}
