import "server-only";
import { SKILL_BY_ID } from "@schools/curriculum/skills";
import { capabilityFor } from "@schools/curriculum/capability";
import { failureWord } from "@schools/learning/phrasing";
import { taskKindOf, type GradeTarget } from "@schools/learning/grade";
import type { LearningStore, TrustedEvent } from "@schools/store/learning-store";
import type { Locale, LessonBlock } from "@schools/curriculum/types";
import type { NovaDirective } from "@solvex/learning-intelligence-core";
import type { GrantDecision } from "@solvex/nova-core";
import {
  MAX_DRAFT_CHARS,
  MAX_RELEVANT_EVIDENCE,
  MAX_STREAM_CHARS,
  type EvidenceSummary,
  type NovaContext,
  type SettledVerdict,
  type SkillSummary,
} from "./context";

/**
 * Assembling what Nova knows, on the server, from things the server can prove.
 *
 * Two halves, and the seam between them is the whole point:
 *
 *   SETTLED — read back out of the ledger on every request. The verdict, the
 *             attempt count, the hints already given, whether anything has been
 *             tried since. A browser cannot influence any of it.
 *
 *   DRAFT   — what is on screen and has not been checked. Comes from the
 *             browser because there is nowhere else it could come from, is
 *             clamped here, and is fenced as untrusted downstream.
 *
 * The draft is what makes Nova feel present — «Где ошибка?» is nearly always
 * about something not yet submitted — and it is exactly the field a learner
 * could lie in. So it may shape WORDING and never PERMISSIONS: the grant was
 * computed before this function ran, from the ledger, and nothing here can
 * raise it.
 */

/** What the browser may say about its own screen. All of it optional, all untrusted. */
export interface DraftInput {
  selectedOptionId?: unknown;
  text?: unknown;
  blanks?: unknown;
  order?: unknown;
  line?: unknown;
  cells?: unknown;
  code?: unknown;
}

export interface BuildContextInput {
  store: LearningStore;
  subjectId: string;
  episodeId: string;
  locale: Locale;
  target: GradeTarget;
  grant: GrantDecision;
  directive: NovaDirective | null;
  directiveNote: string | null;
  action: string | null;
  assessmentCapped: boolean;
  draft?: DraftInput;
}

const clamp = (v: unknown, max: number): string | undefined =>
  typeof v === "string" && v.trim() ? v.slice(0, max) : undefined;

/**
 * The draft, taken seriously and trusted with nothing.
 *
 * Every field is shape-checked and length-clamped. A learner who pastes their
 * whole project gets the first four thousand characters of it; a learner who
 * sends `{code: {toString: ...}}` gets nothing, rather than a crash on a route
 * a fourteen-year-old is waiting on.
 */
function readDraft(raw: DraftInput | undefined): NovaContext["interaction"]["draft"] {
  if (!raw || typeof raw !== "object") return undefined;

  const draft: NonNullable<NovaContext["interaction"]["draft"]> = {};
  const selected = clamp(raw.selectedOptionId, 120);
  if (selected) draft.selectedOptionId = selected;
  const text = clamp(raw.text, MAX_DRAFT_CHARS);
  if (text) draft.text = text;
  const code = clamp(raw.code, MAX_DRAFT_CHARS);
  if (code) draft.code = code;

  if (Array.isArray(raw.blanks)) {
    const blanks = raw.blanks.slice(0, 24).map((b) => clamp(b, 200) ?? "");
    if (blanks.some((b) => b)) draft.blanks = blanks;
  }
  if (Array.isArray(raw.order)) {
    const order = raw.order.slice(0, 40).map((o) => clamp(o, 120) ?? "").filter(Boolean);
    if (order.length) draft.order = order;
  }
  if (typeof raw.line === "number" && Number.isFinite(raw.line)) {
    draft.line = Math.max(0, Math.trunc(raw.line));
  }
  if (raw.cells && typeof raw.cells === "object" && !Array.isArray(raw.cells)) {
    const cells: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw.cells as Record<string, unknown>).slice(0, 60)) {
      const value = clamp(v, 120);
      if (value) cells[k.slice(0, 60)] = value;
    }
    if (Object.keys(cells).length) draft.cells = cells;
  }

  return Object.keys(draft).length ? draft : undefined;
}

/**
 * What the author put on the screen.
 *
 * Read from the curriculum rather than echoed from the browser, so a learner
 * cannot invent a fourth option and ask Nova why it is wrong. Option TEXT is
 * included on purpose: without it Nova is told the learner picked `b` and has
 * no idea what `b` says, which is the difference between a useful sentence and
 * "tell me what you selected".
 */
