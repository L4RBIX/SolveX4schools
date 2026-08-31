import type {
  Lesson,
  LessonBlock,
  Localized,
  MonthlyAssessment,
  PublicationStatus,
  SkillId,
  Unit,
} from "../types";

/**
 * Small constructors shared by the month files.
 *
 * They exist to keep provenance mandatory: every lesson and unit built here
 * carries a `sourceType` and, for curriculum-derived content, the PDF page.
 * There is no overload that lets an author skip either.
 */

export function t(kk: string, ru: string): Localized {
  return { kk, ru };
}

export interface LessonSpec {
  id: string;
  kk: string;
  ru: string;
  minutes: number;
  objectives: [string, string][];
  skills: SkillId[];
  blocks?: LessonBlock[];
  /** Defaults to `implemented` when blocks are supplied, `draft` when not. */
  status?: PublicationStatus;
}

export function buildLesson(spec: LessonSpec, pdfPage: number): Lesson {
  const blocks = spec.blocks ?? [];
  return {
    id: spec.id,
    title: t(spec.kk, spec.ru),
    estimatedMinutes: spec.minutes,
    objectives: spec.objectives.map(([kk, ru]) => t(kk, ru)),
    skillRefs: spec.skills,
    blocks,
    sourceType: "curriculum-derived",
    pdfPage,
    status: spec.status ?? (blocks.length > 0 ? "implemented" : "draft"),
  };
}

export function buildUnit(
  id: string,
  kk: string,
  ru: string,
  lessons: LessonSpec[],
  pdfPage: number,
): Unit {
  return {
    id,
    title: t(kk, ru),
    sourceType: "curriculum-derived",
    lessons: lessons.map((l) => buildLesson(l, pdfPage)),
  };
}

/**
 * The monthly check. The programme (p.6) names five independent verification
 * methods and requires that a month never be signed off on "the program runs"
 * alone, so every monthly assessment carries at least an unseen problem and an
 * oral explanation.
 */
export function buildAssessment(args: {
  monthIndex: number;
  kk: string;
  ru: string;
  minutes: number;
  descriptionKk: string;
  descriptionRu: string;
  pdfPage: number;
  blocks: LessonBlock[];
  status?: PublicationStatus;
}): MonthlyAssessment {
  return {
    id: `m${args.monthIndex}.assessment`,
    title: t(args.kk, args.ru),
    minutes: args.minutes,
    description: t(args.descriptionKk, args.descriptionRu),
    blocks: args.blocks,
    sourceType: "curriculum-derived",
    pdfPage: args.pdfPage,
    status: args.status ?? (args.blocks.length > 0 ? "implemented" : "draft"),
  };
}
