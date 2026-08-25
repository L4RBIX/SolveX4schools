/**
 * Curriculum types for SolveX4Schools.
 *
 * The authoritative source is the approved programme document
 * `9-сынып_спорттық_бағдарламалау_үйірмесі.pdf` (12 pages, Тамыз 2026). Where
 * this file and the PDF disagree, the PDF wins — see `source-of-truth.ts`,
 * which carries the verbatim figures with page references.
 *
 * Two rules shape these types:
 *
 * 1. **Provenance is not optional.** Every content object declares
 *    `sourceType`, so nobody can later mistake a generated drill for something
 *    the approved programme actually specified.
 * 2. **Counts are claims, not decoration.** A month declares how many tasks the
 *    PDF promises; the validator compares that against how many are actually
 *    implemented, validated and published, and the three numbers are allowed to
 *    differ. Students only ever see `published`.
 */

/** Where a piece of content came from. Never inferred — always declared. */
export type SourceType =
  /** Specified in the approved programme document. Cite the page. */
  | "curriculum-derived"
  /** Written by the product team to serve a curriculum requirement. */
  | "product-authored"
  /** Machine-produced (drill variants, generated cases). */
  | "generated";

/** Publication gate. Students see `published` and nothing else. */
export type PublicationStatus =
  | "draft"
  | "implemented"
  | "validated"
  | "published";

/**
 * The three differentiation levels, in the programme's own words (PDF §3).
 * These describe a *route through the same month*, not a label attached to a
 * student — a learner can be `advanced` in loops and `support` in binary search.
 */
export type TrackLevel = "support" | "core" | "advanced";

export const TRACK_LABEL: Record<TrackLevel, { kk: string; ru: string }> = {
  support: { kk: "Қолдау", ru: "Поддержка" },
  core: { kk: "Негізгі", ru: "Базовый" },
  advanced: { kk: "Тереңдетілген", ru: "Углублённый" },
};

/** Supported interface languages. Technical syntax stays English. */
export type Locale = "kk" | "ru";

export type Localized = Record<Locale, string>;

/**
 * A skill id is an opaque string to the Learning Intelligence core — it is
 * carried through events and folded into `learner_skill_state` without ever
 * being interpreted. The dotted convention here is for humans.
 */
export type SkillId = string;

export interface Skill {
  id: SkillId;
  title: Localized;
  /** The month this skill is first taught. Later months may reuse it. */
  introducedInMonth: number;
  sourceType: SourceType;
  /** Page of the programme PDF that establishes this skill. */
  pdfPage?: number;
}

/* -------------------------------------------------------------------------- */
/* Lesson blocks                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The block taxonomy. A lesson is a list of these, not a bespoke React page.
 *
 * The ordering below is roughly the pedagogical loop the brief requires:
 * short explanation → predict → interact → try → code → fail → feedback →
 * retry → apply → verify.
 */
export type BlockType =
  | "concept"
  | "prediction"
  | "multiple_choice"
  | "trace_code"
  | "reorder_code"
  | "fill_blank"
  | "find_bug"
  | "modify_code"
  | "write_code"
  | "test_case"
  | "explain"
  | "reflection"
  | "arena_problem"
  | "visual_simulation"
  | "challenge"
  | "verify";

/**
 * Blocks that constitute a genuine learning attempt.
 *
 * This list exists because of a specific, documented failure mode: the exported
 * Nova runtime gates hint escalation on `ATTEMPT_EVENTS`, which only knows
 * about code-editor events. A learner answering a prediction would never
 * satisfy it, so every hint request would be capped forever with no error
 * shown. See `docs/integration/LI_VERIFIED_COUPLING.md` §1 and the school
 * adapter's `isAttemptEvent`.
 *
 * Reading a concept or watching a simulation is deliberately **not** an
 * attempt. Opening a lesson is not an attempt.
 */
