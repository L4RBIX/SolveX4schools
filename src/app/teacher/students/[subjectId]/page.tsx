import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { getStore } from "@schools/store";
import { TeacherShell } from "@/components/teacher/shell";
import { StudentDetail } from "@/components/teacher/student-detail";

export const metadata: Metadata = { title: "Мұғалім кабинеті" };

/**
 * One learner, in depth.
 *
 * ## Why the subject id is not checked here
 *
 * It is checked at the API, against THIS class's roster, and a subject outside
 * it answers 404 — the same shape as a class this teacher does not teach, so the
 * endpoint cannot be used to test whether a given subject id exists. Repeating
 * that lookup in the page would add a second place for the two answers to drift
 * apart, and would put a `notFound()` on the screen instead of the sentence
 * `teacherLoadFailure` was written for.
 *
 * The three redirects below are the same ones every teacher route does: they are
 * about who is holding the browser, not about which learner is being read.
 *
 * `force-dynamic` because the shell reads `?class=` and `?period=` through
 * `useSearchParams`, and because the page is behind a session in any case.
 */
export const dynamic = "force-dynamic";

export default async function TeacherStudentPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  const { subjectId } = await params;

  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "student") redirect("/home");
  if (user.mustChangePassword) redirect("/account/password");

  const store = await getStore();
  const classes = await store.classesForTeacher(user.userId);

  return (
    <TeacherShell
      /* The store calls it `name`; the shell calls it `className`, because
         `name` beside `classId` reads as the id's own name. */
      classes={classes.map((c) => ({ classId: c.classId, className: c.name }))}
    >
      <StudentDetail subjectId={subjectId} />
    </TeacherShell>
  );
}
