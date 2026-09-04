import type { Localized } from "@schools/curriculum/types";
import type { EvidenceState } from "@schools/presentation/evidence";

/**
 * The teacher analytics contracts.
 *
 * Server-owned shapes, crossing to the browser as JSON. Deliberately NOT
 * `server-only`: client components import these types, and one of them
 * (`TEACHER_PERIODS`) is a runtime value the period selector needs. Nothing in
 * this file may import a `server-only` module — `@schools/curriculum/types` and
 * `@schools/presentation/evidence` are both pure and already cross this
 * boundary today.
 *
 * ## The rules these shapes encode
 *
 * **No raw database rows reach React.** Every field below is either a count, a
 * timestamp, a closed union, or a `Localized` sentence. There is no
 * `Record<string, unknown>`, no jsonb passthrough, and no field whose name is a
 * column name.
 *
 * **No identifier is a label.** Where a machine key must cross — `failureClass`,
 * `skillId`, `blockId` — it crosses ALONGSIDE a `Localized` that is what gets
 * rendered. The key is there so a teacher who disputes a claim can be shown the
 * evidence, which is the property `MisconceptionObservation.episodeIds` exists
 * for and which the old `ClassroomSignal` dropped.
 *
 * **Every ratio ships its own numerator and denominator.** `independentShare`
 * never travels without `solvedIndependent` and `solved`. A share with no
 * counts behind it is a number a teacher cannot check, and at n=3 it is a
 * number nobody should act on.
 *
 * **`null` means unmeasured and never means zero.** A learner who has solved
 * nothing has `independentShare: null`, not `0` — the two are different facts
 * and only one of them is about the learner.
 */

/* -------------------------------------------------------------------------- */
/* Period                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The windows a teacher may choose.
 *
 * `week` and `month` map onto `@schools/lib/period`'s existing vocabulary so
 * the arithmetic in `@schools/lib/activity-window` is reused rather than
 * re-derived — the brief's "do not build a second definition of this week"
 * applies literally. `programme` is the extra one a teacher needs and a learner
 * does not: everything since the course began.
 */
export const TEACHER_PERIODS = ["week", "month", "programme"] as const;
export type TeacherPeriod = (typeof TEACHER_PERIODS)[number];

export function isTeacherPeriod(v: unknown): v is TeacherPeriod {
  return typeof v === "string" && (TEACHER_PERIODS as readonly string[]).includes(v);
}

export interface PeriodDescriptor {
  period: TeacherPeriod;
  /** Inclusive ISO start. */
  from: string;
  /** Exclusive ISO end. */
  to: string;
  /** Bucket keys covering the window, in order. Empty for `programme`. */
  buckets: string[];
  grain: "day" | "month";
}

/* -------------------------------------------------------------------------- */
/* Freshness                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * How old the numbers are.
 *
 * Rendered on every teacher screen. Cumulative figures come from `learner_state`,
 * which only moves when the reducer sweeps; a dashboard that does not say so
 * invites a teacher to read the past as the present.
 */
export interface Freshness {
  /** `max(attempt_episodes.reduced_at)`, deployment-wide. Null before the first sweep. */
  lastSweepAt: string | null;
  /** Events for this class not yet folded into an episode. */
  pendingEvents: number;
  /** True when there is pending work AND the last sweep is old. */
  behind: boolean;
}

/* -------------------------------------------------------------------------- */
/* Class context                                                              */
/* -------------------------------------------------------------------------- */

