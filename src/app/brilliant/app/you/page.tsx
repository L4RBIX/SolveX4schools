import type { Metadata } from "next";
import { AppHeader } from "@/components/brilliant/app/app-header";
import { YouDashboard } from "@/components/brilliant/app/you-dashboard";

export const metadata: Metadata = {
  title: "Your progress | Brilliant",
};

/** brilliant.org/you/ — the learner dashboard. */
export default function BrilliantAppYou() {
  return (
    <div className="min-h-screen bg-b-bg font-b-sans text-white">
      <AppHeader active="you" />
      <main>
        <YouDashboard />
      </main>
    </div>
  );
}
