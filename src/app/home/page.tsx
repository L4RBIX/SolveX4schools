import { MONTHS } from "@schools/curriculum/months";
import { monthOutlines } from "@schools/curriculum/public";
import { requirePageSession } from "@schools/auth/page-guard";
import { SchoolHome } from "@/components/brilliant/app/school-home";

export const dynamic = "force-dynamic";

/**
 * The student home.
 *
 * The greeting used to drop the learner's name because identity was an
 * anonymous cookie and the product genuinely did not know who was reading.
 * Migration 0012 changed that: there is an account with a display name from the
 * school's roster, so the name is real when there is a session and absent when
 * there is not — which, outside development, means there is no page.
 */
export default async function StudentHome() {
  const user = await requirePageSession();
  return (
    <SchoolHome months={monthOutlines(MONTHS)} learnerName={user?.displayName ?? null} />
  );
}
