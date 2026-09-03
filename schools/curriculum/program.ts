/**
 * `server-only`. The authored year — every hidden test case, every
 * `referenceSolution`, every expected output — is behind this import, and it
 * must never be reachable from a client component. It was: two pure helpers in
 * `inventory.ts` were imported by the lesson player and the presentation
 * adapters, and the bundler followed them here and emitted 2.35 MB of answer
 * key on six learner pages.
 *
 * The pure half now lives in `curriculum/shape.ts`. This line makes the mistake
 * a build error rather than a chunk. `scripts/check-client-bundle.mjs` is the
 * belt to this file's braces: it reads the built output and fails if curriculum
 * secrets are in it at all, whatever route they took.
 */
import "server-only";

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
