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

/*
 * A type-only import, so nothing in the judge is pulled into a client bundle by
 * a component that renders a block. The checker semantics have one definition
 * and it belongs to the module that does the comparing — a second copy here
 * would be the first step back towards a task passing CI under one rule and
 * failing a learner under another.
 */
import type { OutputChecker } from "../exec/checker";

/** Re-exported so a month file declares a checker without reaching past these types. */
export type { OutputChecker };

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
  | "worked_example"
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
  /**
   * Optional breadth rather than required sequence. Absent means CORE.
   *
   * ## Why this is not `tracks`, and not anything else that already exists
   *
   * `tracks` answers "WHO sees this" — Қолдау, Негізгі, Тереңдетілген, the
   * three routes PDF p.6 names. This answers "MUST they do it". The two are
   * orthogonal and both are needed: an advanced-only block can be required of
   * the advanced route, and an untracked block can be optional for everyone.
   * Folding one into the other would make "bank" a fourth route, which is a
   * claim the programme does not make and which `TrackLevel` would have to lie
   * about.
   *
   * Nothing else fits either. `sourceType` is provenance — who wrote it, not
   * whether it is required; a curriculum-derived task can be optional and a
   * product-authored one can be core. `status` lives on the Lesson and means
   * publication state. Expressing this structurally instead — moving optional
   * blocks into their own lessons — would reorder the teaching sequence and
   * change ids to encode something that is not about position.
   *
   * ## Absent is the default and the migration
   *
   * Every block authored before this field existed keeps its meaning: part of
   * the required path. There is no backfill, no version bump, and September is
   * untouched. A block only leaves the core path when somebody says so and says
   * why — which is what `why` is for, and why it is not optional.
   *
   * ## What it does NOT do
   *
   * It does not hide anything. `schools/curriculum/public.ts` builds each
   * public block field by field and this is not among them, so it never reaches
   * a browser or Nova; and a bank task stays addressable by its own id, so a
   * teacher-assignment or adaptive selector can reach it later without a new
   * content model.
   */
  bank?: BankMembership;
}

/**
 * Why a validated task sits outside the required path.
 *
 * Three roles, deliberately few. The programme's own count — «шамамен 250 оқу
 * тапсырмасы … Бұл минимум жиын; платформада қосымша есептер бар» (p.11) — is a
 * floor with extra problems available beyond it, and this is the field that
 * makes the difference between the floor and the extra sayable.
 */
export interface BankMembership {
  /**
   * - `extra_practice` — another task on a skill the core path already
   *   establishes. Correct, useful, and not needed to learn the thing.
   * - `review` — deliberately revisits a skill from an EARLIER month, for
   *   spaced practice rather than for first learning.
   * - `extension` — beyond what the programme requires of this month at all.
   */
  role: "extra_practice" | "review" | "extension";
  /**
   * What the core path would lose if this were required, or gain if it were.
   * Required, and checked for length by the validator: a task is removed from
   * every learner's month by this field, and that is not a decision to record
   * as a shrug.
   */
  why: string;
}

export interface ConceptBlock extends BlockBase {
  type: "concept";
  title: Localized;
  body: Localized;
  code?: string;
}

/**
 * A problem reasoned through from statement to result.
 *
 * The programme calls for «толық талданған мысалдар» — fully worked examples —
 * and September had none: a concept block is a code snippet under two
 * sentences, which shows an answer without ever showing the thinking that
 * reaches it. The shape here is the one the brief names: problem → reasoning →
 * code → trace → result, with the reasoning as discrete steps so the learner
 * reads one move at a time instead of a wall of prose.
 *
 * It is not an attempt block. Reading someone else's reasoning is not evidence
 * of anything, and pretending otherwise is the exact failure the verdict model
 * exists to prevent.
 */
export interface WorkedExampleBlock extends BlockBase {
  type: "worked_example";
  title: Localized;
  /** The task, stated as a learner would meet it. */
  problem: Localized;
  /** The thinking, one move per step. Kept short: this is not a lecture. */
  steps: Localized[];
  /** The program the reasoning arrives at. */
  code: string;
  /**
   * Input the program is reasoned over, when it reads any.
   *
   * The same field `PredictionBlock` carries, for the same reason and after the
   * same discovery. A worked example states, in `result`, what its code prints
   * for the sample in `problem` — and that is a claim about Python that can
   * only be checked by running Python. Thirteen of the year's forty read
   * stdin, so without this the sample lives in the prose and nowhere a test can
   * reach, and `tests/school/content-integrity.test.ts` could verify two thirds
   * of the worked examples and had to name the rest as unverifiable.
   *
   * A worked example is the one block a learner is told to trust. It is the
   * model they reason from, and a wrong one teaches the wrong thing before they
   * ever meet a grader — so it is the last place an unchecked claim belongs.
   *
   * Absent is correct for a self-contained snippet.
   */
  stdin?: string;
  /** What it prints for the sample in `problem`. Concrete, never "the answer". */
  result: Localized;
}