export interface ClassContext {
  schoolId: string;
  classId: string;
  /** «9А» — the school's own name for it. Never the raw id on screen. */
  className: string;
  enrolled: number;
  /**
   * The curriculum month this screen is describing.
   *
   * Derived from the class's own progress — the lowest month at least half the
   * enrolled learners have not finished — unless the teacher asked for another
   * one with `?month=`. It used to be the highest month the DEPLOYMENT had
   * published, computed once for everybody, which meant a September class was
   * analysed as May the moment the runbook published all nine months.
   */
  monthIndex: number;
  monthTitle: Localized;
  /**
   * True when the teacher chose this month, false when the product derived it.
   *
   * The two need different words on screen. "Your class is here" and "you are
   * looking at November" are different statements, and a UI that cannot tell
   * them apart will make one of them silently.
   */
  monthSelected: boolean;
  /**
   * The months the selector may offer: authored, and gated open.
   *
   * A teacher must not be able to select a month the product would then show
   * them nothing for — a screen of zeros with no explanation is exactly the
   * failure this whole change is about.
   */
  availableMonths: { index: number; title: Localized }[];
  /**
   * Whether that month is actually being served, and why not if not.
   *
   * `bypassedForDevelopment` must be rendered distinctly: it means a
   * development build opened content that production would refuse, and a demo
   * that hides it shows a month that is not really live.
   */
  curriculum: {
    open: boolean;
    bypassedForDevelopment: boolean;
    approval: "approved" | "never_reviewed" | "lapsed";
    /** Set when `approval === 'approved' | 'lapsed'`. */
    approvedBy: string | null;
    approvedAt: string | null;
  };
}

/* -------------------------------------------------------------------------- */
/* Headline metrics                                                           */
/* -------------------------------------------------------------------------- */

/**
 * A number with its provenance attached.
 *
 * `value: null` is unmeasured. `denominator` is present whenever the value is a
 * share, so the UI can render «6 из 9» beside «67%» and a teacher can see that
 * a 67% built on three events is not a measurement.
 */
export interface Metric {
  value: number | null;
  denominator: number | null;
  /** What this number counts, in the teacher's language. */
  label: Localized;
  /** The check behind it — «за 7 дней», «с начала курса». */
  window: Localized;
}

export interface ClassKpis {
  /** Active roster. Withdrawn and disabled accounts are excluded. */
  totalStudents: number;
  /** Learners with at least one episode opened in the window. */
  activeInPeriod: number;
  /** Learners whose top-level status is `needs_attention` or `dormant`. */
  needAttention: number;
  /** Learners whose top-level status is `ready_to_stretch`. */
  readyForChallenge: number;
  /** Independent solves across the class, in the window. */
  independentSolves: number;
  /** Assisted solves — any hint level, or a revealed solution. */
  assistedSolves: number;
  /** Median practice minutes per ACTIVE learner. Null when nobody was active. */
  medianPracticeMinutes: number | null;
  /**
   * Required core work completed, class-wide.
   *
   * Numerator counts (learner, lesson) pairs where `evaluateCompletion` is
   * satisfied against the ledger; denominator is every enrolled learner ×
   * every published lesson in the month. Optional bank tasks are NOT in either.
   */
  requiredWork: { completed: number; total: number };
}

/* -------------------------------------------------------------------------- */
/* Learner status and findings                                                */
/* -------------------------------------------------------------------------- */

/**
 * One status per learner, and they are genuinely mutually exclusive.
 *
 * The baseline dashboard could put the same child in «Требуют внимания» and
 * «Готовы к сложному» at once, because the two tiles counted overlapping signal
 * sets. Here the ladder is evaluated in order and stops at the first match, so
 * the four tiles partition the roster and sum to it.
 */
export type LearnerStatus =
  /** Enrolled, no episode ever. Not a zero score — an absence. */
  | "not_started"
  /** Has worked before, but nothing recently. */
  | "dormant"
  /** At least one attention finding. */
  | "needs_attention"
  /** Independent evidence across several skills, and nothing unexplained. */
  | "ready_to_stretch"
  /** Working, nothing to flag. */
  | "on_track";

export const LEARNER_STATUSES: readonly LearnerStatus[] = [
  "not_started",
  "dormant",
  "needs_attention",
  "ready_to_stretch",
  "on_track",
];

/**
 * Why a learner is flagged. Every kind names a checkable cause.
 *
 * `classroom.ts:13-22` set this rule and it is kept: there is no finding
 * computed from a mood, and none of these is an inference about ability,
 * motivation or attention. A finding a teacher cannot disagree with on the
 * evidence does not belong here.
 */
