import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { getStore } from "@schools/store";
import { TeacherHome } from "@/components/brilliant/app/teacher-home";

export const metadata: Metadata = { title: "Мұғалім кабинеті" };
export const dynamic = "force-dynamic";

/**
 * The teacher surface.
 *
 * It used to `notFound()` in production, and the reason was honest: without
 * auth this page lists every child in a class with the misconceptions the
 * system believes it can name, and being unlinked is not access control.
 *
 * Migration 0012 supplied what was missing. The page now shows the classes this
 * teacher actually teaches — read from `class_teachers`, not from their role —
 * and a teacher with no classes sees an empty list rather than somebody else's
 * children.
 */
export default async function TeacherPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "student") redirect("/home");
  if (user.mustChangePassword) redirect("/account/password");

  const store = await getStore();
  const classes = await store.classesForTeacher(user.userId);

  return <TeacherHome teacherName={user.displayName} classes={classes} />;
}
