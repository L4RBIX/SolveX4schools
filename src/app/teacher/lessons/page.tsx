import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { getStore } from "@schools/store";
import { TL } from "@schools/teacher/labels";
import { TeacherShell } from "@/components/teacher/shell";
import { TeacherLessons } from "@/components/teacher/lessons";

/* The tab title is one language deep — a document title cannot switch with the
   in-app locale — so it comes from the catalogue rather than from a literal, the
   same way the roster page's does. */
export const metadata: Metadata = { title: `${TL.navLessons.kk} · ${TL.title.kk}` };

/**
 * `force-dynamic` because the shell reads `?class=` and `?period=` through
 * `useSearchParams`, and because nothing on this surface may be cached across
 * teachers: the drill-down names children and what they are stuck on.
 */
export const dynamic = "force-dynamic";

/**
 * Lessons, class-wide.
 *
 * The guard is the same three redirects every teacher page uses, and it is the
 * outer half of the control rather than the whole of it: the route this page's
 * client component calls is guarded independently by `requireClassAccess`, so a
 * teacher who edits `?class=` in the URL gets a 404 from the API regardless of
 * what this page renders. The class list comes from `class_teachers` — the
 * classes this teacher actually teaches, not the ones their role implies.
 */
export default async function TeacherLessonsPage() {
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
      <TeacherLessons />
    </TeacherShell>
  );
}
