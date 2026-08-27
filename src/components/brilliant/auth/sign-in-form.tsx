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
 * Sign in.
 *
 * Deliberately plain. This is the first screen a fourteen-year-old meets with a
 * password read off a card, on a school machine, possibly in a hurry — so it is
 * two fields and a button, with the error stated in their own language and
 * nothing else on the page to get wrong.
 *
 * The redirect target comes from the SERVER's response, never from a query
 * parameter: a `?next=` a browser controls is a way to bounce someone into a
 * route their role does not have.
 */
export function SignInForm() {
  const { locale } = useLocale();
  const loc = locale as Locale;
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as { redirectTo?: string; error?: string };
      if (!res.ok) {
        setError(data.error === "rate_limited" ? t(L.signInRateLimited, loc) : t(L.signInFailed, loc));
        setBusy(false);
        return;
      }
      /* `refresh` before `push`: the layout reads the session server-side, and
         without it the destination renders against the signed-out cache. */
      router.refresh();
      router.push(data.redirectTo ?? "/home");
    } catch {
      setError(t(L.signInFailed, loc));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-[32px] leading-[42px] font-bold text-b-ink">{t(L.signInTitle, loc)}</h1>
        <p className="text-[16px] leading-6 text-b-muted">{t(L.signInSub, loc)}</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] leading-5 text-b-muted">{t(L.username, loc)}</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
          className={FIELD}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] leading-5 text-b-muted">{t(L.password, loc)}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className={FIELD}
        />
      </label>

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
        {t(L.signIn, loc)}
      </button>
    </form>
  );
}
