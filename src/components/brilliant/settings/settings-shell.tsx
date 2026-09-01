"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@schools/curriculum/types";
import type { SessionUser } from "@schools/auth/types";
import { L, t } from "@schools/presentation/labels";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/components/sx/preferences";
import { AppHeader } from "../app/app-header";
import { accountMenu } from "../app/account-menu";
import { LocaleSwitch, SCHOOL_NAV, SolveXWordmark } from "../app/school-chrome";

/**
 * The settings chrome.
 *
 * Structure follows the reference's own settings pages: a left navigation
 * column that becomes a horizontal row of chips on a phone, a single content
 * column beside it capped at a comfortable measure, and sections separated by
 * a rule rather than by cards. That last one matters — settings rendered as a
 * grid of cards is the "generic dashboard" look the brief names, and the
 * reference deliberately does not do it.
 *
 * The product header sits on top, so a learner in settings is still visibly
 * inside the product and one click from `/home`.
 */

export interface SettingsShellProps {
  active: "account" | "preferences";
  user: SessionUser;
  /**
   * Whether this learner's school has the weekly league.
   *
   * Resolved on the server by `leagueNavVisible` and threaded through the
   * panel, because the gate reads `schools/config.ts` and this is a client
   * component. Settings is chrome around the product, so the nav here must be
   * the SAME nav — a tab that exists on /home and vanishes in settings reads as
   * the product having lost a page.
   */
  leagues?: boolean;
  children: ReactNode;
}

export function SettingsShell({ active, user, leagues = false, children }: SettingsShellProps) {
  const { locale, setLocale } = usePreferences();
  const loc = locale as Locale;

  const tabs = [
    { id: "account" as const, href: "/settings/account", label: t(L.settingsAccount, loc) },
    {
      id: "preferences" as const,
      href: "/settings/preferences",
      label: t(L.settingsPreferences, loc),
    },
  ];

  return (
    <div className="min-h-dvh bg-sx-page font-b-sans text-b-fg">
      <AppHeader
        /* Settings is not one of the three product tabs, so nothing is
           highlighted. Passing a tab that is not on screen would light up a
           link the learner did not follow. */
        active={user.role === "student" ? "home" : "home"}
        links={user.role === "student" ? SCHOOL_NAV(loc, leagues) : []}
        homeHref={user.role === "student" ? "/home" : "/teacher"}
        wordmark={<SolveXWordmark />}
        wordmarkLabel={t(L.brand, loc)}
        accentPill={null}
        xp={null}
        a11y={{ menu: t(L.menu, loc), streak: t(L.thisWeek, loc) }}
        accountMenu={accountMenu(loc)}
        trailing={<LocaleSwitch locale={loc} onChange={setLocale} />}
      />

      <main className="mx-auto w-full max-w-[1216px] px-4 py-8 sm:px-8 sm:py-10">
        <h1 className="text-[32px] leading-[42px] font-bold">{t(L.settings, loc)}</h1>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-14">
          {/* Left rail on desktop, chip row on a phone. Same links either way —
              a settings page whose navigation disappears on mobile is a
              settings page with one reachable tab. */}
          <nav
            aria-label={t(L.settings, loc)}
            className="shrink-0 lg:sticky lg:top-24 lg:h-fit lg:w-[220px]"
          >
            <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
              {tabs.map((tab) => (
                <li key={tab.id} className="shrink-0">
                  <Link
                    href={tab.href}
                    aria-current={active === tab.id ? "page" : undefined}
                    className={cn(
                      "block rounded-full px-4 py-2.5 text-[15px] font-medium transition-colors lg:rounded-lg",
                      active === tab.id
                        ? "bg-b-fg/10 text-b-fg"
                        : "text-b-fg/60 hover:bg-b-fg/5 hover:text-b-fg",
                    )}
                  >
                    {tab.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 max-w-[640px] flex-1">{children}</div>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* section primitives                                                          */

/** One settings section: a title, optional description, and rows. */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-b-fg/10 py-8 first:border-t-0 first:pt-0">
      <h2 className="text-[18px] leading-6 font-bold">{title}</h2>
      {description ? (
        <p className="mt-1.5 text-[14px] leading-5 text-b-fg/55">{description}</p>
      ) : null}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

/**
 * A read-only fact about the account.
 *
 * Rendered as a definition row rather than a disabled input. A greyed-out text
 * field says "you could edit this if something were different"; a school does
 * not let a 14-year-old change which class they are in, and pretending
 * otherwise wastes a tap.
 */
export function SettingsFact({
  label,
  value,
  pill,
}: {
  label: string;
  value: string;
  pill?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <span className="text-[15px] text-b-fg/55">{label}</span>
      <span className="flex items-center gap-2 text-[15px] font-medium">
        {value}
        {pill ? (
          <span className="rounded-full bg-b-fg/10 px-2.5 py-0.5 text-[12px] font-semibold tracking-wide uppercase text-b-fg/70">
            {pill}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * A segmented choice.
 *
 * `radiogroup` rather than a `<select>` — three options that each need one word
 * are faster to read and to hit than a dropdown, and this is the control a
 * learner uses on a phone. Arrow keys move between options because that is what
 * a radio group does, and the browser gives that for free once the roles are
 * right.
 */
export function SettingsChoice<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
  labelHidden = false,
}: {
  label: string;
  description?: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (next: T) => void;
  /**
   * Hide the visible label without removing it.
   *
   * Where a section holds exactly one control, its heading already names the
   * control — printing "Язык" twice, once as a heading and once above the
   * buttons, reads as a layout bug. The label still reaches the radiogroup's
   * `aria-label`, so a screen reader hears it either way.
   */
  labelHidden?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className={labelHidden && !description ? "sr-only" : undefined}>
        <span className={labelHidden ? "sr-only" : "text-[15px] font-medium"}>{label}</span>
        {description ? (
          <p className="mt-1 text-[13px] leading-[1.5] text-b-fg/50">{description}</p>
        ) : null}
      </div>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex w-fit gap-1 rounded-full border border-b-fg/12 p-1"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 text-[14px] leading-5 transition-colors",
              value === option.value
                ? "bg-b-fg text-b-bg font-medium"
                : "text-b-fg/60 hover:text-b-fg",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** An on/off switch with its own label and hint. */
export function SettingsToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <span className="text-[15px] font-medium">{label}</span>
        {description ? (
          <p className="mt-1 text-[13px] leading-[1.5] text-b-fg/50">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors",
          checked ? "bg-b-ok-fill" : "bg-b-fg/20",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-1 size-5 rounded-full bg-b-bg transition-[left] duration-150 ease-out",
            checked ? "left-6" : "left-1",
          )}
        />
      </button>
    </div>
  );
}
