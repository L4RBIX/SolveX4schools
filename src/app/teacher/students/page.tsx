import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { getStore } from "@schools/store";
import { TL } from "@schools/teacher/labels";
import { TeacherShell } from "@/components/teacher/shell";
import { TeacherRoster } from "@/components/teacher/students";

/* The tab title is one language deep — a document title cannot switch with the
   in-app locale — so it comes from the catalogue rather than from a literal, the
   same way the teacher home page's does. */
export const metadata: Metadata = { title: `${TL.navStudents.kk} · ${TL.title.kk}` };

/**
 * `force-dynamic` because the shell reads `?class=` and `?period=` through
 * `useSearchParams`, and because this page must never be cached across teachers:
 * it lists named children.
 */
export const dynamic = "force-dynamic";

/**
 * The class roster.
 *
 * The guard is the same three redirects the teacher home page uses, and it is
 * the outer half of the control rather than the whole of it: the API this page's
 * client component calls is guarded independently by `requireClassAccess`, so a
 * teacher who edits `?class=` in the URL gets a 404 from the route regardless of
 * what this page renders. The class list here is read from `class_teachers` —
 * the classes this teacher actually teaches, not the ones their role implies.
 */
export default async function TeacherStudentsPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "student") redirect("/home");
  if (user.mustChangePassword) redirect("/account/password");

  const store = await getStore();
  const classes = await store.classesForTeacher(user.userId);

  return (
    <TeacherShell
      /* The store returns the school's own name as `name`; the shell wants it as
         `className`, because a class id is an internal handle and «9А» is what a
         teacher recognises. */
      classes={classes.map((c) => ({ classId: c.classId, className: c.name }))}
    >
      <TeacherRoster />
    </TeacherShell>
  );
}
