import type { Metadata } from "next";
import { StatusPage } from "@/components/brilliant/status-page";

export const metadata: Metadata = { title: "Бет табылмады" };

/**
 * The 404.
 *
 * A route-group-free root `not-found`, so it covers every unmatched path and
 * every `notFound()` call in the app — including `/help/<bad-id>` and the
 * reverse-engineering baseline's production refusal.
 */
export default function NotFound() {
  return <StatusPage kind="not-found" />;
}