export type FindingKind =
  /** No events for N days. A fact about the calendar. */
  | "inactive"
  /** Enrolled and has never opened anything. */
  | "never_started"
  /** An actionable misconception seen in ≥2 separate episodes. */
  | "repeated_misconception"
  /** Most solves needed level-2+ help. */
  | "assistance_dependent"
  /** Episodes classed `stuck`, with no accept. Out of ideas, not thrashing. */
  | "stuck"
  /** Episodes classed `thrash`. Trying things, none of them working. */
  | "thrashing"
  /** Failures the system could not explain. Needs a human, not a guess. */
  | "unexplained_failures"
  /** Required lessons behind the rest of the class. */
  | "required_work_behind"
  /** The month's assessment is open and this learner has not finished it. */
  | "assessment_incomplete"
  /** Solving less independently than in the previous window of equal length. */
  | "regressed"
  /** Reveals the solution often relative to what they solve. */
  | "reveal_reliant";

/** The counterpart. Never a reason to rank a learner ahead of one who is stuck. */
export type StrengthKind =
  | "independent_across_skills"
  | "improved"
  | "delayed_resolve_success";

export interface Finding {
  kind: FindingKind;
  /** The sentence a teacher reads. Prose only — never an identifier. */
  detail: Localized;
  /** When this became true, where that is knowable. */
  since: string | null;
  /** The skill it concerns, when it concerns one. */
  skillId: string | null;
  skillTitle: Localized | null;
  /**
   * The machine key behind a `repeated_misconception`, for audit only.
   *
   * Never rendered as-is. It is here so a teacher who says "I do not believe
   * this child confuses `and` and `or`" can be shown the episodes rather than
   * argued with, and so an export carries the stable key rather than a
   * translated sentence.
   */
  failureClass?: string;
  /** The episodes behind the claim. The property that makes it auditable. */
  episodeIds?: string[];
  /** Blocks this finding points at, for a drill-down. */
  blockIds?: string[];
  /**
   * What to do next.
   *
   * A fixed sentence chosen by a `switch` over `kind`, never generated. The
   * brief is explicit and so is the product: teacher analytics is deterministic
   * and explainable, and an LLM has no business writing advice about a named
   * child from data it was handed in bulk.
   */
  recommendation: Localized;
}

export interface Strength {
  kind: StrengthKind;
  detail: Localized;
  skillIds: string[];
}

/* -------------------------------------------------------------------------- */
/* Roster row                                                                 */
/* -------------------------------------------------------------------------- */

export interface RosterRow {
  subjectId: string | null;
  userId: string;
  displayName: string;
  status: LearnerStatus;
  /** Any event, server clock. Null for a learner who has never appeared. */
  lastActiveAt: string | null;
  /** Last episode opened. Stricter than `lastActiveAt` — this is work. */
  lastWorkedAt: string | null;
  /** Windowed counts. Zeroes here mean "nothing in this window". */
  episodes: number;
  solvedIndependent: number;
  solvedAssisted: number;
  submissions: number;
  practiceMinutes: number;
  activeDays: number;
  interventions: number;
  /** `solvedIndependent / solved`, or null when nothing was solved. */
  independentShare: number | null;
  /** Required lessons finished / required lessons published this month. */
  requiredWork: { completed: number; total: number };
  /** Cumulative, from `learner_state`. Not windowed — see the metrics doc. */
  unexplainedFailures: number;
  findings: Finding[];
  strengths: Strength[];
  /** The lesson or block they most recently worked on. */
  currentTopic: { blockId: string; lessonId: string; title: Localized } | null;
}

/* -------------------------------------------------------------------------- */
/* Overview                                                                   */
/* -------------------------------------------------------------------------- */

export interface TrendPoint {
  bucket: string;
  activeLearners: number;
  episodes: number;
  solvedIndependent: number;
  solvedAssisted: number;
  practiceMinutes: number;
  interventions: number;
}

