import type { Metadata } from "next";
import { LessonPlayer } from "@/components/brilliant/lesson/lesson-player";

export const metadata: Metadata = {
  title: "The Scheduling Problem | Brilliant",
  description:
    "Let's dive into a classic algorithmic problem — building a schedule without conflicts.",
};

export default function BrilliantLesson() {
  return <LessonPlayer />;
}
