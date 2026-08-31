import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { ChangePasswordForm } from "@/components/brilliant/auth/change-password-form";
import { AuthShell } from "@/components/brilliant/auth/auth-shell";

export const metadata: Metadata = { title: "Құпиясөз" };
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <AuthShell>
      <ChangePasswordForm forced={user.mustChangePassword} />
    </AuthShell>
  );
}