/**
 * This window against the one before it, of equal length.
 *
 * Raw counts travel with the delta, always. A "+40%" on a base of 5 is noise,
 * and the UI suppresses the percentage below a floor rather than rendering a
 * number that invites a conclusion.
 */
export interface Comparison {
  current: number;
  previous: number;
  /** Null when the previous window is too small to compare against. */
  changePct: number | null;
}

export interface TeacherOverview {
  context: ClassContext;
  period: PeriodDescriptor;
  freshness: Freshness;
  kpis: ClassKpis;
  /** Learners needing attention, most actionable first. */
  attention: RosterRow[];
  /** Learners with independent evidence to spare. */
  stretch: RosterRow[];
  trend: TrendPoint[];
  comparison: {
    activeLearners: Comparison;
    independentSolves: Comparison;
    assistedSolves: Comparison;
    practiceMinutes: Comparison;
  };
  /** The weakest skills across the class, worst first. */
  weakestSkills: SkillSummary[];
  /** The lessons causing the most difficulty, worst first. */
  hardestLessons: LessonSummary[];
  /** Assessment headline, when the month has one. */
  assessment: AssessmentSummary | null;
}

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

export interface SkillSummary {
  skillId: string;
  title: Localized;
  introducedInMonth: number;
  /** Learners in each evidence state. Sums to the enrolled roster. */
  counts: Record<EvidenceState, number>;
  /** Learners with at least one attempt. The population for every ratio here. */
  attemptedBy: number;
  /** Median graded submissions per episode on this skill's blocks. */
  medianAttempts: number | null;
  /** The most common named mistake on this skill, if any is actionable. */
  topMistake: {
    failureClass: string;
    label: Localized;
    learners: number;
    occurrences: number;
  } | null;
  lastActivityAt: string | null;
}

export interface SkillDetail extends SkillSummary {
  /** Every enrolled learner's state on this skill, including untouched. */
  learners: {
    subjectId: string | null;
    displayName: string;
    state: EvidenceState;
    attempts: number;
    soloSolved: number;
    assistedSolved: number;
  }[];
  /** Blocks that teach or test this skill, hardest first. */
  blocks: BlockSummary[];
  mistakes: {
    failureClass: string;
    label: Localized;
    learners: number;
    occurrences: number;
    lastAt: string;
  }[];
}

export interface ClassSkillMatrix {
  context: ClassContext;
  period: PeriodDescriptor;
  freshness: Freshness;
  skills: SkillSummary[];
  /** Row order for the heatmap. Same order as the roster. */
  learners: { subjectId: string | null; displayName: string }[];
  /** `cells[skillId][subjectId]`. Absent means `not_started`. */
  cells: Record<string, Record<string, EvidenceState>>;
}

/* -------------------------------------------------------------------------- */
/* Lessons and blocks                                                         */
/* -------------------------------------------------------------------------- */

export interface BlockSummary {
  blockId: string;
  lessonId: string;
  /** The block's kind, localised. Never the raw enum. */
  kindLabel: Localized;
  /** Whether a machine can grade it at all. `false` is correct, not a fault. */
  machineGradable: boolean;
  attemptedBy: number;
  acceptedBy: number;
  independentBy: number;
  assistedBy: number;
  revealedBy: number;
  medianSubmissions: number | null;
  medianMinutes: number | null;
  strugglingEpisodes: number;
  /** The most common named failure on this block. */
  topFailure: { failureClass: string; label: Localized; occurrences: number } | null;
}

export interface LessonSummary {
  lessonId: string;
  title: Localized;
  unitTitle: Localized;
  monthIndex: number;
  /** Attempt blocks in the lesson, after the track filter. */
  requiredBlocks: number;
  startedBy: number;
  completedBy: number;
  /** Learners who finished it with no assistance on any block. */
  completedIndependentlyBy: number;
  medianMinutes: number | null;
  /** The block most learners stop at. */
  dropOffBlockId: string | null;
  /** The block with the worst accept rate among those attempted. */
  hardestBlockId: string | null;
  /** The block with the best accept rate. */
  easiestBlockId: string | null;
}

