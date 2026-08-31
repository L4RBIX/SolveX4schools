import type { Metadata } from "next";
import { AppHeader } from "@/components/brilliant/app/app-header";
import { LearningPathsPage } from "@/components/brilliant/app/learning-paths";

export const metadata: Metadata = {
  title: "Courses | Brilliant",
};

/** brilliant.org/courses/ — the authenticated Learning Paths index. */
export default function BrilliantAppCourses() {
  return (
    <div className="min-h-screen bg-b-bg font-b-sans text-white">
      <AppHeader active="courses" />
      <main>
        <LearningPathsPage />
      </main>
    </div>
  );
}
