import "server-only";
import type { NovaDirective } from "@solvex/learning-intelligence-core";
import type { GrantDecision } from "@solvex/nova-core";
import type { BlockType, Locale } from "@schools/curriculum/types";
import type { CapabilityContext } from "@schools/curriculum/capability";

/**
 * What Nova knows about right now.
 *
 * ## The bug this exists to end
 *
 * A learner reads `cout << 2 + 2;`, picks the wrong option, opens Nova and
 * types «Где ошибка?». Nova answers something like *"your code looks fine, what
 * do you see on screen?"* — and the platform, at that exact moment, already
 * knows the lesson, the block, the three options, which one they picked, that
 * it was wrong, and that it was their first attempt.
 *
 * The learner had to re-type facts the product was already holding. That is the
 * single worst thing a tutor sitting beside you can do, because it proves it is
 * not sitting beside you.
 *
 * The cause was not subtle: the browser posted `{blockId, episodeId, message}`
 * and the server looked the block up in the curriculum. So Nova saw the task as
 * an AUTHOR wrote it and never as the LEARNER was experiencing it.
 *
 * ## One object, built in one place
 *
 * Every screen used to be free to compose its own prompt fragment, which is how
 * a codebase ends up with four subtly different ideas of what Nova is told. So
 * there is exactly one context, it is assembled on the server, and
 * `schools/nova/prompt.ts` renders it. A new block type extends this; it does
 * not grow a second path.
 *
 * ## Trust is part of the type, not a convention
 *
 * The split below is the whole design. `interaction.draft` is what the browser
 * currently has on screen — an option clicked but not yet checked, code being
 * typed, a half-finished reordering. It is genuinely client-side, genuinely
 * useful, and genuinely unverifiable, so it is fenced as untrusted when it
 * reaches the model and NEVER becomes learning evidence.
 *
 * Everything in `interaction.settled` is re-derived here from the ledger. The
 * browser may say it got the answer right; the server does not care. That
 * distinction is not paranoia about fourteen-year-olds — it is that
 * `attemptCount` and `verdict` feed the hint ladder and the teacher's evidence,
 * and a field that can be claimed is a field that will eventually be claimed.
 */

/** How the learner's current answer stands, according to the SERVER. */
export type SettledVerdict =
  | "correct"
  | "incorrect"
  /** Graded by nobody: an explanation, a reflection, a block no machine marks. */
  | "unmeasured"
  /** The judge could not be reached. Says nothing about the learner. */
  | "infrastructure_error"
  /** Nothing has been checked on this block yet. */
  | "unchecked";

/**
 * A skill, as much of it as Nova is allowed to be told.
 *
 * Deliberately thin. Nova does not receive a confidence number, an episode
 * count or a history — it receives whether the system is prepared to ACT on
 * something, which is the only part that changes what it should say. Handing a
 * model `confidence: 0.62` invites it to reason about the number and narrate
 * it, and a learner should never read a probability about themselves.
 */
export interface SkillSummary {
  skillId: string;
  /** Human-readable, already localized. Never a raw taxonomy id. */
  label: string;
  /** Only when the directive permits naming it. Otherwise absent. */
  supportedDifficulty?: string;
}

/**
 * One thing that actually happened, recently, on a skill that matters here.
 *
 * Summarised, not raw. The whole point of `selectRelevantEvidence` is that nine
 * months of events is both useless to a model and expensive; what changes
 * Nova's next sentence is "they hit this same wall twice this week", not the
 * event stream that established it.
 */
export interface EvidenceSummary {
  /** `solved_alone` | `solved_after_help` | `failed` | `abandoned`. */
  outcome: string;
  skillId: string | null;
  /** Days ago, rounded. Never a timestamp — precision here is not useful. */
  daysAgo: number;
  /** The failure class, only when trusted and attributed. */
  difficulty?: string;
}

export interface NovaContext {
  learner: {
    /** Pseudonymous. Never a name, never an email, never an account id. */
    subjectId: string;
    locale: Locale;
  };