export interface LessonDetail extends LessonSummary {
  blocks: BlockSummary[];
  /** Per-learner progress through this lesson. */
  learners: {
    subjectId: string | null;
    displayName: string;
    reached: number;
    total: number;
    completedAt: string | null;
    outstanding: string[];
  }[];
}

export interface ClassLessons {
  context: ClassContext;
  period: PeriodDescriptor;
  freshness: Freshness;
  lessons: LessonSummary[];
  /**
   * Lessons in the month that have no authored blocks.
   *
   * Shown explicitly. Months 2–9 ship structure with `blocks: []`, and a
   * progress bar that silently counted them would read as broken content rather
   * than as unwritten content.
   */
  unauthoredLessons: { lessonId: string; title: Localized }[];
}

/* -------------------------------------------------------------------------- */
/* Assessment                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What a learner's monthly check is doing.
 *
 * `awaiting_review` is a fact about the POLICY: every block a machine could
 * grade has been graded, and what remains is structurally human-marked
 * (`explain`, oral `verify`). It is deliberately NOT the marking queue, which
 * lives in `ReviewQueue` and counts ANSWERS a person has yet to read.
 *
 * The two are different populations and can legitimately disagree on one
 * screen — a learner can be `in_progress` with an unread explanation, so the
 * distribution reads 0 here while «Ждут проверки» reads 3. They used to share
 * a label and a teacher read the pair as a bug, which is why this state is
 * now called «Осталось учителю» and never «Ждёт проверки человеком».
 */
export type AssessmentState =
  | "not_open"
  | "not_started"
  | "in_progress"
  | "awaiting_review"
  | "complete";

export interface AssessmentBlockResult {
  blockId: string;
  kindLabel: Localized;
  machineGradable: boolean;
  /** `attempted` | `answered` | `measured` | `passed` | `none`, localised. */
  reachedLabel: Localized;
  reached: string;
  /** What the policy demands of this block. */
  required: string;
  met: boolean;
  /**
   * The marking criteria the author wrote, for a human-marked block.
   *
   * From `block.expectedPoints`. `types.ts:400-403` says the teacher console
   * showing these is the reason they exist on the block. Safe to render: they
   * are the standard, not the answer.
   */
  expectedPoints: Localized[] | null;
}

export interface AssessmentLearnerRow {
  subjectId: string | null;
  displayName: string;
  state: AssessmentState;
  completedAt: string | null;
  blocks: AssessmentBlockResult[];
  /** Minutes spent on assessment episodes. Measured, not the authored budget. */
  minutes: number | null;
  /**
   * True when a coding block was submitted and no verdict was ever recorded.
   *
   * This is the judge-outage signal. `assessment.v1` requires `measured` on both
   * coding blocks, so an outage silently zeroes a class's completion — and the
   * ledger records only the absence. The flag says "we could not measure this",
   * which is the honest reading, rather than letting it look like a learner who
   * did not sit the check.
   */
  unmeasuredCoding: boolean;
}

export interface AssessmentSummary {
  assessmentId: string;
  monthIndex: number;
  title: Localized;
  /** Whether the month is published and the check is servable. */
  open: boolean;
  /** Authored minutes. An estimate — the product does not enforce it. */
  budgetMinutes: number | null;
  counts: Record<AssessmentState, number>;
  /** Learners whose coding half could not be measured. */
  unmeasuredCoding: number;
  /**
   * Human-marked blocks a learner has reached — the work a person must read.
   *
   * September's `m1.as.b3` (written explanation) and `m1.as.b4` (the note
   * beside an oral defence) cannot be machine-graded: `checking.ts` settles
   * both as `unknown` and says why. This counts how many of those a class has
   * produced, which is the size of the marking a teacher is owed.
   *
   * **The count and the queue are not the same number, deliberately.** This is
   * derived from the ledger — an episode reached `answered`. `ClassAssessments.
   * review` is derived from `learning_submissions.answer`, which only exists
   * for work settled after migration 0021. A row from before it kept the
   * verdict and lost the words, permanently, and the difference between these
   * two numbers is exactly that loss. Collapsing them would hide it.
   */
  humanMarkedAnswers: number;
  /**
   * Of those, how many nobody has read yet.
   *
   * The honest «N работ ждут чтения учителем». Counted from `human_reviews`
   * (migration 0022): an artifact with no review row is pending, and one a
   * member of staff flagged for follow-up is NOT — they read it and decided
   * something, which is the whole reason the decision is recorded.
   */
  pendingReview: number;
}

