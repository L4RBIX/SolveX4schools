"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Brilliant's `useMediaQuery(query, { initializeWithValue: false })`.
 *
 * The `false` matters: the server snapshot and the hydrating render both report
 * "no match", so the mobile artwork is what paints first and the desktop
 * artwork swaps in immediately after. Reproducing that keeps hydration clean
 * and matches the original's first frame.
 */
export function useMinWidth(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
