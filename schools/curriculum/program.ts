import type { Program } from "./types";
import { MONTHS } from "./months";
import { PROGRAMME_FACTS, PROGRAMME_SOURCE } from "./source-of-truth";

/**
 * The assembled programme. This is the single object the product reads —
 * routes, the teacher console and the validator all go through here rather
 * than importing month files directly.
 */
export const PROGRAM: Program = {
  id: "cp-grade9-y1",
  title: {
    kk: PROGRAMME_SOURCE.titleKk,
    ru: "Кружок спортивного программирования для 9 класса",
  },
  subtitle: {
    kk: PROGRAMME_SOURCE.subtitleKk,
    ru: "Девятимесячная программа и персональная онлайн-платформа для ученика и учителя",
  },
  grade: PROGRAMME_FACTS.grade,
  ageRange: PROGRAMME_FACTS.ageRange,
  weeks: PROGRAMME_FACTS.weeks.value,
  sessionsPerWeek: PROGRAMME_FACTS.sessionsPerWeek,
  sessionMinutes: PROGRAMME_FACTS.sessionMinutes,
  totalSessions: PROGRAMME_FACTS.totalSessions,
  months: MONTHS,
};

export * from "./types";
export { SKILLS, SKILL_BY_ID, isKnownSkill } from "./skills";
export { MONTHS, MONTH_BY_INDEX } from "./months";