export const ATTEMPT_BLOCK_TYPES: ReadonlySet<BlockType> = new Set<BlockType>([
  "prediction",
  "multiple_choice",
  "trace_code",
  "reorder_code",
  "fill_blank",
  "find_bug",
  "modify_code",
  "write_code",
  "test_case",
  "explain",
  "arena_problem",
  "challenge",
  "verify",
]);

/**
 * Maps a specific wrong answer to a named failure class.
 *
 * **Only declare an entry when the wrong answer uniquely establishes the
 * cause.** This is the single most important rule in the content model. A
 * distractor that several different misunderstandings could produce must be
 * left out, so the pipeline emits `unattributed_failure` and the Decision
 * Engine answers `DIAGNOSE` — "we do not know why, so ask" — instead of the
 * assistant telling a 14-year-old something false about their own mind.
 */
export interface DiagnosticMapping {
  [learnerAnswer: string]: {
    failureClass: string;
    /** Why this answer proves this cause. Required: it forces the author to justify. */
    justification: string;
  };
}

export interface BlockBase {
  id: string;
  type: BlockType;
  /** Skills this block produces evidence about. */
  skillRefs: SkillId[];
  sourceType: SourceType;
  pdfPage?: number;
  /**
   * Present only where a wrong answer is diagnostically unambiguous. Absent is
   * the correct and common case.
   */
  diagnosticMapping?: DiagnosticMapping;
  /** Which routes show this block. Absent means all three. */
  tracks?: TrackLevel[];
}

export interface ConceptBlock extends BlockBase {
  type: "concept";
  title: Localized;
  body: Localized;
  code?: string;
}

export interface PredictionBlock extends BlockBase {
  type: "prediction";
  prompt: Localized;
  code: string;
  /** Exact expected output. Compared after trimming trailing whitespace. */
  answer: string;
  /** Offered as choices. Free entry when absent. */
  options?: string[];
}

export interface MultipleChoiceBlock extends BlockBase {
  type: "multiple_choice";
  prompt: Localized;
  code?: string;
  options: { id: string; label: Localized }[];
  correctOptionId: string;
}

export interface TraceCodeBlock extends BlockBase {
  type: "trace_code";
  prompt: Localized;
  code: string;
  /** Variable state after each executed line. The learner fills these in. */
  steps: { line: number; vars: Record<string, string> }[];
}

export interface FillBlankBlock extends BlockBase {
  type: "fill_blank";
  prompt: Localized;
  /** Code with `___` placeholders, in order. */
  template: string;
  blanks: { id: string; answer: string; alternatives?: string[] }[];
}

export interface ReorderCodeBlock extends BlockBase {
  type: "reorder_code";
  prompt: Localized;
  /** Presented shuffled; `correctOrder` holds ids in the right sequence. */
  lines: { id: string; code: string }[];
  correctOrder: string[];
}

export interface FindBugBlock extends BlockBase {
  type: "find_bug";
  prompt: Localized;
  code: string;
  /** 1-indexed line carrying the defect. */
  buggyLine: number;
  fixedCode: string;
}

export interface WriteCodeBlock extends BlockBase {
  type: "write_code";
  prompt: Localized;
  starter?: string;
  /** Reference solution. Never shown to a learner. */
  referenceSolution: string;
  cases: { input: string; expectedOutput: string; hidden?: boolean }[];
}

export interface ModifyCodeBlock extends BlockBase {
  type: "modify_code";
  prompt: Localized;
  code: string;
  referenceSolution: string;
  cases: { input: string; expectedOutput: string; hidden?: boolean }[];
}

export interface ExplainBlock extends BlockBase {
  type: "explain";
  prompt: Localized;
  /** Points a human marker looks for. Never auto-graded as understanding. */
  expectedPoints: Localized[];
}

export interface VisualSimulationBlock extends BlockBase {
  type: "visual_simulation";
  /** Which visualiser to mount. The programme mandates several — see §4. */
  simulation:
    | "step_execution"
    | "loop_trace"
    | "binary_search"
    | "two_pointers"
    | "recursion_tree"
    | "bfs_wave"
    | "dfs_walk"
    | "sorting"
    | "dp_table";
  prompt: Localized;
  config?: Record<string, unknown>;
}