/* -------------------------------------------------------------------------- */
/* Human review                                                               */
/* -------------------------------------------------------------------------- */

/**
 * How a learner's words reached the platform.
 *
 * `written` — they typed the answer and it is the whole artifact.
 *
 * `spoken_note` — the block is an oral defence given to the teacher in person.
 * What is stored is the short note the learner wrote before speaking, and
 * **the product records no audio anywhere**: there is no recorder in the
 * renderer, no media column in any migration and no upload route. Labelling
 * this "the oral answer" would claim a recording that does not exist.
 */
export type ResponseForm = "written" | "spoken_note";

/**
 * One learner waiting on one human-marked task.
 *
 * Carries no prose. The queue is what a teacher scans to choose where to
 * start; sending the whole class's writing to render a list of names would
 * hand out twenty children's work to display none of it.
 */
export interface ReviewItem {
  subjectId: string;
  displayName: string;
  blockId: string;
  /**
   * The artifact this row is about.
   *
   * A review is recorded against this, not against the task — so a learner who
   * rewrites an explanation after feedback produces a new id, and the row
   * returns to pending, because nobody has read the new words.
   */
  submissionId: string;
  /** The task, in a teacher's words — not the block id. */
  taskLabel: Localized;
  form: ResponseForm;
  /** When the learner submitted. ISO, UTC. */
  submittedAt: string;
  /**
   * What a member of staff decided, or null while nobody has read it.
   *
   * Null is what «ждёт проверки» means. The two non-null values both mean READ:
   * one says nothing further is needed, the other says the class has to come
   * back to it. Neither is a judgement of the answer.
   */
  review: ReviewState | null;
  /**
   * Whether there is text stored to open.
   *
   * False means the submission predates artifact storage: the verdict survived
   * and the words did not. The row stays in the queue because the learner did
   * the work and a teacher still owes them a reading — it simply cannot happen
   * on this screen.
   */
  readable: boolean;
}

/**
 * What a member of staff decided, having read one artifact.
 *
 * Mirrors `human_reviews` (migration 0022) and carries no score, no grade and
 * no note — the table has no column for any of them, deliberately, and 0016's
 * argument that the absent column is the guarantee applies here unchanged.
 */
export type ReviewDisposition = "reviewed" | "needs_followup";

export interface ReviewState {
  disposition: ReviewDisposition;
  /** When the CURRENT decision was made. Changing the decision moves it. */
  reviewedAt: string;
  /** True when the signed-in teacher is the one who decided. */
  byYou: boolean;
}

/** The month's marking, as a workflow rather than a statistic. */
export interface ReviewQueue {
  assessmentId: string;
  title: Localized;
  /**
   * How many blocks of this check a human is asked to mark.
   *
   * Zero and "nobody has submitted yet" are different empty states and lead to
   * different sentences: *all of this month's tasks are machine-checked* is a
   * fact about the curriculum, and *nothing has come in yet* is a fact about
   * the class. An empty `items` alone cannot tell them apart.
   */
  humanMarkedBlocks: number;
  /** Waiting on a person, oldest submission first. */
  items: ReviewItem[];
  /**
   * Human-marked answers that exist but have no stored text.
   *
   * `humanMarkedAnswers` minus the readable items. Named separately because a
   * teacher seeing «3 ждут проверки» under a class of twenty who all answered
   * needs to know the other seventeen are not missing — they are unreadable.
   *
   * Derived from `humanMarkedAnswers`, which counts ledger evidence, minus the
   * readable rows of `items`. **`items` therefore must never be filtered down
   * to the unresolved ones** — shrinking it would make this number report
   * phantom unreadable answers. Resolution is a property of each row, and the
   * grouping happens at the render site.
   */
  unreadable: number;
  /**
   * Rows nobody has read yet. The honest «Ждут проверки — N».
   *
   * Counted here rather than in the component so the number and the list cannot
   * drift: both come from `items`, and a follow-up is NOT pending — a person
   * has read it and decided something, which is the whole point of recording
   * the decision.
   */
  pending: number;
  /** Rows a member of staff flagged to come back to. Read, not outstanding. */
  followUp: number;
}

