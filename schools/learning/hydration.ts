import type { BlockAnswer } from "./checking";
import type { RevealPayload } from "./reveal";

/**
 * What the server already knows about one learner's work on one lesson.
 *
 * ## The defect this exists for
 *
 * A learner answered a block, the server graded it, signed it, wrote the events
 * and settled the submission. Then they pressed F5 and the lesson came back
 * blank: `0/9` in the top bar for a learner who had solved nine of nine, no
 * settled cards, and a finish button that bounced them to block 1 because the
 * completion rule was being evaluated over an empty map. The record was intact
 * the whole time. Nothing asked for it.
 *
 * ## What this module is, and is not
 *
 * It is the CONTRACT and the projection: a pure function from what the store
 * returned to what the player renders. It is deliberately pure — no store, no
 * `server-only`, no `node:crypto` — for the same reason `checking.ts` is, so
 * the client component can import these types and so the mapping can be tested
 * without a database.
 *
 * The reading is `schools/learning/rehydrate.ts`.
 *
 * ## The trust rule, stated once
 *
 * Every field here is a RESPONSE and none of them has a request counterpart.
 * There is no shape in this file a browser can post, and that is structural
 * rather than conventional: hydration only ever travels server -> client. A
 * client that could name its own verdict could name `correct`; one that could
 * name its own `assistanceLevel` could name `-1` and launder away the help it
 * was given. So the browser is told what happened and is never asked.
 *
 * ## What is deliberately absent
 *
 * The learner's ANSWER. It is not persisted anywhere — `ALLOWED_PAYLOAD_KEYS`
 * in `packages/learning-contracts` has no key for one, and migration 0019 says
 * in terms that `learning_submissions.response` "holds NO learner free text".
 * That is a data-residency decision three migrations argue for, not an
 * oversight, and this phase does not overturn it.
 *
 * The consequence is visible and has to be handled honestly rather than
 * papered over: a restored `write_code` block would otherwise show a green
 * border over an empty editor, which reads as "correct, and you wrote nothing".
 * So a restored block says so — see `restored` below and `RestoredNote` in the
 * renderer. Showing the verdict without pretending the empty field is their
 * work is the truthful option; hiding the verdict would be the old bug.
 */

/**
 * The four settled outcomes a block can be restored into.
 *
 * `unchecked` is absent on purpose: it is what an ABSENT key means, and having
 * two ways to say "not attempted" is how they eventually disagree.
 */
export type HydratedVerdict = "correct" | "wrong" | "partial" | "unmeasured";

/**
 * Why nothing was measured, when nothing was — carried across the refresh.
 *
 * The same four values the live submit path produces, minus `not_saved`.
 * `not_saved` cannot be hydrated by definition: it means the round trip failed
 * and nothing was written, so there is nothing to read back.
 */
export type HydratedNote = "not_machine_graded" | "judge_unavailable" | "no_trusted_judge";

/**
 * The learner's submitted work, as the hydration payload carries it.
 *
 * Deliberately `BlockAnswer` itself rather than a parallel shape. That union
 * already covers every block type the curriculum has, already prefers stable
 * ids over authored content — `{kind:"option", id}` not the option's prose,
 * `{kind:"order", ids}` not the pieces — and is the exact value the submit
 * route received and graded. Re-modelling it here would create two
 * descriptions of one thing and a migration problem the day they disagree.
 *
 * `kind` is the version discriminator: a future artifact shape adds a member
 * rather than reinterpreting an existing one, and a reader that does not know
 * a kind can say so instead of guessing.
 */
export type SubmittedArtifact = BlockAnswer;

/**
 * Read one artifact back out of `jsonb`, or decide it is unusable.
 *
 * The column is `jsonb` and a row may predate this code, have been written by
 * an older shape, or — the case that actually matters — have been round-tripped
 * through two drivers that disagree about whether jsonb arrives parsed or as
 * text. So the value is validated on the way out rather than cast.
 *
 * Returns `undefined` for anything it does not recognise. That is the honest
 * answer and it degrades correctly: the block restores its verdict and leaves
 * the editor empty, which is exactly what a pre-0021 row does. A cast would
 * instead hand the UI a shape it will destructure and crash on.
 */
