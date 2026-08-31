import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { getStore } from "@schools/store";
import { TeacherShell } from "@/components/teacher/shell";
import { TeacherAssessments } from "@/components/teacher/assessments";

export const metadata: Metadata = { title: "Тексерістер · Мұғалім кабинеті" };

/**
 * The monthly check, for one class.
 *
 * `force-dynamic` is not optional here: the shell reads the class and the period
 * out of `?class=&period=` with `useSearchParams`, and a statically rendered
 * page would need a `<Suspense>` boundary around chrome that is the same on
 * every teacher screen. It is also the correct setting on its own terms — this
 * page reads a roster, so it must never be cached.
 *
 * The same three redirects as every other teacher route, in the same order. A
 * student who reaches this URL is sent home rather than shown an empty
 * dashboard, because "no classes" and "not a teacher" are different answers and
 * only one of them is about permissions.
 */
export const dynamic = "force-dynamic";

export default async function TeacherAssessmentsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "student") redirect("/home");
  if (user.mustChangePassword) redirect("/account/password");

  const store = await getStore();
  const classes = await store.classesForTeacher(user.userId);

  return (
    <TeacherShell
      /* The store calls it `name`; the shell calls it `className`, because on
         screen it is «9А» and never the id. */
      classes={classes.map((c) => ({ classId: c.classId, className: c.name }))}
    >
      <TeacherAssessments />
    </TeacherShell>
  );
}
