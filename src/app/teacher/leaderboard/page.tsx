import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { getStore } from "@schools/store";
import { TeacherShell } from "@/components/teacher/shell";
import { TeacherLeaderboard } from "@/components/teacher/leaderboard";

export const metadata: Metadata = { title: "Рейтинг · Рейтинг" };

/**
 * The class ranking.
 *
 * Same gate as every other teacher route, and here it matters more than
 * anywhere else on the surface: this page puts named children in an order. The
 * classes come from `class_teachers` — what this teacher actually teaches, never
 * their role — and `requireClassAccess` repeats the check on the API for every
 * request, answering 404 rather than 403 so the endpoint cannot be used to
 * enumerate a school's classes.
 *
 * The ordering itself never leaves the class: there is no cross-class and no
 * cross-school comparison anywhere behind this route, and the panel says so on
 * screen in every state it can be in.
 *
 * `force-dynamic` because the shell reads `?class=` and `?period=` and the panel
 * reads `?lens=`; the `<Suspense>` boundary is what keeps `useSearchParams` from
 * pushing the whole route to client rendering.
 */
export const dynamic = "force-dynamic";

export default async function TeacherLeaderboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "student") redirect("/home");
  if (user.mustChangePassword) redirect("/account/password");

  const store = await getStore();
  const classes = await store.classesForTeacher(user.userId);

  return (
    <Suspense fallback={<div className="min-h-dvh bg-sx-page" />}>
      <TeacherShell classes={classes.map((c) => ({ classId: c.classId, className: c.name }))}>
        <TeacherLeaderboard />
      </TeacherShell>
    </Suspense>
  );
}