export function readArtifact(value: unknown): SubmittedArtifact | undefined {
  const raw: unknown =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return null;
          }
        })()
      : value;
  if (!raw || typeof raw !== "object") return undefined;
  const a = raw as { kind?: unknown };

  switch (a.kind) {
    case "option":
      return typeof (a as { id?: unknown }).id === "string"
        ? { kind: "option", id: (a as { id: string }).id }
        : undefined;
    case "text":
      return typeof (a as { value?: unknown }).value === "string"
        ? { kind: "text", value: (a as { value: string }).value }
        : undefined;
    case "blanks": {
      const v = (a as { values?: unknown }).values;
      return Array.isArray(v) && v.every((x) => typeof x === "string")
        ? { kind: "blanks", values: v as string[] }
        : undefined;
    }
    case "order": {
      const ids = (a as { ids?: unknown }).ids;
      return Array.isArray(ids) && ids.every((x) => typeof x === "string")
        ? { kind: "order", ids: ids as string[] }
        : undefined;
    }
    case "line":
      return typeof (a as { line?: unknown }).line === "number"
        ? { kind: "line", line: (a as { line: number }).line }
        : undefined;
    case "grid": {
      const cells = (a as { cells?: unknown }).cells;
      if (!cells || typeof cells !== "object" || Array.isArray(cells)) return undefined;
      const entries = Object.entries(cells as Record<string, unknown>);
      return entries.every(([, v]) => typeof v === "string")
        ? { kind: "grid", cells: Object.fromEntries(entries) as Record<string, string> }
        : undefined;
    }
    /* `none` and `acknowledged` carry nothing to restore. Returning undefined
       rather than the value keeps "there is work to put back" a single check
       at every call site. */
    case "none":
    case "acknowledged":
      return undefined;
    default:
      return undefined;
  }
}

export interface HydratedBlock {
  /**
   * The verdict as recorded, never re-derived.
   *
   * `partial` survives here and does not survive in `learning_events` —
   * `toLearningVerdictName` folds `partial` and `wrong` into one
   * `wrong_answer`. Reading the ledger instead would tell a learner who traced
   * four of five rows that they got it flatly wrong.
   */
  verdict: HydratedVerdict;

  /**
   * Distinct answers graded on this block. Not Check presses — an unchanged
   * answer replays the first verdict and writes nothing, by design.
   */
  attempts: number;

  /**
   * What the learner submitted, as they submitted it.
   *
   * Absent means one of two things and the difference matters:
   *   - the row was settled before migration 0021, so no artifact was ever
   *     kept — the verdict restores, the editor stays empty; or
   *   - the block's answer kind carries nothing worth restoring
   *     (`acknowledged`, `none`).
   *
   * Never absent because we chose not to hand it back: this is the learner's
   * own work being returned to the learner who wrote it, so there is no
   * disclosure to weigh. It is untrusted DATA on the way back in — see
   * `schools/nova` for why storage never promotes it to trusted input.
   *
   * It is NOT the correct answer. `BlockAnswer` has no field for one.
   */
  submitted?: SubmittedArtifact;

  /**
   * The episode this block's evidence lives in, when a further attempt should
   * CONTINUE it rather than start a new one.
   *
   * Absent means "mint a fresh one", and the two cases where it is absent are
   * the whole of the reasoning:
   *
   *   * **The block is already solved.** An immortal episode would mean one
   *     level-0 hint in September makes every future solve of that block
   *     non-independent forever — `evaluateCompletionGate` computes
   *     `independent = solved && assistance.maxLevel < 0` and says outright
   *     that it can never be undone. An accepted verdict is the natural
   *     boundary; the submit route already writes `episode_closed` with
   *     `close_reason: "solved"` at exactly that point.
   *   * **The last settled row came from a delayed re-solve.** A review runs in
   *     a server-minted episode whose separateness IS the independence
   *     measurement — migration 0014 puts a CHECK constraint on it. Handing it
   *     back to the lesson page would fold ordinary lesson work into the
   *     re-solve.
   *
   * Present, it repairs three things a refresh used to break: the hint rung
   * (`max(level) from interventions where episode_id = $1`), the reveal counter
   * (non-accepted `verdict_received` rows on the episode), and — the serious
   * one — `solveEvidence`, which reads `assistance_delivered` on the episode
   * and was reporting a hinted solve as independent whenever the learner had
   * reloaded in between.
   */
  episodeId?: string;

