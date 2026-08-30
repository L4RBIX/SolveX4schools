import type { Locale } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";

/**
 * The account menu, defined once.
 *
 * Seven surfaces render `AppHeader`. Each of them building its own menu is how
 * a product ends up with "Log out" on four screens and not the other three, and
 * with "Help" pointing at `/help` on one and at nothing on another. One
 * function, so the menu is the same everywhere it appears.
 *
 * Nothing here is a placeholder: every href resolves to a page that exists, and
 * a test asserts that.
 */
export function accountMenu(locale: Locale) {
  return {
    items: [
      { label: t(L.settingsAccount, locale), href: "/settings/account" },
      { label: t(L.settingsPreferences, locale), href: "/settings/preferences" },
      { label: t(L.navHelp, locale), href: "/help" },
      { label: t(L.navAbout, locale), href: "/about" },
      { label: t(L.navPrivacy, locale), href: "/privacy" },
    ],
    signOut: { label: t(L.signOut, locale) },
  } as const;
}