/**
 * One learner's submitted work on the human-marked blocks of one assessment.
 *
 * The payload behind the review panel, and the narrowest thing the teacher API
 * returns: one learner, one assessment, only blocks the curriculum declares a
 * human marks. It contains no reference solution, no hidden case, no verdict
 * replay and no Nova conversation — see `schools/teacher/review.ts` for why
 * each of those is structurally unreachable rather than filtered out.
 */
export interface StudentReview {
  context: ClassContext;
  subjectId: string;
  displayName: string;
  assessmentTitle: Localized;
  responses: ReviewResponse[];
}

export interface ReviewResponse {
  blockId: string;
  /**
   * The artifact to record a review against, or null.
   *
   * Null for a block this learner never submitted. The panel disables its
   * control on null rather than posting one and letting the route decide —
   * there is nothing to have read.
   */
  submissionId: string | null;
  /** What a member of staff decided about this artifact, or null. */
  review: ReviewState | null;
  taskLabel: Localized;
  form: ResponseForm;
  /** The question the learner was asked. Public — it is what they read. */
  prompt: Localized;
  /**
   * What a marker looks for.
   *
   * `block.expectedPoints`. `types.ts:400-403` says the teacher console showing
   * these is the reason they exist. They are the standard, not the answer, and
   * they are the thing that makes marking one learner comparable to marking
   * the next.
   */
  expectedPoints: Localized[];
  /** Null when the learner has not submitted this block at all. */
  submittedAt: string | null;
  /**
   * The learner's own words, verbatim, or null.
   *
   * Null has three causes and they are different facts: never submitted,
   * submitted before storage existed, or submitted with an empty box. The UI
   * distinguishes them using `submittedAt`.
   */
  text: string | null;
}

export interface ClassAssessments {
  context: ClassContext;
  freshness: Freshness;
  assessments: (AssessmentSummary & { learners: AssessmentLearnerRow[] })[];
  /** The month's human-review workflow. Null when the month has no check. */
  review: ReviewQueue | null;
}

/* -------------------------------------------------------------------------- */
/* Assistance                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What a teacher may see about Nova. Deliberately never the conversation.
 *
 * Chat content is not stored anywhere: the payload allowlist has no text key,
 * `interventions.content_hash` is never written, and the chat lives in browser
 * React state alone. This is a structural privacy guarantee and the dashboard
 * states it rather than leaving an absence for someone to fill in later.
 */
export interface AssistanceAnalytics {
  requested: number;
  delivered: number;
  /** Granted but never streamed. A provider failure, not a learner fact. */
  undelivered: number;
  /**
   * Per hint level, what the learner did within the stamped window.
   *
   * The window is `same_episode / 20 active minutes / 3 submissions`, fixed at
   * write time. A learner who returns the next day and solves it reads as
   * `stalled` here, so every label says "within 20 minutes" and never "after
   * help".
   */
  byLevel: {
    level: number;
    delivered: number;
    resolvedIndependently: number;
    resolvedByTransfer: number;
    progressed: number;
    escalated: number;
    stalled: number;
    regressed: number;
  }[];
  /** Blocks where help was taken most often. */
  mostAssistedBlocks: { blockId: string; title: Localized; interventions: number; learners: number }[];
  /**
   * Whether a real model was answering during the window.
   *
   * On the `echo` provider a "hint" is one canned sentence, so any success rate
   * over that period describes nothing about tutoring. The panel refuses to
   * draw conclusions when this is true.
   */
  degradedProvider: boolean;
}

