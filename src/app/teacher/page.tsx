import { notFound } from "next/navigation";
import { config } from "@schools/config";
import { TeacherClassroom } from "@/components/brilliant/app/teacher-classroom";

/**
 * The teacher surface.
 *
 * Not reachable in production. See the API route for why: without auth this
 * lists every child in a class, and being unlinked is not access control.
 */
export default function TeacherPage() {
  if (config.environment === "production") notFound();
  return <TeacherClassroom classId={config.pilot.classId} />;
}
