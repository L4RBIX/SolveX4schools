"use client";

import { cn } from "@/lib/utils";
import type { Locale } from "@schools/curriculum/types";

/**
 * Language, on the light (public) surface.
 *
 * Shared by `/` and `/schools`. The dark app surfaces have their own switch in
 * `app/school-chrome.tsx`; the two differ only in palette, and keeping them
 * apart is cheaper than a `tone` prop nobody would read.
 *
 * The choice is persisted by `LocaleProvider`, so switching here and then
 * opening a lesson keeps the language. That is not a nicety: a learner who hits
 * a wall in Kazakh needs to reach Russian from wherever they are.
 */
export function LocaleToggle({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (l: Locale) => void;
}) {
  return (
    <div className="mr-1 hidden overflow-hidden rounded-full border border-b-line sm:flex">
      {(["kk", "ru"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-pressed={locale === code}
          aria-label={code === "kk" ? "Қазақша" : "Русский"}
          className={cn(
            "h-8 w-10 cursor-pointer text-[13px] font-bold uppercase transition-colors",
            locale === code ? "bg-b-ink text-b-white" : "text-b-muted hover:text-b-ink",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
