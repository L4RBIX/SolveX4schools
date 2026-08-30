import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { getStore } from "@schools/store";
import { TeacherShell } from "@/components/teacher/shell";
import { TeacherSkills } from "@/components/teacher/skills";

export const metadata: Metadata = { title: "Дағдылар · Навыки" };

/**
 * The class × skill surface.
 *
 * Same gate as every other teacher route, and the reason is the same one that
 * un-hid the original page: this screen names individual children beside the
 * mistakes the system believes it can name, and being unlinked is not access
 * control. The classes come from `class_teachers` — what this teacher actually
 * teaches — never from their role, and the API repeats the check on every
 * request through `requireClassAccess`.
 *
 * `force-dynamic` because the shell reads `?class=` and `?period=` from the URL,
 * and the `<Suspense>` boundary is what keeps `useSearchParams` from pushing the
 * whole route to client rendering.
 */
export const dynamic = "force-dynamic";

export default async function TeacherSkillsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "student") redirect("/home");
  if (user.mustChangePassword) redirect("/account/password");

  const store = await getStore();
  const classes = await store.classesForTeacher(user.userId);

  return (
    <Suspense fallback={<div className="min-h-dvh bg-sx-page" />}>
      <TeacherShell classes={classes.map((c) => ({ classId: c.classId, className: c.name }))}>
        <TeacherSkills />
      </TeacherShell>
    </Suspense>
  );
}