/* -------------------------------------------------------------------------- */
/* Student detail                                                             */
/* -------------------------------------------------------------------------- */

export type TimelineKind =
  | "lesson_completed"
  | "solved_independently"
  | "solved_with_help"
  | "attempted"
  | "assistance_taken"
  | "solution_revealed"
  | "assessment_submitted"
  | "review_resolved"
  | "returned_after_break";

export interface TimelineEntry {
  at: string;
  kind: TimelineKind;
  /** A human sentence. No enum, no reducer tick, no internal event name. */
  detail: Localized;
  blockId: string | null;
  lessonId: string | null;
  episodeId: string | null;
}

export interface StudentDetail {
  context: ClassContext;
  period: PeriodDescriptor;
  freshness: Freshness;
  row: RosterRow;
  /** Cumulative, from `learner_state`. Stated as cumulative on screen. */
  cumulative: {
    episodes: number;
    soloSolved: number;
    assistedSolved: number;
    interventions: number;
    unexplainedFailures: number;
    transferSolves: number;
    computedAt: string | null;
  };
  skills: {
    skillId: string;
    title: Localized;
    state: EvidenceState;
    stateLabel: Localized;
    attempts: number;
    soloSolved: number;
    assistedSolved: number;
    /** Localised, built from the counts. Never the engine's English rationale. */
    summary: Localized;
    misconceptions: {
      failureClass: string;
      label: Localized;
      distinctEpisodes: number;
      lastSeenAt: string;
      episodeIds: string[];
    }[];
  }[];
  lessons: { lessonId: string; title: Localized; completedAt: string | null; reached: number; total: number }[];
  assessment: AssessmentLearnerRow | null;
  assistance: AssistanceAnalytics;
  reviews: {
    blockId: string;
    title: Localized;
    reasonLabel: Localized;
    dueAt: string;
    completedAt: string | null;
    outcomeLabel: Localized | null;
  }[];
  timeline: TimelineEntry[];
  activity: TrendPoint[];
}

/* -------------------------------------------------------------------------- */
/* Leaderboard                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Four lenses, class-only.
 *
 * The project has written "no ranking by score" (`classroom.ts:262-265`) and
 * that refusal stands: what it refuses is a COMPOSITE INVENTED score — the
 * `mastery 0-100` and `averageScore 0-100` that got
 * `_quarantine/invented/teacher-data.ts` quarantined. Every rank below is a
 * count of something a teacher can audit down to individual episodes, each
 * lens states its own denominator, and no lens combines two units into one
 * number without printing the parts.
 *
 * Ranking is never global and never crosses classes.
 */
export const LEADERBOARD_LENSES = ["independent", "improvement", "consistency", "challenge"] as const;
export type LeaderboardLens = (typeof LEADERBOARD_LENSES)[number];

export function isLeaderboardLens(v: unknown): v is LeaderboardLens {
  return typeof v === "string" && (LEADERBOARD_LENSES as readonly string[]).includes(v);
}

export interface LeaderboardEntry {
  rank: number;
  subjectId: string | null;
  displayName: string;
  /** The ranked quantity. Always an integer count or a counted delta. */
  value: number;
  /** The parts the value is made of, so the rank can be checked by hand. */
  components: { label: Localized; value: number }[];
  /**
   * Why this learner is not comparable, when they are not.
   *
   * A learner with three episodes is not "last"; they are unranked. The UI
   * lists them separately rather than at the bottom.
   */
  insufficientEvidence: boolean;
}

export interface Leaderboard {
  context: ClassContext;
  period: PeriodDescriptor;
  freshness: Freshness;
  lens: LeaderboardLens;
  /** The formula, in the teacher's language, rendered beside the table. */
  explanation: Localized;
  entries: LeaderboardEntry[];
  /** Learners below the evidence floor for this lens. */
  unranked: { subjectId: string | null; displayName: string; reason: Localized }[];
}
