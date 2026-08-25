import type { Metadata } from "next";

import { CourseMap } from "@/components/brilliant/course-map";
import { CourseNav } from "@/components/brilliant/course-nav";
import { LEARNING_PATHS } from "@/components/brilliant/courses-data";
import { LearningPath } from "@/components/brilliant/learning-path";

export const metadata: Metadata = {
  title: "Courses | Brilliant",
  description:
    "Step-by-step paths to mastery — interactive math, science and computer science courses.",
};

export default function BrilliantCourses() {
  return (
    <>
      <CourseNav />
      <main className="min-h-screen bg-b-dark pt-16 text-white">
        <div className="b-shell-narrow pt-10 pb-2 sm:pt-14">
          <h1 className="text-[30px] leading-9 font-bold text-white">
            Learning Paths
          </h1>
          <p className="mt-2 text-[16px] leading-6 text-b-dim">
            Step-by-step paths to mastery
          </p>
        </div>

        <div className="flex flex-col gap-14 pt-10 sm:gap-16">
          {LEARNING_PATHS.map((path) => (
            <LearningPath key={path.id} path={path} />
          ))}
        </div>

        <CourseMap className="pt-20 pb-24 sm:pt-24" />
      </main>
    </>
  );
}