  /**
   * What the server decided this learner had earned the right to see, replayed
   * verbatim from the response it sent them.
   *
   * REPLAYED, never recomputed. `revealFor` consults a failure count that moves,
   * so re-running it at hydration time could open an answer the learner had not
   * earned — the identical hazard migration 0019 cites as the reason a
   * duplicate submission replays its stored response instead of re-grading.
   */
  reveal?: RevealPayload;

  /** The author's explanation of the learner's specific wrong answer, as sent. */
  why?: string;

  /** What the card must say beyond its verdict. */
  note?: HydratedNote;

  /** Public per-test counts. Counts only; never inputs, never expected outputs. */
  cases?: { passed: number; total: number };

  /**
   * Whether help was DELIVERED on this block — tokens that actually reached the
   * learner, not a hint that was requested while the provider was down.
   *
   * Surfaced so the card cannot quietly relabel an assisted solve as an
   * independent one on the learner's own screen. The analytical half of that
   * guarantee is `episodeId` above; this is the half the learner can see.
   */
  assisted: boolean;

  /** Highest rung delivered, or `-1` for none — the same sentinel the store uses. */
  assistanceLevel: number;

  /**
   * True when this state was read back from the server rather than produced by
   * an answer in this session.
   *
   * The renderer needs it because the answer is not restorable (see the module
   * header): a restored block must show its verdict AND say that the answer
   * itself is not being shown, rather than leaving a green border over an empty
   * editor to be read as "correct, and blank".
   */
  restored: true;

  /**
   * True when only the coarse event-stream projection was available.
   *
   * The rich path is the settled submission row. This is the fallback for
   * blocks answered before submission ids existed, or by a client that sent
   * none: the verdict is honest but flattened (`partial` reads as `wrong`),
   * and there is no reveal, no justification and no episode to continue.
   */
  degraded?: true;
}

/**
 * One lesson's restorable state.
 *
 * `blocks` is deliberately a plain record keyed by block id and not an array:
 * the player looks blocks up by id and an array would invite an index-based
 * join against a block list the track filter has already changed.
 */
export interface LessonHydration {
  lessonId: string;
  blocks: Record<string, HydratedBlock>;
  /**
   * When the server recorded this lesson finished, or null.
   *
   * The server's row, not the browser's `localStorage` copy — this is the one
   * that survives a cleared cache and a different laptop.
   */
  completedAt: string | null;
}

/* ── the projection ────────────────────────────────────────────────────────
   Everything below is pure. It takes rows and returns the contract. */

/** One block's identity, as much of it as the projection needs. */
export interface HydrationBlockRef {
  id: string;
  isAttempt: boolean;
}

/** The settled submission, narrowed to what the projection reads. */
export interface HydrationSettled {
  episodeId: string;
  verdict: "correct" | "wrong" | "partial" | "unknown";
  response: unknown;
  /** The learner's submitted `BlockAnswer`. Null for pre-0021 rows. */
  answer: unknown;
  settledCount: number;
  fromReview: boolean;
}

/** The coarse event-stream evidence, narrowed the same way. */
export interface HydrationEvidence {
  submissions: number;
  accepted: boolean;
}

export interface HydrationInput {
  lessonId: string;
  blocks: readonly HydrationBlockRef[];
  settled: ReadonlyMap<string, HydrationSettled>;
  evidence: ReadonlyMap<string, HydrationEvidence>;
  assistance: ReadonlyMap<string, { delivered: boolean; level: number }>;
  completedAt: string | null;
}

/**
 * Read one field out of a jsonb blob without trusting its shape.
 *
 * `response` is `jsonb` with no schema behind it. It is written by exactly one
 * place and has never held anything else — but a column with no constraint is a
 * column that will eventually hold something else, and a lesson page that
 * throws on a malformed row is a lesson page a learner cannot open.
 */
function field(response: unknown, key: string): unknown {
  if (!response || typeof response !== "object" || Array.isArray(response)) return undefined;
  return (response as Record<string, unknown>)[key];
}

function revealFrom(response: unknown): RevealPayload | undefined {
  const raw = field(response, "reveal");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return raw as RevealPayload;
}

function casesFrom(response: unknown): { passed: number; total: number } | undefined {
  const raw = field(response, "cases");
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const { passed, total } = raw as { passed?: unknown; total?: unknown };
  if (typeof passed !== "number" || typeof total !== "number") return undefined;
  return { passed, total };
}