function readVisible(block: LessonBlock, locale: Locale): NovaContext["interaction"]["visible"] {
  const visible: NovaContext["interaction"]["visible"] = {};
  const b = block as LessonBlock & {
    code?: string;
    options?: unknown;
    correctOptionId?: string;
    pieces?: { id: string; text: string }[];
  };

  if (typeof b.code === "string") visible.code = b.code.slice(0, MAX_DRAFT_CHARS);

  if (Array.isArray(b.options)) {
    /* Two shapes in the curriculum: `multiple_choice` carries objects,
       `prediction` carries bare strings. Normalised here so the prompt has one
       thing to render and does not grow a branch per block type. */
    visible.options = b.options.slice(0, 12).map((o, i) =>
      typeof o === "string"
        ? { id: o, text: o }
        : { id: String((o as { id: string }).id), text: String((o as { text?: string }).text ?? "") },
    ).filter((o) => o.id);
  }

  if (Array.isArray(b.pieces)) {
    visible.pieces = b.pieces.slice(0, 24).map((p) => ({
      id: String(p.id),
      text: String(p.text ?? "").slice(0, 200),
    }));
  }

  return visible;
}

const asString = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v : undefined;

/**
 * What actually happened on this block, from the ledger.
 *
 * The verdict comes from the LAST `verdict_received` written for this episode,
 * not from the browser's opinion and not from re-grading — re-grading would
 * answer "is the draft correct", which is a different question and one Nova
 * must not be handed, because it would let a learner use the tutor as an oracle
 * by editing and re-asking.
 */
function readSettled(
  events: readonly TrustedEvent[],
  deliveredHintLevel: number,
  lastHintAt: string | null,
): NovaContext["interaction"]["settled"] {
  const TRUSTED = new Set(["server", "judge", "verifier"]);
  const trusted = events.filter((e) => TRUSTED.has(e.sourceTrust));

  const verdicts = trusted.filter((e) => e.event_name === "verdict_received");
  const last = verdicts[verdicts.length - 1];
  const lastVerdict = last?.payload?.verdict;

  let verdict: SettledVerdict = "unchecked";
  if (lastVerdict === "accepted") verdict = "correct";
  else if (typeof lastVerdict === "string") verdict = "incorrect";
  else if (trusted.some((e) => e.event_name === "episode_opened")) {
    /* Checked, and nothing came back. Two very different reasons — a block no
       machine marks, and a judge that could not be reached — and the ledger
       cannot tell them apart from here, so this says the honest thing rather
       than guessing. `unmeasured` never means the learner was wrong. */
    verdict = "unmeasured";
  }

  /* An attempt is a press of Check.
   *
   * Which is `episode_opened` OR `episode_resumed` — the first submission on an
   * episode and every one after it. Both are written BEFORE grading, which is
   * why they survive when grading produces no verdict; counting verdicts
   * instead would report zero attempts on exactly the blocks where a learner is
   * most stuck, which is the failure this whole phase keeps finding variants
   * of. */
  const isAttempt = (name: string) => name === "episode_opened" || name === "episode_resumed";
  const attemptCount = trusted.filter((e) => isAttempt(e.event_name)).length;

  const attemptSinceLastHelp =
    lastHintAt === null
      ? attemptCount > 0
      : trusted.some((e) => e.received_at > lastHintAt && isAttempt(e.event_name));

  const settled: NovaContext["interaction"]["settled"] = {
    verdict,
    attemptCount,
    deliveredHintLevel,
    attemptSinceLastHelp,
  };

  /* Execution output, when the judge reported any. Truncated hard: a runaway
     loop prints megabytes and the first few lines are where the answer is. */
  const stdout = asString(last?.payload?.stdout);
  const stderr = asString(last?.payload?.stderr);
  if (stdout) settled.stdout = stdout.slice(0, MAX_STREAM_CHARS);
  if (stderr) settled.stderr = stderr.slice(0, MAX_STREAM_CHARS);

  const passed = last?.payload?.tests_passed;
  const total = last?.payload?.tests_total;
  if (typeof passed === "number" && typeof total === "number" && total > 0) {
    /* A count, never the cases. Which checks exist is public; what they contain
       is the thing the learner is being measured on. */
    settled.visibleTestSummary = `${passed}/${total}`;
  }

  return settled;
}

/**
 * The skills this block is about, said in words.
 *
 * `supportedDifficulty` is attached ONLY when the directive already permits
 * naming a misconception. That ordering matters: the decision about whether the
 * evidence supports a diagnosis is the Decision Engine's, and re-deciding it
 * here — or attaching the name and trusting the prompt to withhold it — would
 * put the most consequential claim Nova can make behind a sentence in a prompt
 * rather than behind a branch in code.
 */
