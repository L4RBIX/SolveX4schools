"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import { useLocale } from "@/components/sx/i18n";


/*
  These three live on a LIGHT card now (see `auth-shell.tsx`), so they are
  written against the public-surface tokens rather than the lesson player's
  dark scheduler blues. `b-ink`/`b-line`/`b-white` all flip with the theme, so
  the same classes hold in dark mode.
*/
const FIELD =
  "h-12 rounded-[12px] border-2 border-b-line bg-b-white px-4 text-[16px] text-b-ink " +
  "transition-colors focus:border-b-ink focus:outline-none";

const SUBMIT =
  "b-press h-12 rounded-[12px] bg-b-ink text-[16px] font-medium text-b-white " +
  "transition-opacity disabled:opacity-50";

const ERROR_BOX =
  "rounded-[12px] border-2 border-b-warn-edge bg-b-warn-fill/25 px-4 py-3 " +
  "text-[15px] leading-6 text-b-ink";

/**
 * Change the password handed out on paper.
 *
 * The current password is required even though the caller is signed in: a
 * session left open on a classroom machine must not be enough to lock its owner
 * out of their own account.
 *
 * On success the server revokes every session including this one, so the form
 * sends the learner back to sign in rather than pretending they are still
 * authenticated. That is a real state change, not a UX flourish.
 */
export function ChangePasswordForm({
  forced,
  embedded = false,
}: {
  forced: boolean;
  /**
   * Rendered inside a settings section rather than as a standalone page.
   *
   * The standalone version owns a card, a title and its own vertical centring
   * — correct at `/account/password`, which a learner is redirected to on first
   * login and where the form IS the page. Inside `/settings/account` that
   * chrome would be a card inside a card under a duplicate heading.
   */
  embedded?: boolean;
}) {
  const { locale } = useLocale();
  const loc = locale as Locale;
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function message(code: string): string {
    if (code === "too_short") return t(L.passwordTooShort, loc);
    if (code === "contains_username") return t(L.passwordContainsUsername, loc);
    return t(L.signInFailed, loc);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(message(data.error ?? ""));
        setBusy(false);
        return;
      }
      /* Embedded in settings the learner is already where they want to be, so
         a successful change reports success in place. Standalone, this form IS
         the first-login gate, and sending them back to /login is what proves
         the new credential works. */
      if (embedded) {
        setCurrent("");
        setNext("");
        setDone(true);
        setBusy(false);
        router.refresh();
        return;
      }
      router.refresh();
      router.push("/login");
    } catch {
      setError(t(L.signInFailed, loc));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className={embedded ? "flex w-full flex-col gap-4" : "flex w-full max-w-[380px] flex-col gap-4"}
    >
      {embedded ? null : (
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] leading-[42px] font-bold text-b-ink">
            {t(L.changePasswordTitle, loc)}
          </h1>
          {forced ? (
            <p className="text-[16px] leading-6 text-b-muted">{t(L.changePasswordWhy, loc)}</p>
          ) : null}
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] leading-5 text-b-muted">{t(L.currentPassword, loc)}</span>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          required
          className={FIELD}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] leading-5 text-b-muted">{t(L.newPassword, loc)}</span>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          autoComplete="new-password"
          required
          className={FIELD}
        />
      </label>

      {done ? (
        <p
          role="status"
          className="rounded-[12px] border-2 border-b-ok-edge bg-b-ok-panel px-4 py-3 text-[15px] leading-6 text-b-ink"
        >
          {t(L.passwordChanged, loc)}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className={ERROR_BOX}>
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className={SUBMIT}
      >
        {t(L.save, loc)}
      </button>
    </form>
  );
}
