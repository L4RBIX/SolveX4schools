import { BookOpen, Dumbbell } from "lucide-react";

import type { CourseData } from "@/components/brilliant/courses-data";
import { TileArt } from "@/components/brilliant/path-tile";
import { cn } from "@/lib/utils";

/**
 * The course summary that pins to the left of the course map — 487x331,
 * #141414 on #141414, so only the 2px rgba(255,255,255,.2) border and its
 * matching hard 4px edge separate it from the page.
 */

export interface CourseCardProps {
  course: CourseData;
  className?: string;
}

export function CourseCard({ course, className }: CourseCardProps) {
  return (
    <article
      className={cn(
        "flex w-full flex-col rounded-[20px] border-2 border-b-fg/20 bg-b-dark p-6 shadow-[0_4px_0_0_rgba(255,255,255,0.2)] sm:p-8 lg:h-[331px] lg:w-[487px]",
        className,
      )}
    >
      <TileArt kind={course.art} className="size-16 shrink-0" />

      <h3 className="mt-5 text-[24px] leading-[30px] font-bold text-b-fg">
        {course.title}
      </h3>
      <p className="mt-2 text-[16px] leading-6 text-b-dim">
        {course.description}
      </p>

      <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 lg:mt-auto">
        <div className="flex items-center gap-2">
          <BookOpen aria-hidden="true" className="size-5 text-b-dim" strokeWidth={2} />
          <dt className="sr-only">Lessons</dt>
          <dd className="text-[14px] leading-5 text-b-fg">
            {course.lessonCount} Lessons
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <Dumbbell aria-hidden="true" className="size-5 text-b-dim" strokeWidth={2} />
          <dt className="sr-only">Exercises</dt>
          <dd className="text-[14px] leading-5 text-b-fg">
            {course.exerciseCount} Exercises
          </dd>
        </div>
      </dl>
    </article>
  );
}