function readSkills(
  block: LessonBlock,
  locale: Locale,
  directive: NovaDirective | null,
): SkillSummary[] {
  const named =
    directive?.mayNameMisconception && directive.namedMisconception
      ? directive.namedMisconception
      : null;

  return block.skillRefs.slice(0, 4).map((skillId) => {
    const def = SKILL_BY_ID.get(skillId);
    const summary: SkillSummary = {
      skillId,
      label: def ? def.title[locale] : skillId,
    };
    if (named) summary.supportedDifficulty = failureWord(named, locale);
    return summary;
  });
}

/**
 * Recent history, filtered to what could change the next sentence.
 *
 * Relevance is skill overlap with the current block, then recency. Nine months
 * of events is both useless to a model and expensive; what changes Nova's reply
 * is "they hit this same wall on Tuesday", not the stream that established it.
 *
 * Bounded at four by `MAX_RELEVANT_EVIDENCE`, and the bound lives in the
 * contract rather than here so no caller can widen it.
 */
export async function selectRelevantEvidence(
  store: LearningStore,
  subjectId: string,
  skillIds: readonly string[],
  locale: Locale,
  now = Date.now(),
): Promise<EvidenceSummary[]> {
  let episodes;
  try {
    episodes = await store.episodeInputsFor(subjectId);
  } catch {
    /* No history is a normal state and an unreadable history must not be a
       failed hint. Nova simply knows less, which it is built to handle. */
    return [];
  }

  const relevant = skillIds.length
    ? episodes.filter((e) => e.skill && skillIds.includes(e.skill))
    : episodes;

  /* Most recent first. `closed_at` is the server's clock; an episode still open
     has none and sorts last, which is right — it has not produced evidence. */
  const sorted = [...relevant].sort((a, b) => {
    const at = Date.parse(a.episode.closed_at ?? "") || 0;
    const bt = Date.parse(b.episode.closed_at ?? "") || 0;
    return bt - at;
  });

  return sorted.slice(0, MAX_RELEVANT_EVIDENCE).map((e) => {
    const closed = Date.parse(e.episode.closed_at ?? "") || now;
    const summary: EvidenceSummary = {
      outcome: e.episode.outcome ?? "unknown",
      skillId: e.skill,
      daysAgo: Math.max(0, Math.round((now - closed) / 86_400_000)),
    };
    /* The attributed class, in words, and only when one was actually
       established. An unattributed failure stays unattributed here — that is
       the difference between evidence and a guess. */
    const attribution = e.episode.attributions?.[0];
    if (attribution && attribution.failure_class !== "unattributed_failure") {
      summary.difficulty = failureWord(attribution.failure_class, locale);
    }
    return summary;
  });
}

export async function buildNovaContext(input: BuildContextInput): Promise<NovaContext> {
  const { store, subjectId, episodeId, locale, target, directive } = input;
  const block = target.block;

  const [events, deliveredHintLevel, lastHintAt] = await Promise.all([
    store.eventsForEpisode(episodeId),
    store.lastGrantedLevel(episodeId),
    store.lastHintAt(episodeId),
  ]);

  const skillIds = block.skillRefs;
  const recentEvidence = await selectRelevantEvidence(store, subjectId, skillIds, locale);

  const kind = taskKindOf(target);

  return {
    learner: { subjectId, locale },
    curriculum: {
      monthTitle: target.month.title[locale],
      lessonTitle: target.lesson.title[locale],
      blockId: block.id,
      blockType: block.type,
      prompt:
        "prompt" in block && block.prompt
          ? (block.prompt as Record<Locale, string>)[locale]
          : target.lesson.title[locale],
      skillIds: [...skillIds],
      capability: capabilityFor(block.id),
      /* `verify` blocks are the assessment's coding half and must inherit its
         restrictions; `taskKindOf` already folds them into `assessment`. */
      mode: kind === "assessment" ? "assessment" : kind === "practice" ? "practice" : "lesson",
    },
    interaction: {
      visible: readVisible(block, locale),
      settled: readSettled(events, deliveredHintLevel, lastHintAt),
      draft: readDraft(input.draft),
    },
    intelligence: {
      relevantSkills: readSkills(block, locale, directive),
      recentEvidence,
      action: input.action,
      directive,
      directiveNote: input.directiveNote,
    },
    assistance: {
      grant: input.grant,
      assessmentCapped: input.assessmentCapped,
    },
  };
}
