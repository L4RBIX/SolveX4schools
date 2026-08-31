"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@schools/curriculum/types";
import type { SessionUser } from "@schools/auth/types";
import { L, t } from "@schools/presentation/labels";
import { usePreferences } from "@/components/sx/preferences";
import { ChangePasswordForm } from "../auth/change-password-form";
import { SettingsFact, SettingsSection, SettingsShell } from "./settings-shell";

/**
 * `/settings/account`.
 *
 * ## What is here, and what is deliberately not
 *
 * The reference's account page has editable name fields, an email row, a
 * subscription block and a delete-account button. Three of those four do not
 * apply:
 *
 * - **Name is read-only.** It comes from the school's roster. A learner who
 *   renames themselves breaks the one list a teacher relies on.
 * - **There is no email row.** `school_accounts` has no email column, because
 *   the pilot has no reliable student email and no mail sender. An empty
 *   "Email: —" row would be describing a field that does not exist.
 * - **There is no delete-account button.** Deletion happens through the school,
 *   and there is no automated deletion job. A button that files a request
 *   nobody receives is worse than its absence — see
 *   `docs/legal/PRIVACY_LEGAL_REVIEW.md` §3.
 *
 * What IS here is real: the password form posts to `/api/auth/password`, and
 * both sign-out buttons call routes that revoke server-side session rows.
 */
export function AccountPanel({
  user,
  school,
  classes,
}: {
  user: SessionUser;
  school: string;
  classes: string[];
}) {
  const { locale } = usePreferences();
  const loc = locale as Locale;

  return (
    <SettingsShell active="account" user={user}>
      <SettingsSection
        title={t(L.accountPersonal, loc)}
        description={t(L.accountPersonalHint, loc)}
      >
        <SettingsFact label={t(L.accountName, loc)} value={user.displayName} />
        <SettingsFact label={t(L.username, loc)} value={user.username} />
      </SettingsSection>

      <SettingsSection title={t(L.accountSchool, loc)}>
        <SettingsFact
          label={t(L.accountRole, loc)}
          value={roleLabel(user.role, loc)}
          pill={user.role === "student" ? undefined : roleLabel(user.role, loc)}
        />
        <SettingsFact label={t(L.accountSchoolName, loc)} value={school} />
        <SettingsFact
          label={t(L.accountClass, loc)}
          value={classes.length > 0 ? classes.join(", ") : t(L.accountNoClass, loc)}
        />
      </SettingsSection>

      <SettingsSection
        title={t(L.accountSecurity, loc)}
        description={t(L.accountSecurityHint, loc)}
      >
        <div className="sx-card rounded-2xl border-2 border-b-fg/12 p-5">
          <ChangePasswordForm forced={false} embedded />
        </div>
      </SettingsSection>

      <SettingsSection
        title={t(L.accountSession, loc)}
        description={t(L.accountSessionHint, loc)}
      >
        <SignOutButtons locale={loc} />
      </SettingsSection>
    </SettingsShell>
  );
}

function roleLabel(role: SessionUser["role"], loc: Locale): string {
  if (role === "teacher") return t(L.roleTeacher, loc);
  if (role === "admin") return t(L.roleAdmin, loc);
  return t(L.roleStudent, loc);
}

/**
 * Sign out here, or everywhere.
 *
 * "Everywhere" is offered because `revokeAllSessions` genuinely exists in the
 * store — it is not a decorative second button. It is the right control for the
 * case a school actually hits: a learner thinks a classmate saw their password.
 */
function SignOutButtons({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"one" | "all" | null>(null);

  const signOut = async (scope: "one" | "all") => {
    setBusy(scope);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ allDevices: scope === "all" }),
      });
      /* `replace`, not `push`: Back must not return to a signed-in page whose
         markup is still in the bfcache. `refresh()` clears the server render. */
      router.replace("/login");
      router.refresh();
    } catch {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => signOut("one")}
        className="h-11 cursor-pointer rounded-full border-2 border-b-fg/20 px-6 text-[15px] font-medium transition-colors hover:border-b-fg/40 disabled:opacity-50"
      >
        {busy === "one" ? `${t(L.signOut, locale)}…` : t(L.signOut, locale)}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => signOut("all")}
        className="h-11 cursor-pointer rounded-full px-6 text-[15px] font-medium text-b-fg/60 transition-colors hover:text-b-fg disabled:opacity-50"
      >
        {busy === "all" ? `${t(L.signOutAll, locale)}…` : t(L.signOutAll, locale)}
      </button>
    </div>
  );
}