  curriculum: {
    monthTitle: string;
    lessonTitle: string;
    blockId: string;
    blockType: BlockType;
    /** What the task asks, in the learner's language. */
    prompt: string;
    /** Skill ids the block declares. Internal; rendered as labels. */
    skillIds: string[];
    /**
     * Which C++ the curriculum has actually shown this learner by now.
     *
     * `skillIds` says what the task is ABOUT. This says what a hint may be
     * WRITTEN WITH, and they are different questions: a level-4 hint on a
     * September task could reach for a `for` loop, which is correct C++17 and
     * useless to someone six lessons in.
     *
     * Paired with the declared sequence in `@schools/nova/cpp17`, which answers
     * the half this cannot: the frame is SHOWN from lesson one and not REQUIRED
     * of the learner until lesson seven.
     */
    capability: CapabilityContext | null;
    mode: "lesson" | "practice" | "assessment" | "review";
  };

  interaction: {
    /**
     * What the AUTHOR put on the screen. Trusted, because it came from the
     * curriculum rather than from the browser.
     */
    visible: {
      /** Starter or illustrative code the block displays. */
      code?: string;
      /** Every option, in order, as the learner sees them. */
      options?: { id: string; text: string }[];
      /** Pieces to be ordered, for a reorder block. */
      pieces?: { id: string; text: string }[];
    };

    /**
     * What the SERVER can prove about this block, from the ledger.
     *
     * Re-derived on every request. Nothing here is accepted from the browser.
     */
    settled: {
      verdict: SettledVerdict;
      /** Graded attempts on record for this episode. Never the client's count. */
      attemptCount: number;
      /** The highest hint level already delivered here, or -1 for none. */
      deliveredHintLevel: number;
      /** Whether anything has been tried since the last hint was given. */
      attemptSinceLastHelp: boolean;
      /** Visible execution output, when the judge produced some. */
      stdout?: string;
      stderr?: string;
      /** e.g. "2 of 5 checks passed". Never the hidden cases themselves. */
      visibleTestSummary?: string;
    };

    /**
     * What is on screen RIGHT NOW and has not been checked.
     *
     * UNTRUSTED. Fenced when it reaches the model, excluded from every ledger
     * write, and never allowed to contradict `settled`. This is the field that
     * makes Nova feel present — «Где ошибка?» is almost always asked about
     * something not yet submitted — and it is exactly the field a learner could
     * forge, which is why it can inform WORDING and never PERMISSIONS.
     */
    draft?: {
      /** For a choice block: which option is currently selected. */
      selectedOptionId?: string;
      /** Free text: a prediction, an explanation, or a fill-in. */
      text?: string;
      /** Every blank, in order. */
      blanks?: string[];
      /** The learner's current ordering, as piece ids. */
      order?: string[];
      /** For find_bug: the line they have marked. */
      line?: number;
      /** For trace_code: the grid they have filled in. */
      cells?: Record<string, string>;
      /** For write_code / modify_code: the editor's current contents. */
      code?: string;
    };
  };

  intelligence: {
    /** Skills relevant to THIS block, not the learner's whole profile. */
    relevantSkills: SkillSummary[];
    /** A handful of recent, relevant things. Bounded — see the selector. */
    recentEvidence: EvidenceSummary[];
    /** The engine's chosen action. Internal name; never shown to a learner. */
    action: string | null;
    directive: NovaDirective | null;
    /**
     * Why there is no directive, when there is none.
     *
     * Shown in the dev lab. A null directive is the normal state for a new
     * learner and means "make no claim about them", not "something broke".
     */
    directiveNote: string | null;
  };

  assistance: {
    grant: GrantDecision;
    /** True when the ceiling came from assessment policy, not the ladder. */
    assessmentCapped: boolean;
  };
}

/**
 * How many pieces of history travel with a request.
 *
 * Four. Enough that "they hit this twice this week" is expressible, far short
 * of a profile — and bounded here rather than at the call site so no caller can
 * opt into sending more. Input tokens are billed, eighteen learners share one
 * monthly cap, and context that grows quietly is how a pilot runs out of budget
 * in week three.
 */
export const MAX_RELEVANT_EVIDENCE = 4;

/**
 * How much of a learner's own code or prose travels.
 *
 * Generous, because the current task is the thing Nova most needs to see, and
 * stingy enough that a paste of somebody's entire project does not become the
 * prompt. A September solution is under ten lines.
 */
export const MAX_DRAFT_CHARS = 4000;

/** Execution output is truncated hard: a runaway loop prints megabytes. */
export const MAX_STREAM_CHARS = 800;
