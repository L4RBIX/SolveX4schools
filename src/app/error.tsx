"use client";

import { useEffect } from "react";
import { StatusPage } from "@/components/brilliant/status-page";

/**
 * The error boundary.
 *
 * Next renders this in place of a route that threw. It must be a client
 * component and it must accept `reset`, which re-runs the failed render — that
 * is the retry the page offers.
 *
 * The error is logged, not shown. A digest on screen is something a
 * fourteen-year-old cannot act on; the same digest is already in the server log
 * where somebody can.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route] unhandled error", error.digest ?? error.message);
  }, [error]);

  return <StatusPage kind="error" onRetry={reset} />;
}