export interface PredictionBlock extends BlockBase {
  type: "prediction";
  prompt: Localized;
  code: string;
  /**
   * Input the program is predicted against.
   *
   * Most predictions are over a self-contained snippet and need none. One that
   * asks "what happens when the learner types 3 4" needs it declared rather
   * than described only in the prompt — otherwise the stated answer cannot be
   * checked against real Python, which is how `content-execution.test.ts`
   * caught exactly that.
   */
  stdin?: string;
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
  /**
   * An input on which the broken program and the repaired one visibly differ.
   *
   * "This program is broken" is a claim, and a claim about Python is checkable
   * by running Python — which is what `content-execution.test.ts` does. Without
   * a declared witness the test has to probe a spread of guessed inputs, and a
   * guessed spread is numeric, so a bug that only shows on text (m1.l11.b3
   * calls `int()` on a name) reads as "the two programs behave identically".
   *
   * Optional, because the numeric probe genuinely covers the arithmetic bugs.
   * Declare it whenever the symptom needs a specific input to appear.
   */
  symptomInput?: string;
}

export interface WriteCodeBlock extends BlockBase {
  type: "write_code";
  prompt: Localized;
  starter?: string;
  /** Reference solution. Never shown to a learner. */
  referenceSolution: string;
  cases: { input: string; expectedOutput: string; hidden?: boolean }[];
  /**
   * How this task's output is compared. Absent means `{ kind: "token" }`.
   *
   * ## Why `token` is the default and not `exact`
   *
   * A default is a decision taken for every author who did not think about the
   * question, so it must be the one that is harmless when nobody thought.
   *
   * `exact` is not harmless as a default. It would attach a requirement to
   * every task in the year that no prompt states — reproduce the author's
   * spacing and line breaks — and the learner who fails it is told they are
   * wrong about arithmetic, on a hidden case, over a space nobody asked for.
   * From inside the product that is indistinguishable from not understanding
   * the topic, and it reaches the evidence pipeline as exactly that.
   *
   * `token` errs the other way: it accepts everything a byte comparison
   * accepts, and the extra things it accepts are the things the prompt did not
   * ask about. When the formatting genuinely IS the exercise — print a table,
   * separate the pairs with commas — the author writes `{ kind: "exact" }` on
   * the block, one word, in review, next to the cases it governs.
   *
   * `{ kind: "numeric", ... }` MUST carry its own tolerance; there is no global
   * default and the validator rejects a numeric checker without one. Inventing
   * a tolerance would decide on every future author's behalf how wrong their
   * answer is allowed to be.
   *
   * The same field, with the same default, is on `modify_code`, `challenge` and
   * `verify`. The rules themselves live in `schools/exec/checker.ts`.
   */
  checker?: OutputChecker;
}

export interface ModifyCodeBlock extends BlockBase {
  type: "modify_code";
  prompt: Localized;
  code: string;
  referenceSolution: string;
  cases: { input: string; expectedOutput: string; hidden?: boolean }[];
  /** Output comparison. Absent means `token` — see `WriteCodeBlock.checker`. */
  checker?: OutputChecker;
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
  /**
   * The program under inspection.
   *
   * Required by `find_bug` and `manual_trace`: a "find the error" task with no
   * program on screen is not a hard task, it is an impossible one. The absence
   * of this field is what made `m1.as.b3` unanswerable — the renderer had
   * nothing to draw, so the learner met a prompt about "this program" and an
   * empty box. The validator now refuses either mode without it.
   */
  code?: string;
  /** Editable starting point. Defaults to `code` for repair modes. */
  starter?: string;
  referenceSolution?: string;
  /**
   * Assessment cases are mostly hidden by design: a check the learner can pass
   * by echoing a visible sample answer measures nothing. The validator warns
   * when none is hidden.
   */
  cases?: { input: string; expectedOutput: string; hidden?: boolean }[];
  /**
   * Output comparison. Absent means `token` — see `WriteCodeBlock.checker`.
   *
   * An assessment is where the temptation to tighten to `exact` is strongest
   * and worst: the cases are hidden, so a learner marked wrong on whitespace in
   * a monthly check has no way to discover why, and the result is filed as
   * evidence about the month's topic.
   */
  checker?: OutputChecker;
  /**
   * Points a human marker looks for, for the modes no machine should score.
   *
   * `oral_explanation` and the written half of a monthly check settle as
   * `unknown` and are read by a teacher. Carrying the marking points on the
   * block means the teacher console shows the same criteria the learner was
   * set, rather than a marker inventing them per learner.
   */
  expectedPoints?: Localized[];
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
  /** Output comparison. Absent means `token` — see `WriteCodeBlock.checker`. */
  checker?: OutputChecker;
}

export type LessonBlock =
  | ConceptBlock
  | WorkedExampleBlock
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
