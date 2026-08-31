import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@schools/auth/session";
import { getStore } from "@schools/store";
import { TeacherShell } from "@/components/teacher/shell";
import { OverviewPanel, TeacherNoClasses } from "@/components/teacher/overview";

export const metadata: Metadata = { title: "Мұғалім кабинеті" };

/**
 * `useSearchParams` in the shell reads `?class=` and `?period=`, and the whole
 * surface is per-teacher data behind a session cookie. Neither can be
 * prerendered, so the page stays dynamic rather than sitting under a `Suspense`
 * boundary that would only paper over the same fact.
 */
export const dynamic = "force-dynamic";

/**
 * The teacher surface.
 *
 * It used to `notFound()` in production, and the reason was honest: without
 * auth this page lists every child in a class with the misconceptions the
 * system believes it can name, and being unlinked is not access control.
 *
 * Migration 0012 supplied what was missing. The page shows the classes this
 * teacher actually teaches — read from `class_teachers`, not from their role —
 * and a teacher with no classes sees an empty list rather than somebody else's
 * children. That list is also the only class picker there is: a class absent
 * from it is not selectable here, and `requireClassAccess` answers 404 for it
 * regardless of what a URL asks for.
 *
 * Everything below the auth check is rendered by the client panel, which fetches
 * `/api/teacher/class/{classId}/overview` and reports the class context and the
 * projection's freshness back up into the chrome.
 */
export default async function TeacherPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role === "student") redirect("/home");
  if (user.mustChangePassword) redirect("/account/password");

  const store = await getStore();
  const classes = await store.classesForTeacher(user.userId);

  /* The store's own shape is `{ schoolId, classId, name }`; the shell wants the
     school's name for the class under the name it renders it by. `schoolId` is
     deliberately not passed on — nothing on the teacher surface renders it, and
     the API derives scope from the session rather than from anything the browser
     could send. */
  const options = classes.map((c) => ({ classId: c.classId, className: c.name }));

  return (
    <TeacherShell classes={options}>
      {options.length === 0 ? <TeacherNoClasses /> : <OverviewPanel />}
    </TeacherShell>
  );
}
