"use client";

/**
 * "Do not sell my personal information".
 *
 * On the live site this calls `window.OneTrust.ToggleInfoDisplay()`. OneTrust
 * is a third-party consent widget and is not part of this repo, so the button
 * is reproduced exactly and its handler does nothing.
 */
export function ConsentButton({ className }: { className: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        /* OneTrust is not loaded here — no consent panel to toggle. */
      }}
    >
      Do not sell my personal information
    </button>
  );
}