export interface VerifyBlock extends BlockBase {
  type: "verify";
  /** The programme's five independent checks (PDF p.6). */
  mode:
    | "unseen_problem"
    | "manual_trace"
    | "find_bug"
    | "oral_explanation"
    | "delayed_resolve";
  prompt: Localized;
  referenceSolution?: string;
  /**
   * Assessment cases are mostly hidden by design: a check the learner can pass
   * by echoing a visible sample answer measures nothing. The validator warns
   * when none is hidden.
   */
  cases?: { input: string; expectedOutput: string; hidden?: boolean }[];
}

export interface ArenaProblemBlock extends BlockBase {
  type: "arena_problem";
  problemId: string;
  prompt: Localized;
}

export interface TestCaseBlock extends BlockBase {
  type: "test_case";
  prompt: Localized;
  code: string;
  /** The learner proposes inputs that break it. */
  breakingInputs: string[];
}

export interface ReflectionBlock extends BlockBase {
  type: "reflection";
  prompt: Localized;
}

export interface ChallengeBlock extends BlockBase {
  type: "challenge";
  prompt: Localized;
  referenceSolution: string;
  cases: { input: string; expectedOutput: string; hidden?: boolean }[];
}

export type LessonBlock =
  | ConceptBlock
  | PredictionBlock
  | MultipleChoiceBlock
  | TraceCodeBlock
  | FillBlankBlock
  | ReorderCodeBlock
  | FindBugBlock
  | WriteCodeBlock
  | ModifyCodeBlock
  | ExplainBlock
  | VisualSimulationBlock
  | VerifyBlock
  | ArenaProblemBlock
  | TestCaseBlock
  | ReflectionBlock
  | ChallengeBlock;

/* -------------------------------------------------------------------------- */
/* Lessons, units, months, programme                                          */
/* -------------------------------------------------------------------------- */

export interface Lesson {
  id: string;
  title: Localized;
  /** PDF p.3: explanation is 5–8 minutes, one idea per lesson. */
  estimatedMinutes: number;
  objectives: Localized[];
  skillRefs: SkillId[];
  blocks: LessonBlock[];
  sourceType: SourceType;
  pdfPage?: number;
  status: PublicationStatus;
  illustrationId?: string;
}

export interface Unit {
  id: string;
  title: Localized;
  lessons: Lesson[];
  sourceType: SourceType;
}

export interface MonthlyAssessment {
  id: string;
  title: Localized;
  /** The programme states 20 minutes for the September assessment (p.7). */
  minutes: number;
  /** Verbatim description of the check, from the PDF. */
  description: Localized;
  blocks: LessonBlock[];
  sourceType: SourceType;
  pdfPage: number;
  status: PublicationStatus;
}

export interface Month {
  /** 1 = September … 9 = May. */
  index: number;
  monthName: Localized;
  title: Localized;
  /** "Оқушы нені меңгереді" — what the learner masters. */
  mastery: Localized;
  /** "Түсіндіру қалай беріледі" — how explanation is delivered. */
  explanation: Localized;
  /** "Ай соңында оқушы не істей алады" — end-of-month capability (PDF p.11). */
  endOfMonthCapability: Localized;
  /** Task count promised by the programme. A claim to validate against. */
  expectedTaskCount: number;
  /** Practice task descriptions, verbatim from the PDF's practice paragraph. */
  practiceOutline: Localized;
  theoryHours: number;
  practiceHours: number;
  units: Unit[];
  assessment: MonthlyAssessment | null;
  sourceType: SourceType;
  pdfPage: number;
  illustrationId?: string;
}

export interface Program {
  id: string;
  title: Localized;
  subtitle: Localized;
  grade: number;
  ageRange: string;
  weeks: number;
  sessionsPerWeek: number;
  sessionMinutes: number;
  totalSessions: number;
  months: Month[];
}

/** Counts the validator reports. Never rounded up to look finished. */
export interface ContentInventory {
  expected: number;
  implemented: number;
  validated: number;
  published: number;
}
