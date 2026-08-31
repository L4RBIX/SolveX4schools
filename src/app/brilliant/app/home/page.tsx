import type { Metadata } from "next";
import { AppHeader } from "@/components/brilliant/app/app-header";
import { JUMP_BACK_IN } from "@/components/brilliant/app/app-data";
import { CourseDeck } from "@/components/brilliant/app/course-deck";
import { HomeRail } from "@/components/brilliant/app/home-rail";

export const metadata: Metadata = {
  title: "Home | Brilliant",
};

/**
 * brilliant.org/home/ — the authenticated home screen.
 *
 * Measured layout at 1470: a 992px content block centred under a 1216px
 * header, split into a sticky 384px rail and a 556px column with a 52px gap.
 * The rail is hidden below `lg`, where the deck goes full width.
 */
export default function BrilliantAppHome() {
  return (
    <div className="min-h-screen bg-b-bg font-b-sans text-white">
      <AppHeader active="home" />
      <main className="mx-auto flex w-full max-w-[992px] items-start gap-[52px] px-5 pt-10 lg:px-0">
        <HomeRail />
        <CourseDeck courses={JUMP_BACK_IN} />
      </main>
    </div>
  );
}
