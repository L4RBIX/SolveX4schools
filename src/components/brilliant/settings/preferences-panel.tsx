"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@schools/curriculum/types";
import type { SessionUser } from "@schools/auth/types";
import { L, t } from "@schools/presentation/labels";
import { usePreferences } from "@/components/sx/preferences";
import {
  SettingsChoice,
  SettingsSection,
  SettingsShell,
  SettingsToggle,
} from "./settings-shell";

/**
 * `/settings/preferences`.
 *
 * Every control here writes through `usePreferences`, which persists to
 * `localStorage` immediately and to the account in the background. Nothing on
 * this page is local React state that evaporates on navigation — the brief is
 * explicit about that, and it is also the difference between a settings page
 * and a mock of one.
 *
 * Narration is conditional: it renders only when the browser actually has a
 * voice for the learner's language. Offering a switch that produces silence is
 * worse than not offering it, and Kazakh voices are genuinely rare.
 */
export function PreferencesPanel({ user }: { user: SessionUser }) {
  const { preferences, setPreferences, locale } = usePreferences();
  const loc = locale as Locale;
  const hasVoice = useHasVoice(loc);

  return (
    <SettingsShell active="preferences" user={user}>
      <SettingsSection
        title={t(L.prefAppearance, loc)}
        description={t(L.prefAppearanceHint, loc)}
      >
        <SettingsChoice
          labelHidden
          label={t(L.prefTheme, loc)}
          value={preferences.theme}
          onChange={(theme) => setPreferences({ theme })}
          options={[
            { value: "auto", label: t(L.prefAuto, loc) },
            { value: "light", label: t(L.prefLight, loc) },
            { value: "dark", label: t(L.prefDark, loc) },
          ]}
        />
      </SettingsSection>

      <SettingsSection
        title={t(L.prefMotion, loc)}
        description={t(L.prefMotionHint, loc)}
      >
        <SettingsChoice
          labelHidden
          label={t(L.prefMotion, loc)}
          value={preferences.motion}
          onChange={(motion) => setPreferences({ motion })}
          options={[
            { value: "auto", label: t(L.prefAuto, loc) },
            { value: "reduce", label: t(L.prefMotionReduce, loc) },
            { value: "full", label: t(L.prefMotionFull, loc) },
          ]}
        />
      </SettingsSection>

      <SettingsSection title={t(L.prefLanguage, loc)}>
        <SettingsChoice
          labelHidden
          label={t(L.prefLanguage, loc)}
          value={preferences.locale}
          onChange={(next) => setPreferences({ locale: next })}
          options={[
            { value: "kk", label: "Қазақша" },
            { value: "ru", label: "Русский" },
          ]}
        />
      </SettingsSection>

      <SettingsSection title={t(L.prefSound, loc)}>
        {/*
          Rendered only when a voice exists for this language. `useHasVoice`
          waits for `voiceschanged`, because every browser populates the voice
          list asynchronously and reading it once at mount reports zero.
        */}
        {hasVoice ? (
          <SettingsToggle
            label={t(L.prefNarration, loc)}
            description={t(L.prefNarrationHint, loc)}
            checked={preferences.novaNarration}
            onChange={(novaNarration) => setPreferences({ novaNarration })}
          />
        ) : (
          <p className="text-[14px] leading-[1.5] text-b-fg/50">
            {t(L.prefNoVoice, loc)}
          </p>
        )}

        <SettingsToggle
          label={t(L.prefSfx, loc)}
          description={t(L.prefSfxHint, loc)}
          checked={preferences.soundEffects}
          onChange={(soundEffects) => setPreferences({ soundEffects })}
        />
      </SettingsSection>
    </SettingsShell>
  );
}

/**
 * Does this browser have a voice for the learner's language?
 *
 * Voices arrive asynchronously everywhere, which is why this listens for
 * `voiceschanged` rather than reading the list once. Returns false during SSR
 * and on a browser without speech synthesis, so the switch is absent rather
 * than briefly present and then gone.
 */
function useHasVoice(locale: Locale): boolean {
  const [has, setHas] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const check = () =>
      setHas(synth.getVoices().some((v) => v.lang.toLowerCase().startsWith(locale)));
    check();
    synth.addEventListener("voiceschanged", check);
    return () => synth.removeEventListener("voiceschanged", check);
  }, [locale]);

  return has;
}
