"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale, Localized } from "@schools/curriculum/types";
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
 * Which sentence a failed sign-in gets, decided from the STATUS.
 *
 * Status first and body second, and that order is the whole point. The body is
 * the thing that goes missing when a server is in trouble — an empty 500, a
 * proxy's own HTML, a connection cut mid-response — so a branch that reads the
 * body first degrades to whatever its fallback is at exactly the moment it
 * matters, and the fallback here used to be «wrong password».
 *
 * 401 is the ONLY status this product may blame a password for. It is the only
 * one that means a password was compared: `/api/auth/login` answers 429 for the
 * rate limiter, 400 for an empty field, 503 when the store is unreachable, and
 * 401 for a credential that was actually checked and did not match.
 *
 * 400 keeps the credentials sentence on purpose — from this form it can only
 * mean an empty username or password, which is a true thing to call a wrong
 * login. Anything else unexpected in the 4xx range is a client bug rather than
 * an outage, and telling a learner to wait for it would be its own small lie;
 * that is the trade taken by the final fallthrough.
 */
function signInError(status: number): Localized {
  if (status >= 500) return L.signInUnavailable;
  if (status === 429) return L.signInRateLimited;
  return L.signInFailed;
}

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
      /* `res.json()` on an empty body THROWS, and that is not a hypothetical:
         a store outage used to return a bare 500 with nothing in it, this line
         threw, and the catch at the bottom rendered «Аты немесе құпиясөз дұрыс
         емес» for a password the server had never looked at.

         The route now answers with a body in every case. Parsing defensively
         anyway, because the sentence a child reads must not depend on a server
         keeping that promise — and there are hops between here and it (a proxy,
         a load balancer, a captive portal) that can replace the body without
         asking anyone. */
      /* `redirectTo` and nothing else. The body used to carry `error` here too,
         and the failure branch read it; declaring only what is actually read
         keeps that from creeping back — the body is data now, not the thing the
         error message is decided from. */
      const data = (await res.json().catch(() => ({}))) as { redirectTo?: string };

      if (!res.ok) {
        setError(t(signInError(res.status), loc));
        setBusy(false);
        return;
      }
      /* `refresh` before `push`: the layout reads the session server-side, and
         without it the destination renders against the signed-out cache. */
      router.refresh();
      router.push(data.redirectTo ?? "/home");
    } catch {
      /* The request never completed at all — school Wi-Fi dropping in a
         corridor, the server restarting mid-lesson, DNS gone. Nothing was
         compared, so this must not be the credentials sentence either. It is
         the same fact as a 503 from the learner's side ("nothing was checked,
         it is not you"), so it gets the same sentence rather than a fourth one
         nobody needs to distinguish. */
      setError(t(L.signInUnavailable, loc));
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
