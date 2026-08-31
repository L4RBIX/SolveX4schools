import type { Metadata } from "next";
import { PublicLanding } from "@/components/brilliant/public-landing";

export const metadata: Metadata = {
  // `absolute` so the layout template does not append the brand twice.
  title: { absolute: "SolveX4Schools" },
  description:
    "Девятимесячная программа спортивного программирования для 9 класса. " +
    "Короткое объяснение — и сразу практика.",
};

export default function PublicHome() {
  return <PublicLanding />;
}