function whyFrom(response: unknown): string | undefined {
  const raw = field(response, "why");
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

const NOTES: ReadonlySet<string> = new Set<HydratedNote>([
  "not_machine_graded",
  "judge_unavailable",
  "no_trusted_judge",
]);

/**
 * The card's condition, restored.
 *
 * A measured verdict carries no note — there is nothing to explain about a
 * block the judge scored. An unmeasured one always carries one, defaulting to
 * `not_machine_graded`, because a neutral card with no sentence on it is the
 * silent-outcome case `BlockNote` was introduced to remove.
 */
function noteFrom(response: unknown, verdict: HydratedVerdict): HydratedNote | undefined {
  if (verdict !== "unmeasured") return undefined;
  const raw = field(response, "unmeasuredReason");
  return typeof raw === "string" && NOTES.has(raw) ? (raw as HydratedNote) : "not_machine_graded";
}

/**
 * `unknown` is the ledger's word and `unmeasured` is the player's.
 *
 * They are the same fact — nothing was scored — and the rename happens once,
 * here, so no caller has to remember which vocabulary it is holding.
 */
function toHydrated(verdict: HydrationSettled["verdict"]): HydratedVerdict {
  return verdict === "unknown" ? "unmeasured" : verdict;
}

/**
 * Build the hydration contract from what the store returned.
 *
 * Three sources, in strict precedence:
 *
 *  1. **The settled submission.** The rich path: the exact response this server
 *     already sent this learner, with the verdict at full fidelity and the
 *     reveal they had earned.
 *  2. **The event stream.** The floor. A block with events and no settled row
 *     was answered by a client that sent no submission id, or before migration
 *     0019 existed. Coarse, but a coarse truth beats rendering it as untouched.
 *  3. **Neither.** The key is omitted. Absent means unattempted, and it is the
 *     only thing that means unattempted.
 *
 * Non-attempt blocks — concept cards, worked examples — are never hydrated.
 * They have nothing to grade, they settle locally the moment a learner presses
 * Continue, and manufacturing a server opinion about whether somebody read a
 * paragraph is exactly the kind of claim the event taxonomy refuses to make.
 */
export function projectHydration(input: HydrationInput): LessonHydration {
  const blocks: Record<string, HydratedBlock> = {};

  for (const block of input.blocks) {
    if (!block.isAttempt) continue;

    const help = input.assistance.get(block.id);
    const assisted = help?.delivered ?? false;
    const assistanceLevel = assisted ? (help?.level ?? -1) : -1;

    const settled = input.settled.get(block.id);
    if (settled) {
      const verdict = toHydrated(settled.verdict);
      /* The episode is withheld once the block is accepted, and once the last
         word on it came from a re-solve. Both are argued at `episodeId` in
         `HydratedBlock`; the short version is that a permanent episode makes a
         single hint permanent too, and a review episode is not the lesson's. */
      const continues = verdict !== "correct" && !settled.fromReview;
      blocks[block.id] = {
        verdict,
        attempts: settled.settledCount,
        ...(readArtifact(settled.answer) ? { submitted: readArtifact(settled.answer) } : {}),
        ...(continues ? { episodeId: settled.episodeId } : {}),
        ...(revealFrom(settled.response) ? { reveal: revealFrom(settled.response) } : {}),
        ...(whyFrom(settled.response) ? { why: whyFrom(settled.response) } : {}),
        ...(noteFrom(settled.response, verdict) ? { note: noteFrom(settled.response, verdict) } : {}),
        ...(casesFrom(settled.response) ? { cases: casesFrom(settled.response) } : {}),
        assisted,
        assistanceLevel,
        restored: true,
      };
      continue;
    }

    const evidence = input.evidence.get(block.id);
    if (!evidence || evidence.submissions === 0) continue;

    /* The degraded path. `accepted` is the only distinction the ledger draws,
       so everything else settles as `wrong` — with one exception that matters:
       a block with submissions and NO verdict rows was never scored at all, and
       calling that wrong would be the product inventing a failure. */
    const verdict: HydratedVerdict = evidence.accepted ? "correct" : "wrong";
    blocks[block.id] = {
      verdict,
      attempts: evidence.submissions,
      assisted,
      assistanceLevel,
      restored: true,
      degraded: true,
    };
  }

  return { lessonId: input.lessonId, blocks, completedAt: input.completedAt };
}
