import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { SignInForm } from "@/components/brilliant/auth/sign-in-form";
import { AuthShell } from "@/components/brilliant/auth/auth-shell";

export const metadata: Metadata = { title: "Кіру" };
export const dynamic = "force-dynamic";

/**
 * Already signed in? Go where you belong.
 *
 * Decided server-side from the role, so the sign-in page is never a way to sit
 * on a route the session does not entitle you to.
 */
export default async function LoginPage() {
  const user = await currentUser();
  if (user) {
    if (user.mustChangePassword) redirect("/account/password");
    redirect(user.role === "student" ? "/home" : "/teacher");
  }
  return (
    <AuthShell hint="Логин мен құпиясөзді мұғалім береді · Логин и пароль выдаёт учитель">
      <SignInForm />
    </AuthShell>
  );
}
