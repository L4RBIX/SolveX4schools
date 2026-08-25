"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Locale, Localized } from "@schools/curriculum/types";

/**
 * Language.
 *
 * The programme is taught in Kazakh; Russian is offered because a real class
 * of 18 will contain students who read one more comfortably than the other.
 * Technical syntax (`if`, `for`, `return`) stays English in both — renaming
 * keywords would teach a language that does not exist.
 *
 * Default is `kk`. That is a deliberate choice, not a placeholder: this is a
 * Kazakh school programme and Kazakh should not be the alternate.
 */

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (value: Localized) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initial = "kk",
}: {
  children: ReactNode;
  initial?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initial);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (v: Localized) => v[locale],
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}

/** UI strings that are not part of the curriculum content. */
export const UI = {
  check: { kk: "Тексеру", ru: "Проверить" },
  next: { kk: "Келесі", ru: "Далее" },
  back: { kk: "Артқа", ru: "Назад" },
  retry: { kk: "Қайта көру", ru: "Ещё раз" },
  correct: { kk: "Дұрыс", ru: "Верно" },
  wrong: { kk: "Әзірге дұрыс емес", ru: "Пока неверно" },
  partial: { kk: "Ішінара дұрыс", ru: "Частично верно" },
  run: { kk: "Жүгірту", ru: "Запустить" },
  submit: { kk: "Тапсыру", ru: "Отправить" },
  yourAnswer: { kk: "Сенің жауабың", ru: "Твой ответ" },
  writeAnswer: { kk: "Жауабыңды жаз", ru: "Напиши ответ" },
  lessonDone: { kk: "Сабақ аяқталды", ru: "Урок пройден" },
  ofTasks: { kk: "тапсырма", ru: "заданий" },
  minutes: { kk: "мин", ru: "мин" },
  objectives: { kk: "Осы сабақта", ru: "В этом уроке" },
  read: { kk: "Түсіндім", ru: "Понятно" },
  hint: { kk: "Көмек", ru: "Помощь" },
  notMeasured: { kk: "әлі өлшенбеген", ru: "ещё не измерено" },
  month: { kk: "ай", ru: "месяц" },
  lessons: { kk: "сабақ", ru: "уроков" },
  tasks: { kk: "тапсырма", ru: "заданий" },
  inProgress: { kk: "Дайындалуда", ru: "В работе" },
  available: { kk: "Ашық", ru: "Доступно" },
  locked: { kk: "Әлі ашылмаған", ru: "Ещё не открыт" },
  practice: { kk: "Дербес жаттығу", ru: "Самостоятельная практика" },
  assessment: { kk: "Ай соңындағы тексеріс", ru: "Проверка в конце месяца" },
  explainPrompt: { kk: "Өз сөзіңмен жаз", ru: "Напиши своими словами" },
  saved: { kk: "Сақталды", ru: "Сохранено" },
  tracks: { kk: "Деңгейлер", ru: "Уровни" },
} as const satisfies Record<string, Localized>;
