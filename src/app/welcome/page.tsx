import type { Metadata } from "next";
import { SchoolLanding } from "@/components/brilliant/school-landing";

export const metadata: Metadata = {
  // `absolute` so the layout template does not render "SolveX4Schools · SolveX4Schools".
  title: { absolute: "SolveX4Schools" },
  description:
    "9-сыныпқа арналған спорттық бағдарламалау үйірмесі — тоғыз айлық оқу бағдарламасы.",
};

export default function WelcomePage() {
  return <SchoolLanding />;
}
