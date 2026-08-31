import type { Metadata } from "next";
import { AppHeader } from "@/components/brilliant/app/app-header";
import { CourseGameboard } from "@/components/brilliant/gameboard/course-gameboard";

export const metadata: Metadata = {
  title: "Thinking in Code | Brilliant",
  description: "Build solid foundations for computational problem solving.",
};

/**
 * brilliant.org/courses/thinking-in-code/ — the authenticated course gameboard.
 * The board owns its own scrolling, so the page itself does not scroll.
 */
export default function BrilliantAppCourse() {
  return (
    <div className="h-screen overflow-hidden bg-b-bg font-b-sans text-white">
      <AppHeader active="courses" />
      <CourseGameboard />
    </div>
  );
}
