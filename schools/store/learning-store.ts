import "server-only";
import { randomUUID } from "node:crypto";
import type {
  LearnerState,
  SkillState,
  ReducibleEvent,
  ReducedEpisode,
  InterventionRow,
  ComputedOutcome,
  EpisodeInput,
} from "@solvex/learning-intelligence-core";
import type { LearningEventName, LearningPayload } from "@solvex/learning-contracts";
import type { PostHelpStatus } from "@schools/learning/post-help";
import type { SqlExecutor } from "./sql";

/**
 * The learning store.
 *
 * The only thing any route touches. No route writes SQL, so the engine
 * underneath can change and the product does not notice.
 *
 * Two rules shape it:
 *
 * 1. **`learning_events` is the source of truth. Everything else is a cache.**
 *    Episodes, learner state and skill state are all recomputable by replay,
 *    which is what makes bumping a reducer version safe — stale rows get
 *    recomputed rather than reinterpreted. Deleting every projection row costs
 *    a sweep and loses no facts.
 *
 * 2. **Nothing authoritative may live in a browser.** A learner refreshes, logs
 *    out, and comes back on a different machine to the same progress. A teacher
 *    reading a class list is never reading something a student could edit in
 *    DevTools.
 */

export type SourceTrust = "server" | "judge" | "verifier" | "browser";
export type Cohort = "beta" | "internal" | "public";

export interface LearningEventRow {
  eventId: string;
  subjectId: string;
  episodeId: string | null;
  sessionId: string;
  seq: number;
  eventName: LearningEventName;
  occurredAt: string;
  sourceTrust: SourceTrust;
  environment: "production" | "preview" | "development";
  cohort: Cohort;
  route: string;
  payload: LearningPayload;
}

/**
 * A stored event in the shape the reducer wants, plus the trust it was written
 * with.
 *
 * `ReducibleEvent` is the core's shape and is deliberately left alone: the
 * episode reducer folds a taxonomy and nothing else, so a replay produces the
 * same episode whoever runs it. Trust is a fact about the ROW, not about the
 * learning, so it rides alongside — every existing consumer of
 * `ReducibleEvent` keeps working unchanged, and the consumers that need to ask
 * "did this server write this, or did a browser?" can finally ask.
 *
 * The one that most needed to ask is the reveal policy. A learner is shown the
 * answer from the third failed attempt on a block, and that count came out of
 * the ledger with no way to separate a graded wrong answer from a
 * `verdict_received` posted by hand — three fetch() calls and the answer key
 * opened.
 */
export interface TrustedEvent extends ReducibleEvent {
  sourceTrust: SourceTrust;
}

export interface EpisodeRow {
  episodeId: string;
  subjectId: string;
  taskRef: string;
  taskKind: string;
  reduced: ReducedEpisode;
}

export interface StaleEpisode {
  episodeId: string;
  subjectId: string;
}

export interface ActivityBucket {
  /** 'YYYY-MM-DD' for a day grain, 'YYYY-MM' for a month grain. UTC. */
  bucket: string;
  attempted: number;
  solvedSolo: number;
  solvedAssisted: number;
  activeSeconds: number;
  helpRequests: number;
}

/**
 * A lesson a learner finished.
 *
 * The four counts are the player's own tally and are deliberately not evidence
 * — see the header of migration 0010. Nothing may build a level or a percentage
 * out of them.
 */
export interface LessonCompletion {
  lessonId: string;
  correct: number;
  wrong: number;
  unmeasured: number;
  attempts: number;
  completedAt: string;
  /**
   * The completion policy that admitted this row — see migration 0015.
   *
   * Null on rows written before the policy existed, which were admitted by the
   * old implicit "the learner reached the last block" rule. Backfilling them
   * would assert that a check which never ran had passed.
   */
  policyId: string | null;
}

/**
 * A wrong answer the ledger can prove this learner gave, carrying the failure
 * class the curriculum author declared for it.
 *
 * Only attributions whose source is the author's own `diagnosticMapping` are
 * counted. An `unattributed_failure` — the far commoner case — says "we graded
 * this and could not tell why it was wrong", which is a fact about the pipeline
 * and not something to hand back to a child.
 */
export interface AttributedMistake {
  /** `sx-lesson:m1.l3.b2`, as written on the episode that produced it. */
  taskRef: string;
  failureClass: string;
  /** How many times this learner hit this mistake. A count, not a diagnosis. */
  occurrences: number;
  lastAt: string;
}

/**
 * What the ledger proves a learner did with one block.
 *
 * Three facts and no interpretation. `schools/policies/completion.ts` turns
 * them into a rung on its ladder; nothing here decides what they mean.
 */
export interface BlockAttemptEvidence {
  blockId: string;
  /** Graded submissions on record. One per press of Check that reached the server. */
  submissions: number;
  /** `verdict_received` rows. Several per attempt is normal — one per credited skill. */
  verdicts: number;
  accepted: boolean;
}

/**
 * How a delayed re-solve settled.
 *
 * `unresolved` is a real outcome and not a failure: it is what a written or
 * oral re-solve settles as, because no machine scores one.
 */
export type ReviewOutcome =
  | "resolved_independently"
  | "resolved_with_assistance"
  | "unresolved";

/** One queued delayed re-solve. See migration 0014. */
export interface ReviewRow {
  reviewId: string;
  blockId: string;
  reason: "solved_with_assistance" | "independent_milestone";
  /** Highest hint level DELIVERED on the original solve, or -1 for none. */
  originLevel: number;
  originEpisodeId: string;
  originAt: string;
  dueAt: string;
  policyId: string;
  /**
   * The re-solve's own episode. Null until the learner opens it, and never
   * equal to `originEpisodeId` — that inequality is what resets the hint
   * ladder, the reveal counter and the independence measurement.
   */
  reviewEpisodeId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  outcome: ReviewOutcome | null;
}

/**
 * The explanation a learner owes after substantial help — migration 0016.
 *
 * Carries the learner's own words and the assistance that made them owed. It
 * carries no score, because the table has no column for one: see the migration
 * header, and `schools/learning/post-help.ts` for the rule it enforces.
 */
export interface PostHelpExplanation {
  episodeId: string;
  blockId: string;
  /** Highest hint level delivered on the episode when the gate fired. */
  assistanceLevel: number;
  interventionId: string | null;
  /** The learner's own words, or null when the gate fired and they skipped it. */
  response: string | null;
  status: PostHelpStatus;
  createdAt: string;
}

/**
 * One row of `learning_submissions` — a submission claim and, once it has been
 * graded, the response that was returned for it. See migration 0017.
 *
 * `verdict`, `settledAt` and `response` move together or not at all; a CHECK
 * constraint holds that, so a half-written settle cannot be read back as a
 * settled submission carrying no verdict.
 */
export interface SubmissionRecord {
  submissionId: string;
  blockId: string;
  episodeId: string;
  claimedAt: string;
  /** Null while the owning request is still grading. */
  settledAt: string | null;
  verdict: "correct" | "wrong" | "partial" | "unknown" | null;
  /** The submit response, replayed verbatim to a duplicate. Never learner text. */
  response: unknown;
}

/** One row of the learner's error dictionary, exactly as stored. */
export interface SavedErrorEntry {
  blockId: string;
  failureClass: string;
  /** The learner's own words, or null. The only free text the table can hold. */
  note: string | null;
  createdAt: string;
}

export class LearningStore {
  constructor(private sql: SqlExecutor) {}

  /* --- identity --------------------------------------------------------- */

  /**
   * Resolve an anonymous device key to a subject, creating one if needed.
   *
   * The alias table is what lets a learner's work follow them onto an account
   * later without the account being retroactively handed someone else's
   * history — the migration's own comment calls this "merge, never reassign".
   */
  async resolveSubject(
    anonId: string,
    cohort: Cohort = "public",
    scope?: { schoolId: string; classId: string },
  ): Promise<string> {
    const existing = await this.sql.query<{ subject_id: string }>(
      `select subject_id from learning_subject_aliases
        where alias_kind = 'anon_id' and alias_value = $1`,
      [anonId],
    );
    if (existing.rows.length > 0) {
      const id = existing.rows[0].subject_id;
      await this.sql.query(
        `update learning_subjects set last_seen_at = now() where subject_id = $1`,
        [id],
      );
      return id;
    }

    const subjectId = randomUUID();
    await this.sql.tx(async (t) => {
      await t.query(
        `insert into learning_subjects (subject_id, primary_anon_id, cohort)
         values ($1, $2, $3)`,
        [subjectId, anonId, cohort],
      );
      await t.query(
        `insert into learning_subject_aliases (alias_kind, alias_value, subject_id)
         values ('anon_id', $1, $2)
         on conflict (alias_kind, alias_value) do nothing`,
        [anonId, subjectId],
      );
      /* Scoped at creation. A subject with no class is invisible to every
         teacher query — which is the safe default, and also means a learner
         whose scoping was forgotten silently vanishes from their own class
         list. Doing it here makes forgetting impossible. */
      if (scope) {
        await t.query(
          `insert into school_subject_scope (subject_id, school_id, class_id, created_at)
           values ($1, $2, $3, now())
           on conflict (subject_id) do nothing`,
          [subjectId, scope.schoolId, scope.classId],
        );
      }
    });
    return subjectId;
  }

  /* --- L1: ingest ------------------------------------------------------- */

  /**
   * Append events. Returns how many were NEW.
   *
   * `on conflict do nothing` on `event_id` is the idempotency guarantee: a
   * retried beacon, a duplicated batch or a double-fired effect collapses to
   * one row. Attempt counts are what the entire learner state is built from, so
   * double-counting here corrupts everything downstream silently.
   *
   * It guarantees nothing about a duplicated SUBMISSION, and that gap is worth
   * naming here because it took a long time to find: a second call to
   * `/api/learning/submit` builds the same three events with FRESH ids, so
   * every one of them is new and every one of them is inserted. Deduplicating
   * that needs a key the client carries across the retry — see
   * `appendEventsAndSettle` and migration 0017.
   */
  async appendEvents(rows: readonly LearningEventRow[]): Promise<number> {
    if (rows.length === 0) return 0;
    return this.sql.tx((t) => insertEvents(t, rows));
  }

  /**
   * Append the events AND record that this submission produced them, together.
   *
   * One transaction, and that is the whole point rather than a tidiness
   * preference. Settling first would let a duplicate replay a response claiming
   * `saved: true` for a write that then failed. Settling second would leave a
   * window in which the events exist and nothing knows it, so a retry re-grades
   * and writes them again — the exact defect the dedup table is for. Committing
   * both or neither removes the window instead of narrowing it.
   *
   * The corollary is that a stored `response` always has `saved: true`, by
   * construction: if the write did not commit, there is no stored response.
   */
  async appendEventsAndSettle(
    rows: readonly LearningEventRow[],
    submission: {
      subjectId: string;
      submissionId: string;
      verdict: NonNullable<SubmissionRecord["verdict"]>;
      response: unknown;
    },
  ): Promise<number> {
    return this.sql.tx(async (t) => {
      const inserted = await insertEvents(t, rows);
      /* `settled_at is null` so a settle can never overwrite a settle. The
         replayed verdict must be the FIRST one, for the same reason
         `lesson_completions` writes `do nothing` rather than `do update`: the
         events written beside it cannot be rewritten to match a second one. */
      await t.query(
        `update learning_submissions
            set settled_at = now(), verdict = $3, response = $4::jsonb
          where subject_id = $1 and submission_id = $2 and settled_at is null`,
        [
          submission.subjectId,
          submission.submissionId,
          submission.verdict,
          JSON.stringify(submission.response),
        ],
      );
      return inserted;
    });
  }

  /**
   * Give the claim back, because nothing was written under it.
   *
   * Called when the event write fails. Without it the learner's own retry —
   * same answer, therefore same submission id — would find a claim that will
   * never settle, wait out the duplicate window and be told a second time that
   * nothing was recorded. Deleting the row lets the retry grade properly, which
   * is correct precisely because the first attempt persisted nothing.
   *
   * `settled_at is null` guards it: a claim that DID settle is a record of
   * events that exist, and deleting it would reopen the double-write.
   */
  async releaseSubmission(subjectId: string, submissionId: string): Promise<void> {
    await this.sql.query(
      `delete from learning_submissions
        where subject_id = $1 and submission_id = $2 and settled_at is null`,
      [subjectId, submissionId],
    );
  }

  /* --- submission idempotency (migration 0017) ---------------------------
     `appendEvents` is idempotent per EVENT id, which collapses a duplicated
     batch. It cannot collapse a duplicated SUBMISSION, because a second call to
     `/api/learning/submit` mints fresh event ids for the same answer — three
     new rows the learner never earned, an inflated failure count, and a reveal
     policy moved along by a retry nobody made. The key that stops that has to
     come from the client, be recorded before the judge runs, and be scoped to
     the learner. That is what these four methods are. */

  /**
   * Take the claim, or discover somebody already has it.
   *
   * ONE statement, and that is the whole concurrency design. `insert … on
   * conflict do nothing` is atomic against a concurrent identical insert:
   * exactly one caller sees `rowCount > 0` and owns the write, whatever the
   * interleaving. Doing this as `select` then `insert` would leave the window
   * this exists to close — two requests both find nothing, both grade, both
   * append — which is precisely the double-click case.
   *
   * `on conflict (subject_id, submission_id)`, so a reused id belonging to a
   * DIFFERENT learner is not a conflict at all: they get their own row, their
   * own grading and their own events.
   */
  async claimSubmission(row: {
    subjectId: string;
    submissionId: string;
    blockId: string;
    episodeId: string;
  }): Promise<boolean> {
    const res = await this.sql.query(
      `insert into learning_submissions
         (subject_id, submission_id, block_id, episode_id)
       values ($1, $2, $3, $4)
       on conflict (subject_id, submission_id) do nothing`,
      [row.subjectId, row.submissionId, row.blockId, row.episodeId],
    );
    return res.rowCount > 0;
  }

  /** The claim, if this learner has one. Never found by submission id alone. */
  async submissionRecord(
    subjectId: string,
    submissionId: string,
  ): Promise<SubmissionRecord | null> {
    const r = await this.sql.query<{
      submission_id: string;
      block_id: string;
      episode_id: string;
      claimed_at: string | Date;
      settled_at: string | Date | null;
      verdict: SubmissionRecord["verdict"];
      response: unknown;
    }>(
      `select submission_id, block_id, episode_id, claimed_at, settled_at, verdict, response
         from learning_submissions
        where subject_id = $1 and submission_id = $2`,
      [subjectId, submissionId],
    );
    const row = r.rows[0];
    if (!row) return null;
    return {
      submissionId: row.submission_id,
      blockId: row.block_id,
      episodeId: row.episode_id,
      claimedAt: toIso(row.claimed_at),
      settledAt: row.settled_at === null ? null : toIso(row.settled_at),
      verdict: row.verdict,
      response: row.response ?? null,
    };
  }

  /**
   * Take over a claim whose owner never came back.
   *
   * Without this, a process that dies between claiming and settling locks the
   * learner out of that exact answer permanently — the id is stable while their
   * text is unchanged, so every retry finds an in-flight claim that will never
   * settle, and the only escape is to edit the answer. A crash must not cost a
   * child the ability to submit what they wrote.
   *
   * Conditional, atomic and narrow: it only moves a claim that is still
   * unsettled AND older than the threshold, so it can never race a live request
   * that is merely slow. The threshold belongs well above the judge's own time
   * limit — see `STALE_CLAIM_SECONDS` in `schools/learning/submission.ts`.
   */
  async reclaimSubmission(row: {
    subjectId: string;
    submissionId: string;
    episodeId: string;
    staleAfterSeconds: number;
  }): Promise<boolean> {
    const res = await this.sql.query(
      `update learning_submissions
          set claimed_at = now(), episode_id = $3
        where subject_id = $1
          and submission_id = $2
          and settled_at is null
          and claimed_at < now() - (($4)::text || ' seconds')::interval`,
      [row.subjectId, row.submissionId, row.episodeId, row.staleAfterSeconds],
    );
    return res.rowCount > 0;
  }

  /* --- L2: episodes ----------------------------------------------------- */

  /**
   * Episodes with events the reducer has not folded in.
   *
   * "Stale" means either never reduced, or reduced by an older reducer, or
   * carrying events newer than the last reduction. All three are the same
   * remedy — replay — so they are one query.
   */
  async staleEpisodes(limit: number, reducerVersion: number): Promise<StaleEpisode[]> {
    const r = await this.sql.query<{ episode_id: string; subject_id: string }>(
      `select distinct e.episode_id, e.subject_id
         from learning_events e
         left join attempt_episodes a on a.episode_id = e.episode_id
        where e.episode_id is not null
          and (a.episode_id is null
               or a.reducer_version < $1
               or e.received_at > a.reduced_at)
        limit $2`,
      [reducerVersion, limit],
    );
    return r.rows.map((row) => ({ episodeId: row.episode_id, subjectId: row.subject_id }));
  }

  /**
   * One episode's events, in the order the reducer expects, each carrying the
   * trust the row was written with.
   *
   * `source_trust` was stamped on every row from the first migration and read
   * back by NOTHING. A stamp nobody reads is a comment, not a control: the
   * ingest route could refuse a browser the right to claim `judge` and it
   * changed no decision anywhere, because every consumer selected four columns
   * and a payload and could not tell a verdict this server computed from one a
   * fetch() typed in. Selecting it is what turns the refusal into a defence.
   *
   * The core still does not see it. `ReducibleEvent` has no such field and the
   * episode reducer must stay replayable from the taxonomy alone — a reducer
   * that weighted rows by trust would produce a different episode depending on
   * which columns happened to survive a future migration. `TrustedEvent`
   * therefore EXTENDS the core's shape rather than altering it, so
   * `reduceEpisode` takes this array unchanged.
   *
   * Who reads it: the callers deciding something about a child. `priorFailures`
   * on the submit route decides whether a fourteen-year-old is shown the
   * answer, and it now counts only rows this server wrote. They read it as a
   * filter — in or out — never as a weight, because "half-believe a browser"
   * is how a forged row gets to matter a little.
   */
  async eventsForEpisode(episodeId: string): Promise<TrustedEvent[]> {
    const r = await this.sql.query<{
      event_name: string;
      occurred_at: string;
      received_at: string;
      seq: number;
      source_trust: SourceTrust;
      payload: Record<string, string | number | boolean>;
    }>(
      `select event_name, occurred_at, received_at, seq, source_trust, payload
         from learning_events
        where episode_id = $1
        order by received_at asc, seq asc`,
      [episodeId],
    );
    return r.rows.map(toTrustedEvent);
  }

  /**
   * Every event for one subject, ordered. Used by a full replay and the dev lab.
   *
   * Carries `source_trust` for the same reason its per-episode sibling does: a
   * full replay is the path that rebuilds a learner's entire state after a
   * reducer bump, and it must not be the one read that cannot tell a forged
   * row from a graded one.
   */
  async eventsForSubject(subjectId: string): Promise<TrustedEvent[]> {
    const r = await this.sql.query<{
      event_name: string; occurred_at: string; received_at: string;
      seq: number; source_trust: SourceTrust;
      payload: Record<string, string | number | boolean>;
    }>(
      `select event_name, occurred_at, received_at, seq, source_trust, payload
         from learning_events where subject_id = $1
        order by received_at asc, seq asc`,
      [subjectId],
    );
    return r.rows.map(toTrustedEvent);
  }

  async upsertEpisode(row: EpisodeRow): Promise<void> {
    const e = row.reduced;
    await this.sql.query(
      `insert into attempt_episodes
         (episode_id, subject_id, task_ref, task_kind, opened_at, closed_at,
          active_seconds, resume_count, outcome, verdict_sequence, diff_class_sequence,
          submissions, runs, self_authored_tests, statement_revisits, language,
          max_assistance_level, intervention_count, solution_revealed,
          independence_weight, struggle_class, event_count, reducer_version,
          skill_id, attributions, attributed_failures,
          statement_revisits_after_failure, reduced_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14,$15,$16,
               $17,$18,$19,$20,$21,$22,$23,$24,$25::jsonb,$26,$27, now())
       on conflict (episode_id) do update set
         closed_at = excluded.closed_at,
         active_seconds = excluded.active_seconds,
         resume_count = excluded.resume_count,
         outcome = excluded.outcome,
         verdict_sequence = excluded.verdict_sequence,
         diff_class_sequence = excluded.diff_class_sequence,
         submissions = excluded.submissions,
         runs = excluded.runs,
         self_authored_tests = excluded.self_authored_tests,
         statement_revisits = excluded.statement_revisits,
         language = excluded.language,
         max_assistance_level = excluded.max_assistance_level,
         intervention_count = excluded.intervention_count,
         solution_revealed = excluded.solution_revealed,
         independence_weight = excluded.independence_weight,
         struggle_class = excluded.struggle_class,
         event_count = excluded.event_count,
         reducer_version = excluded.reducer_version,
         skill_id = excluded.skill_id,
         attributions = excluded.attributions,
         attributed_failures = excluded.attributed_failures,
         statement_revisits_after_failure = excluded.statement_revisits_after_failure,
         reduced_at = now()`,
      [
        row.episodeId, row.subjectId, row.taskRef, row.taskKind,
        e.opened_at, e.closed_at, e.active_seconds, e.resume_count, e.outcome,
        JSON.stringify(e.verdict_sequence), JSON.stringify(e.diff_class_sequence),
        e.submissions, e.runs, e.self_authored_tests, e.statement_revisits, e.language,
        e.max_assistance_level, e.intervention_count, e.solution_revealed,
        e.independence_weight, e.struggle_class, e.event_count, e.reducer_version,
        e.skill_id,
        JSON.stringify(e.attributions),
        e.attributed_failures,
        e.statement_revisits_after_failure,
      ],
    );
  }

  /* --- L3: assistance --------------------------------------------------- */

  /**
   * Write the reducer's view of an intervention.
   *
   * `do update` rather than `do nothing`, and the difference matters: the hint
   * route writes a row the moment a hint is granted so the ladder can read
   * `lastGrantedLevel` back on the next request, and that row necessarily has
   * empty `pre_*` columns — it is written before the episode is reduced. With
   * `do nothing`, that placeholder won permanently and the counterfactual
   * anchor every intervention outcome is measured against stayed blank.
   *
   * The identity columns are deliberately not in the update list: an
   * intervention cannot change subject, episode, level or trigger after the
   * fact, and letting a later write move them would make the ledger editable.
   */
  async upsertInterventions(rows: readonly InterventionRow[]): Promise<void> {
    if (rows.length === 0) return;
    await this.sql.tx(async (t) => {
      for (const r of rows) {
        await t.query(
          `insert into interventions
             (intervention_id, subject_id, episode_id, kind, level, trigger, mode,
              pre_attempts, pre_runs, pre_active_seconds, pre_last_verdict,
              pre_diff_class, pre_code_hash, evidence_type, contains_code,
              content_len, delivered_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           on conflict (intervention_id) do update set
             pre_attempts = excluded.pre_attempts,
             pre_runs = excluded.pre_runs,
             pre_active_seconds = excluded.pre_active_seconds,
             pre_last_verdict = excluded.pre_last_verdict,
             pre_diff_class = excluded.pre_diff_class,
             pre_code_hash = excluded.pre_code_hash,
             evidence_type = excluded.evidence_type,
             content_len = excluded.content_len`,
          [
            r.intervention_id, r.subject_id, r.episode_id, r.kind, r.level, r.trigger,
            r.mode, r.pre_attempts, r.pre_runs, r.pre_active_seconds, r.pre_last_verdict,
            r.pre_diff_class, r.pre_code_hash, r.evidence_type, r.contains_code,
            r.content_len, r.delivered_at,
          ],
        );
      }
    });
  }

  async upsertOutcomes(rows: readonly ComputedOutcome[]): Promise<void> {
    if (rows.length === 0) return;
    await this.sql.tx(async (t) => {
      for (const o of rows) {
        await t.query(
          `insert into intervention_outcomes
             (intervention_id, window_spec, outcome, post_diff_class,
              delta_tests_passed, seconds_to_outcome, reducer_version)
           values ($1,$2,$3,$4,$5,$6,$7)
           on conflict (intervention_id) do update set
             outcome = excluded.outcome,
             post_diff_class = excluded.post_diff_class,
             delta_tests_passed = excluded.delta_tests_passed,
             seconds_to_outcome = excluded.seconds_to_outcome,
             reducer_version = excluded.reducer_version,
             computed_at = now()`,
          [
            o.intervention_id, o.window_spec, o.outcome, o.post_diff_class,
            o.delta_tests_passed, o.seconds_to_outcome, o.reducer_version,
          ],
        );
      }
    });
  }

  /** Interventions for one subject, in the shape `computeInterventionOutcome` wants. */
  async interventionsForSubject(subjectId: string): Promise<InterventionRow[]> {
    const r = await this.sql.query<Record<string, unknown>>(
      `select * from interventions where subject_id = $1 order by delivered_at asc`,
      [subjectId],
    );
    return r.rows.map((row) => ({
      intervention_id: row.intervention_id as string,
      subject_id: row.subject_id as string,
      episode_id: row.episode_id as string,
      kind: row.kind as string,
      level: row.level === null ? null : Number(row.level),
      trigger: row.trigger as string,
      mode: (row.mode as string) ?? null,
      pre_attempts: Number(row.pre_attempts),
      pre_runs: Number(row.pre_runs),
      pre_active_seconds: Number(row.pre_active_seconds),
      pre_last_verdict: (row.pre_last_verdict as string) ?? null,
      pre_diff_class: (row.pre_diff_class as string) ?? null,
      pre_code_hash: (row.pre_code_hash as string) ?? null,
      pre_tests_passed: null,
      evidence_type: (row.evidence_type as string) ?? null,
      contains_code: Boolean(row.contains_code),
      content_len: Number(row.content_len),
      delivered_at: toIso(row.delivered_at as string),
    }));
  }

  /* --- L4: learner state ------------------------------------------------ */

  /**
   * Everything `buildLearnerState` needs, assembled from the projections.
   *
   * The `skill` field carries the rule that keeps ungraded work out of the
   * model: an episode with no verdict has no skill, so it contributes no
   * attempt. See `episodeInputs.ts` — dropping that rule is the one-line change
   * that would tell a child they are struggling at work nobody marked.
   */
  async episodeInputsFor(subjectId: string): Promise<EpisodeInput[]> {
    const eps = await this.sql.query<Record<string, unknown>>(
      `select * from attempt_episodes where subject_id = $1 order by opened_at asc`,
      [subjectId],
    );
    const outcomes = await this.sql.query<Record<string, unknown>>(
      `select o.*, i.episode_id from intervention_outcomes o
         join interventions i on i.intervention_id = o.intervention_id
        where i.subject_id = $1`,
      [subjectId],
    );

    const byEpisode = new Map<string, ComputedOutcome[]>();
    for (const o of outcomes.rows) {
      const key = o.episode_id as string;
      const list = byEpisode.get(key) ?? [];
      list.push({
        intervention_id: o.intervention_id as string,
        window_spec: o.window_spec as string,
        outcome: o.outcome as ComputedOutcome["outcome"],
        post_diff_class: (o.post_diff_class as string) ?? null,
        delta_tests_passed: o.delta_tests_passed === null ? null : Number(o.delta_tests_passed),
        seconds_to_outcome: o.seconds_to_outcome === null ? null : Number(o.seconds_to_outcome),
        reducer_version: Number(o.reducer_version),
      });
      byEpisode.set(key, list);
    }

    return eps.rows.map((row) => {
      const reduced = rowToReducedEpisode(row);
      return {
        episodeId: row.episode_id as string,
        skill: reduced.skill_id,
        taskRef: row.task_ref as string,
        episode: reduced,
        outcomes: byEpisode.get(row.episode_id as string) ?? [],
      };
    });
  }

  async putLearnerState(subjectId: string, state: LearnerState): Promise<void> {
    await this.sql.tx(async (t) => {
      await t.query(
        `insert into learner_state
           (subject_id, episodes, interventions, hint_dependency,
            median_seconds_to_first_hint, transfer_solves,
            intervention_outcome_counts, unattributed_failures,
            attributed_failures, state_version, computed_at)
         values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10, now())
         on conflict (subject_id) do update set
           episodes = excluded.episodes,
           interventions = excluded.interventions,
           hint_dependency = excluded.hint_dependency,
           median_seconds_to_first_hint = excluded.median_seconds_to_first_hint,
           transfer_solves = excluded.transfer_solves,
           intervention_outcome_counts = excluded.intervention_outcome_counts,
           unattributed_failures = excluded.unattributed_failures,
           attributed_failures = excluded.attributed_failures,
           state_version = excluded.state_version,
           computed_at = now()`,
        [
          subjectId,
          state.episodes,
          state.assistance.interventions,
          state.assistance.hintDependency,
          state.assistance.medianSecondsToFirstHint,
          state.assistance.transferSolves,
          JSON.stringify(state.assistance.outcomeCounts ?? {}),
          state.unattributedFailures,
          state.skills.reduce((n, s) => n + s.attributedFailures, 0),
          state.version,
        ],
      );

      // Skill rows are replaced wholesale rather than merged: the state is a
      // projection, and a skill that stopped appearing must stop being claimed.
      await t.query(`delete from learner_skill_state where subject_id = $1`, [subjectId]);
      for (const s of state.skills) {
        await t.query(
          `insert into learner_skill_state
             (subject_id, skill_id, level, attempts, solved, solo_solved,
              assisted_solved, failures, attributed_failures, distinct_tasks,
              misconceptions, rationale, state_version, computed_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13, now())`,
          [
            subjectId, s.skill, s.level, s.attempts, s.solved, s.soloSolved,
            s.assistedSolved, s.failures, s.attributedFailures, s.distinctTasks,
            JSON.stringify(s.misconceptions), s.rationale, state.version,
          ],
        );
      }
    });
  }

  async getLearnerState(
    subjectId: string,
  ): Promise<{ state: LearnerState; computedAt: string } | null> {
    const head = await this.sql.query<Record<string, unknown>>(
      `select * from learner_state where subject_id = $1`,
      [subjectId],
    );
    if (head.rows.length === 0) return null;
    const h = head.rows[0];

    const skills = await this.sql.query<Record<string, unknown>>(
      `select * from learner_skill_state where subject_id = $1 order by skill_id asc`,
      [subjectId],
    );

    const state: LearnerState = {
      subject: subjectId,
      episodes: Number(h.episodes),
      skills: skills.rows.map(rowToSkillState),
      assistance: {
        interventions: Number(h.interventions),
        /* The column is nullable and the type is not, and that gap is real:
           the migration's comment says a learner who never solves "has no
           dependency reading rather than a zero one", which is a distinction
           `AssistanceProfile.hintDependency: number` cannot express. The core
           only ever emits a number, so a null here can only have come from
           somewhere else; it reads as 0 and the type stays honest. */
        hintDependency: h.hint_dependency === null ? 0 : Number(h.hint_dependency),
        medianSecondsToFirstHint:
          h.median_seconds_to_first_hint === null ? null : Number(h.median_seconds_to_first_hint),
        transferSolves: Number(h.transfer_solves),
        outcomeCounts: (h.intervention_outcome_counts ?? {}) as never,
      },
      unattributedFailures: Number(h.unattributed_failures),
      version: Number(h.state_version),
    };

    return { state, computedAt: toIso(h.computed_at as string) };
  }

  /* --- Nova ladder ------------------------------------------------------
     Derived on the server from the ledger, never accepted from a client. A
     browser that could name its own last hint level could name level 4. */

  async lastGrantedLevel(episodeId: string): Promise<number> {
    const r = await this.sql.query<{ level: number | null }>(
      `select max(level) as level from interventions where episode_id = $1`,
      [episodeId],
    );
    const v = r.rows[0]?.level;
    return v === null || v === undefined ? -1 : Number(v);
  }

  async lastHintAt(episodeId: string): Promise<string | null> {
    const r = await this.sql.query<{ at: string | null }>(
      `select max(delivered_at) as at from interventions where episode_id = $1`,
      [episodeId],
    );
    const v = r.rows[0]?.at;
    return v ? toIso(v) : null;
  }

  /**
   * Record what the engine decided, so the decision can be argued with later.
   *
   * Migration 0006 creates `learning_actions` and says exactly why: *"the
   * decision engine is unfalsifiable without this. It would issue DIAGNOSE
   * forever to a learner it never learns anything about and nothing would
   * notice."* Nothing wrote the table. `runSweep` computed a decision per
   * subject and every caller discarded it.
   *
   * ## Why one row per decision would be wrong
   *
   * The sweep runs every twenty seconds. Writing a row each time would put
   * thousands of identical DIAGNOSE rows against one learner in an afternoon,
   * and the table's actual question — *what did the system decide, and what
   * happened next?* — would be unanswerable under the noise.
   *
   * So a decision is recorded only when it CHANGES. `issued_at` then means what
   * it says: the moment the system started believing this, which is the only
   * timestamp an outcome can sensibly be measured from.
   *
   * ## What this is not
   *
   * Not a source of truth. Events remain the evidence; this is a log of
   * conclusions drawn from them, and `buildLearnerState` never reads it back.
   * If the two ever disagree, the events are right.
   */
  async recordDecision(row: {
    actionId: string;
    subjectId: string;
    actionType: string;
    skillId: string | null;
    expectedOutcome: string;
    namedMisconception: string | null;
    reason: string;
    confidence: number;
    novaMode: string | null;
    maxHintLevel: number | null;
    engineVersion: number;
  }): Promise<boolean> {
    /* The most recent decision for this subject. Compared on the fields that
       change what Nova is allowed to do — not on `reason`, whose prose can be
       reworded by a core update without the decision itself having moved. */
    const prev = await this.sql.query<{
      action_type: string;
      skill_id: string | null;
      named_misconception: string | null;
      max_hint_level: number | null;
    }>(
      `select action_type, skill_id, named_misconception, max_hint_level
         from learning_actions
        where subject_id = $1
        order by issued_at desc
        limit 1`,
      [row.subjectId],
    );

    const last = prev.rows[0];
    if (
      last &&
      last.action_type === row.actionType &&
      (last.skill_id ?? null) === row.skillId &&
      (last.named_misconception ?? null) === row.namedMisconception &&
      (last.max_hint_level ?? null) === row.maxHintLevel
    ) {
      return false;
    }

    await this.sql.query(
      `insert into learning_actions
         (action_id, subject_id, action_type, skill_id, expected_outcome,
          named_misconception, reason, confidence, nova_mode, max_hint_level,
          engine_version)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (action_id) do nothing`,
      [
        row.actionId, row.subjectId, row.actionType, row.skillId,
        row.expectedOutcome, row.namedMisconception, row.reason,
        /* The column is `check (confidence between 0 and 1)`. A core that ever
           returned something outside that would fail the whole sweep for one
           learner rather than record a slightly wrong number, so it is clamped
           here — the decision is what matters, not its second decimal. */
        Math.min(1, Math.max(0, row.confidence)),
        row.novaMode, row.maxHintLevel, row.engineVersion,
      ],
    );
    return true;
  }

  /** The decisions on record for one learner, newest first. For the dev lab. */
  async decisionsFor(subjectId: string, limit = 20): Promise<
    {
      actionId: string;
      actionType: string;
      skillId: string | null;
      namedMisconception: string | null;
      confidence: number;
      issuedAt: string;
    }[]
  > {
    const r = await this.sql.query<Record<string, unknown>>(
      `select action_id, action_type, skill_id, named_misconception,
              confidence, issued_at
         from learning_actions
        where subject_id = $1
        order by issued_at desc
        limit $2`,
      [subjectId, limit],
    );
    return r.rows.map((x) => ({
      actionId: x.action_id as string,
      actionType: x.action_type as string,
      skillId: (x.skill_id as string) ?? null,
      namedMisconception: (x.named_misconception as string) ?? null,
      confidence: Number(x.confidence),
      issuedAt: toIso(x.issued_at),
    }));
  }

  async recordIntervention(row: {
    interventionId: string;
    subjectId: string;
    episodeId: string;
    kind: string;
    level: number | null;
    trigger: string;
    mode: string | null;
    containsCode: boolean;
    contentLen: number;
  }): Promise<void> {
    await this.sql.query(
      `insert into interventions
         (intervention_id, subject_id, episode_id, kind, level, trigger, mode,
          contains_code, content_len)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (intervention_id) do nothing`,
      [
        row.interventionId, row.subjectId, row.episodeId, row.kind, row.level,
        row.trigger, row.mode, row.containsCode, row.contentLen,
      ],
    );
  }

  /**
   * Activity, bucketed. The only query behind every number a learner sees.
   *
   * `/you` reads it for the chart and the tiles; `/api/learning/state/me` reads
   * the same window for the home rail. There used to be a second method that
   * computed "this week" its own way with only a start bound — two functions
   * both claiming to know when the week started, which is a disagreement
   * waiting to happen. There is one now, and the window is half-open.
   *
   * One row per bucket that has episodes; buckets with none are simply absent
   * and the caller fills the window's shape. Doing it that way round means an
   * empty week produces an empty array rather than seven rows of invented
   * zeroes that read like measurements.
   *
   * `solvedSolo` counts accepted episodes where assistance was never requested
   * (`max_assistance_level < 0`), which is the same rule the independence
   * weight uses. Level 0 is still assistance: a hint taken and then a correct
   * answer is `solvedAssisted` — worth showing, never counted as solo.
   */
  async activityBuckets(
    subjectId: string,
    fromIso: string,
    toIso: string,
    grain: "day" | "month",
  ): Promise<ActivityBucket[]> {
    const fmt = grain === "day" ? "YYYY-MM-DD" : "YYYY-MM";
    const r = await this.sql.query<{
      bucket: string;
      attempted: number;
      solved_solo: number;
      solved_assisted: number;
      secs: number;
      helped: number;
    }>(
      `select to_char(opened_at at time zone 'UTC', $4)                        as bucket,
              count(*)::int                                                    as attempted,
              count(*) filter (
                where outcome = 'accepted' and max_assistance_level < 0
              )::int                                                           as solved_solo,
              count(*) filter (
                where outcome = 'accepted' and max_assistance_level >= 0
              )::int                                                           as solved_assisted,
              coalesce(sum(active_seconds), 0)::int                            as secs,
              coalesce(sum(intervention_count), 0)::int                        as helped
         from attempt_episodes
        where subject_id = $1
          and opened_at >= $2
          and opened_at <  $3
        group by 1
        order by 1`,
      [subjectId, fromIso, toIso, fmt],
    );

    return r.rows.map((x) => ({
      bucket: x.bucket,
      attempted: Number(x.attempted),
      solvedSolo: Number(x.solved_solo),
      solvedAssisted: Number(x.solved_assisted),
      activeSeconds: Number(x.secs),
      helpRequests: Number(x.helped),
    }));
  }

  /* --- lesson completions ------------------------------------------------
     The one record here that is NOT recomputable from the ledger: reaching the
     end of a lesson is not an event, so it is written when it happens or it is
     never knowable. See migration 0010. */

  /**
   * Record a finished lesson. Returns true when this was the first time.
   *
   * `do nothing`, never `do update`: the first completion is the fact a school
   * cares about, and a replay must not be able to rewrite the counts of the
   * pass that actually happened. Every later attempt is still in
   * `learning_events` in full, so nothing is lost by refusing.
   *
   * `returning` rather than `rowCount`, because what an INSERT with a swallowed
   * conflict reports for affected rows differs between drivers, and this is the
   * kind of value that silently becomes always-true.
   */
  async recordLessonCompletion(row: {
    subjectId: string;
    lessonId: string;
    correct: number;
    wrong: number;
    unmeasured: number;
    attempts: number;
    /**
     * Which rule admitted this row — see migration 0015. Optional only so a
     * caller predating the policy still compiles; the route always supplies it,
     * because it cannot reach the write without having evaluated one.
     */
    policyId?: string;
  }): Promise<boolean> {
    const r = await this.sql.query<{ lesson_id: string }>(
      `insert into lesson_completions
         (subject_id, lesson_id, correct, wrong, unmeasured, attempts, policy_id)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (subject_id, lesson_id) do nothing
       returning lesson_id`,
      [
        row.subjectId, row.lessonId, row.correct, row.wrong, row.unmeasured,
        row.attempts, row.policyId ?? null,
      ],
    );
    return r.rows.length > 0;
  }

  /** Every lesson this learner has finished, most recent first. */
  async completionsForSubject(subjectId: string): Promise<LessonCompletion[]> {
    const r = await this.sql.query<{
      lesson_id: string;
      correct: number;
      wrong: number;
      unmeasured: number;
      attempts: number;
      completed_at: string;
      policy_id: string | null;
    }>(
      `select lesson_id, correct, wrong, unmeasured, attempts, completed_at, policy_id
         from lesson_completions
        where subject_id = $1
        order by completed_at desc`,
      [subjectId],
    );
    return r.rows.map((row) => ({
      lessonId: row.lesson_id,
      correct: Number(row.correct),
      wrong: Number(row.wrong),
      unmeasured: Number(row.unmeasured),
      attempts: Number(row.attempts),
      completedAt: toIso(row.completed_at),
      policyId: row.policy_id ?? null,
    }));
  }

  /* --- post-help explanation ---------------------------------------------
     «Кез келген көмектен соң оқушы шешімді өз сөзімен түсіндіруге міндетті».
     The gate lives in `schools/learning/post-help.ts`; this is only storage,
     and it is storage with nowhere to put a grade. See migration 0016. */

  /**
   * The assistance context for an episode: how far up the ladder it went, and
   * which intervention took it there.
   *
   * `lastGrantedLevel` above answers the first half and is what the ladder
   * reads back. This answers both, because the explanation row records WHICH
   * intervention made the explanation owed — a level with no intervention id is
   * a number a teacher cannot trace back to anything.
   */
  async lastIntervention(
    episodeId: string,
  ): Promise<{ interventionId: string; level: number } | null> {
    const r = await this.sql.query<{ intervention_id: string; level: number | null }>(
      `select intervention_id, level
         from interventions
        where episode_id = $1 and level is not null
        order by level desc, delivered_at desc
        limit 1`,
      [episodeId],
    );
    const row = r.rows[0];
    if (!row || row.level === null) return null;
    return { interventionId: row.intervention_id, level: Number(row.level) };
  }

  /**
   * Record one explanation. Returns true when this was the first.
   *
   * `do nothing`, never `do update` — the same rule as `recordLessonCompletion`
   * and for a sharper reason: the first answer is the one given while the help
   * was fresh, and a later pass silently rewriting it would change text a
   * teacher may already have read.
   */
  async recordPostHelpExplanation(row: {
    subjectId: string;
    episodeId: string;
    blockId: string;
    assistanceLevel: number;
    interventionId: string | null;
    response: string | null;
    status: PostHelpStatus;
  }): Promise<boolean> {
    const r = await this.sql.query<{ block_id: string }>(
      `insert into post_help_explanations
         (subject_id, episode_id, block_id, assistance_level, intervention_id, response, status)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (subject_id, episode_id, block_id) do nothing
       returning block_id`,
      [
        row.subjectId, row.episodeId, row.blockId, row.assistanceLevel,
        row.interventionId, row.response, row.status,
      ],
    );
    return r.rows.length > 0;
  }

  /** The explanation for one task, or null if the learner has not given one. */
  async postHelpExplanation(
    subjectId: string,
    episodeId: string,
    blockId: string,
  ): Promise<PostHelpExplanation | null> {
    const r = await this.sql.query<PostHelpRow>(
      `select episode_id, block_id, assistance_level, intervention_id, response, status, created_at
         from post_help_explanations
        where subject_id = $1 and episode_id = $2 and block_id = $3`,
      [subjectId, episodeId, blockId],
    );
    const row = r.rows[0];
    return row ? toPostHelp(row) : null;
  }

  /** Everything this learner has explained, most recent first. */
  async postHelpExplanationsForSubject(subjectId: string): Promise<PostHelpExplanation[]> {
    const r = await this.sql.query<PostHelpRow>(
      `select episode_id, block_id, assistance_level, intervention_id, response, status, created_at
         from post_help_explanations
        where subject_id = $1
        order by created_at desc`,
      [subjectId],
    );
    return r.rows.map(toPostHelp);
  }

  /* --- error dictionary --------------------------------------------------
     «Жеке қателер журналы» (PDF). The mistakes are read from the ledger; the
     entries are what the learner chose to keep. See migration 0011. */

  /**
   * Wrong answers whose cause the curriculum author actually established.
   *
   * Read from `learning_events` rather than from `attempt_episodes`, because
   * the ledger is the source of truth and the projection only exists once the
   * reducer has swept. A learner who finished a lesson thirty seconds ago must
   * see their own mistake, not wait for a sweep.
   *
   * The join exists because a `failure_attributed` payload carries the failure
   * class and the skill but not the task — `task_ref` is written on
   * `episode_opened`. The subquery collapses that to one row per episode first,
   * and that is load-bearing: the submit route writes an `episode_opened` on
   * EVERY attempt at the same episode id, so joining the two event streams
   * directly multiplies three retries into nine and reports a mistake as having
   * happened three times as often as it did.
   *
   * `attribution_source` is filtered, not `failure_class`. Every wrong answer
   * produces an attribution — that is what keeps the unexplained-failure
   * denominator honest — and only the ones the author explained may become an
   * entry.
   */
  async attributedMistakes(subjectId: string): Promise<AttributedMistake[]> {
    const r = await this.sql.query<{
      task_ref: string;
      failure_class: string;
      occurrences: number;
      last_at: string;
    }>(
      `with opened as (
         select episode_id, min(payload ->> 'task_ref') as task_ref
           from learning_events
          where subject_id = $1
            and event_name = 'episode_opened'
            and episode_id is not null
          group by episode_id
       )
       select o.task_ref                       as task_ref,
              f.payload ->> 'failure_class'    as failure_class,
              count(*)::int                    as occurrences,
              max(f.received_at)               as last_at
         from learning_events f
         join opened o on o.episode_id = f.episode_id
        where f.subject_id = $1
          and f.event_name = 'failure_attributed'
          and f.payload ->> 'attribution_source' = 'curriculum_diagnostic_mapping'
          and o.task_ref is not null
        group by 1, 2
        order by count(*) desc, max(f.received_at) desc`,
      [subjectId],
    );
    return r.rows.map((row) => ({
      taskRef: row.task_ref,
      failureClass: row.failure_class,
      occurrences: Number(row.occurrences),
      lastAt: toIso(row.last_at),
    }));
  }

  async errorDictionary(subjectId: string): Promise<SavedErrorEntry[]> {
    const r = await this.sql.query<{
      block_id: string;
      failure_class: string;
      note: string | null;
      created_at: string;
    }>(
      `select block_id, failure_class, note, created_at
         from learner_error_dictionary
        where subject_id = $1
        order by created_at desc`,
      [subjectId],
    );
    return r.rows.map((row) => ({
      blockId: row.block_id,
      failureClass: row.failure_class,
      note: row.note,
      createdAt: toIso(row.created_at),
    }));
  }

  /**
   * Save an entry, or add words to one that already exists.
   *
   * `coalesce(excluded.note, …)` rather than a plain overwrite: pressing save a
   * second time without typing anything must not erase what the learner wrote
   * the first time. `created_at` is left alone — the entry was made when it was
   * made, and a re-save is not a new mistake.
   *
   * The caller is responsible for having proved that this subject actually made
   * this mistake. `/api/learning/dictionary` does that structurally: an entry
   * can only be named by a handle derived from that learner's own ledger.
   */
  async saveErrorEntry(row: {
    subjectId: string;
    blockId: string;
    failureClass: string;
    note: string | null;
  }): Promise<void> {
    await this.sql.query(
      `insert into learner_error_dictionary (subject_id, block_id, failure_class, note)
       values ($1,$2,$3,$4)
       on conflict (subject_id, block_id, failure_class) do update set
         note = coalesce(excluded.note, learner_error_dictionary.note)`,
      [row.subjectId, row.blockId, row.failureClass, row.note],
    );
  }

  /* --- completion evidence ----------------------------------------------
     What the ledger can prove a learner did with a set of blocks. Read by
     `/api/learning/complete` so the completion policy is evaluated against
     recorded facts rather than against a summary the browser posted. See
     `schools/policies/completion.ts`. */

  /**
   * Per-block attempt evidence, for the blocks named.
   *
   * Matched on the SUFFIX of `task_ref` rather than on the whole string,
   * because the prefix is not one thing: `gradeBlock` writes
   * `sx-assessment:…` while `taskRef()` writes `sx-assess:…`, and a completion
   * check that silently missed every assessment block would look exactly like a
   * learner who had not done the check. The block id is the part both agree on.
   *
   * `verdicts` is a count of `verdict_received` ROWS, and one attempt can write
   * several of them — success credits every skill the task exercises, one event
   * per skill. Nothing here divides by it. The only questions asked of it are
   * "any?" and "any accepted?", both of which survive the multiplicity.
   */
  async blockAttempts(
    subjectId: string,
    blockIds: readonly string[],
  ): Promise<Map<string, BlockAttemptEvidence>> {
    const out = new Map<string, BlockAttemptEvidence>();
    if (blockIds.length === 0) return out;

    /* Placeholders rather than `= any($2)`. The array form depends on the
       driver inferring a Postgres array type from a JavaScript array, and this
       store runs against two drivers; a list of ids that is never longer than a
       lesson does not need the cleverness. */
    const holes = blockIds.map((_, i) => `$${i + 2}`).join(", ");
    const r = await this.sql.query<{
      block_id: string;
      submissions: number;
      verdicts: number;
      accepted: boolean;
    }>(
      `select split_part(payload ->> 'task_ref', ':', 2)                       as block_id,
              count(*) filter (where event_name = 'episode_opened')::int       as submissions,
              count(*) filter (where event_name = 'verdict_received')::int     as verdicts,
              coalesce(bool_or(
                event_name = 'verdict_received' and payload ->> 'verdict' = 'accepted'
              ), false)                                                        as accepted
         from learning_events
        where subject_id = $1
          and event_name in ('episode_opened', 'verdict_received')
          and split_part(payload ->> 'task_ref', ':', 2) in (${holes})
        group by 1`,
      [subjectId, ...blockIds],
    );

    for (const row of r.rows) {
      out.set(row.block_id, {
        blockId: row.block_id,
        submissions: Number(row.submissions),
        verdicts: Number(row.verdicts),
        accepted: Boolean(row.accepted),
      });
    }
    return out;
  }

  /* --- delayed re-solve --------------------------------------------------
     The programme's fifth independence check (PDF p.6). See migration 0014 and
     `schools/policies/review.ts`. */

  /**
   * What one episode proves about how the task was solved.
   *
   * Both halves of the assistance record are used, and for different things:
   *
   *   * `assistance_delivered` in `learning_events` proves the help ARRIVED.
   *     The hint route writes `assistance_requested` up front and
   *     `assistance_delivered` only once tokens have actually reached the
   *     learner, so a provider outage does not get recorded as help the learner
   *     had.
   *   * `interventions.level` carries HOW MUCH. It is a real smallint column
   *     written server-side, which is why the level is read from there rather
   *     than cast out of a jsonb payload.
   *
   * Level is reported as -1 when nothing was delivered — the same sentinel
   * `attempt_episodes.max_assistance_level` uses, so the two cannot be read as
   * disagreeing. Writing 0 would claim a level-0 hint was given.
   */
  async solveEvidence(
    subjectId: string,
    episodeId: string,
  ): Promise<{ accepted: boolean; assistanceDelivered: boolean; assistanceLevel: number }> {
    const r = await this.sql.query<{ accepted: boolean; delivered: boolean }>(
      `select coalesce(bool_or(
                event_name = 'verdict_received' and payload ->> 'verdict' = 'accepted'
              ), false)                                        as accepted,
              coalesce(bool_or(event_name = 'assistance_delivered'), false) as delivered
         from learning_events
        where subject_id = $1 and episode_id = $2`,
      [subjectId, episodeId],
    );
    const accepted = Boolean(r.rows[0]?.accepted);
    const delivered = Boolean(r.rows[0]?.delivered);
    return {
      accepted,
      assistanceDelivered: delivered,
      assistanceLevel: delivered ? await this.lastGrantedLevel(episodeId) : -1,
    };
  }

  /**
   * Queue a re-solve. True when this call created it.
   *
   * `do nothing` on the natural key, so the submit route may call it on every
   * accepted verdict without a learner who re-runs a task collecting a review
   * per run. False is a correct, ordinary outcome and not an error.
   */
  async scheduleReview(row: {
    subjectId: string;
    blockId: string;
    reason: "solved_with_assistance" | "independent_milestone";
    originEpisodeId: string;
    originAt: string;
    originLevel: number;
    dueAt: string;
    policyId: string;
  }): Promise<boolean> {
    const r = await this.sql.query<{ review_id: string }>(
      `insert into review_schedule
         (review_id, subject_id, block_id, reason, origin_level,
          origin_episode_id, origin_at, due_at, policy_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (subject_id, block_id, origin_episode_id) do nothing
       returning review_id`,
      [
        randomUUID(), row.subjectId, row.blockId, row.reason, row.originLevel,
        row.originEpisodeId, row.originAt, row.dueAt, row.policyId,
      ],
    );
    return r.rows.length > 0;
  }

  /** Everything queued for this learner that has fallen due and is not finished. */
  async dueReviews(subjectId: string, nowIso: string, limit = 50): Promise<ReviewRow[]> {
    const r = await this.sql.query<Record<string, unknown>>(
      `select * from review_schedule
        where subject_id = $1 and completed_at is null and due_at <= $2
        order by due_at asc
        limit $3`,
      [subjectId, nowIso, limit],
    );
    return r.rows.map(rowToReview);
  }

  /** Queued but not yet due. Shown as "coming", never counted as work waiting. */
  async pendingReviews(subjectId: string, nowIso: string, limit = 50): Promise<ReviewRow[]> {
    const r = await this.sql.query<Record<string, unknown>>(
      `select * from review_schedule
        where subject_id = $1 and completed_at is null and due_at > $2
        order by due_at asc
        limit $3`,
      [subjectId, nowIso, limit],
    );
    return r.rows.map(rowToReview);
  }

  /** One review, scoped to its owner. There is no lookup by id alone. */
  async reviewFor(subjectId: string, reviewId: string): Promise<ReviewRow | null> {
    const r = await this.sql.query<Record<string, unknown>>(
      `select * from review_schedule where subject_id = $1 and review_id = $2`,
      [subjectId, reviewId],
    );
    return r.rows[0] ? rowToReview(r.rows[0]) : null;
  }

  /**
   * Open a review, binding it to a FRESH episode.
   *
   * `coalesce` rather than a plain assignment, and that is the important part:
   * a learner who reloads the review page gets the SAME episode back instead of
   * a second one. Minting a new episode per visit would fragment one re-solve
   * into several, each with no attempt behind it — so the hint ladder would
   * reset mid-task and the independence measurement would be taken over a
   * fraction of the work.
   *
   * The episode id is generated by the CALLER on the server and never accepted
   * from a browser. `review_schedule_fresh_episode` refuses one equal to the
   * original, so the reset cannot be undone by a mistake in a route.
   */
  async startReview(
    subjectId: string,
    reviewId: string,
    episodeId: string,
  ): Promise<ReviewRow | null> {
    const r = await this.sql.query<Record<string, unknown>>(
      `update review_schedule
          set review_episode_id = coalesce(review_episode_id, $3),
              started_at        = coalesce(started_at, now())
        where subject_id = $1 and review_id = $2 and completed_at is null
        returning *`,
      [subjectId, reviewId, episodeId],
    );
    return r.rows[0] ? rowToReview(r.rows[0]) : null;
  }

  /**
   * Settle a review. True when this call closed it.
   *
   * The outcome is decided by the caller from the review episode's own ledger,
   * never from anything the browser asserts — which is why there is no
   * `resolved` boolean on the wire for this.
   */
  async completeReview(
    subjectId: string,
    reviewId: string,
    outcome: ReviewOutcome,
  ): Promise<boolean> {
    const r = await this.sql.query<{ review_id: string }>(
      `update review_schedule
          set completed_at = now(), outcome = $3
        where subject_id = $1 and review_id = $2 and completed_at is null
        returning review_id`,
      [subjectId, reviewId, outcome],
    );
    return r.rows.length > 0;
  }

  /* --- school scoping ----------------------------------------------------
     Every teacher-facing read goes through here. There is deliberately no
     method that returns subjects without a class, because the shipped
     alternative — a flat `SOLVEX_ADMIN_USER_IDS` allowlist — grants one person
     every child in the database, which is exactly the access model a school
     cannot accept. */

  async putSubjectScope(scope: {
    subjectId: string;
    schoolId: string;
    classId: string;
  }): Promise<void> {
    await this.sql.query(
      `insert into school_subject_scope (subject_id, school_id, class_id, created_at)
       values ($1, $2, $3, now())
       on conflict (subject_id) do update set
         school_id = excluded.school_id, class_id = excluded.class_id`,
      [scope.subjectId, scope.schoolId, scope.classId],
    );
  }

  async getSubjectScope(
    subjectId: string,
  ): Promise<{ schoolId: string; classId: string } | null> {
    const r = await this.sql.query<{ school_id: string; class_id: string }>(
      `select school_id, class_id from school_subject_scope where subject_id = $1`,
      [subjectId],
    );
    if (r.rows.length === 0) return null;
    return { schoolId: r.rows[0].school_id, classId: r.rows[0].class_id };
  }

  async subjectsInClass(classId: string): Promise<string[]> {
    const r = await this.sql.query<{ subject_id: string }>(
      `select subject_id from school_subject_scope where class_id = $1 order by created_at asc`,
      [classId],
    );
    return r.rows.map((row) => row.subject_id);
  }

  /**
   * Is this subject inside this class?
   *
   * The single check every teacher route makes before returning anything. A
   * route that forgets it is a route that hands a teacher another school's
   * child, so it is one call rather than a pattern to remember.
   */
  async isInClass(subjectId: string, classId: string): Promise<boolean> {
    const r = await this.sql.query<{ n: number }>(
      `select count(*)::int as n from school_subject_scope
        where subject_id = $1 and class_id = $2`,
      [subjectId, classId],
    );
    return r.rows[0].n > 0;
  }

  /** Learner states for a whole class, in one round trip. */
  async learnerStatesForClass(
    classId: string,
  ): Promise<{ subjectId: string; state: LearnerState; computedAt: string }[]> {
    const subjects = await this.subjectsInClass(classId);
    const out: { subjectId: string; state: LearnerState; computedAt: string }[] = [];
    for (const subjectId of subjects) {
      const s = await this.getLearnerState(subjectId);
      if (s) out.push({ subjectId, state: s.state, computedAt: s.computedAt });
    }
    return out;
  }

  /** Last activity per subject, for the "no activity" signal. */
  async lastActivityForClass(classId: string): Promise<Map<string, string>> {
    const r = await this.sql.query<{ subject_id: string; at: string }>(
      `select e.subject_id, max(e.received_at) as at
         from learning_events e
         join school_subject_scope s on s.subject_id = e.subject_id
        where s.class_id = $1
        group by 1`,
      [classId],
    );
    return new Map(r.rows.map((row) => [row.subject_id, toIso(row.at)]));
  }

  /* --- ops -------------------------------------------------------------- */

  /**
   * Claim the sweep lease.
   *
   * One atomic statement, so exactly one of {interval, ingest hook, cron}
   * sweeps at a time and a crashed holder's lease expires rather than wedging
   * the reducer forever.
   */
  async claimReducerLease(owner: string, ttlSeconds: number): Promise<boolean> {
    const r = await this.sql.query<{ owner: string }>(
      `insert into reducer_lease (id, owner, expires_at)
       values ('sweep', $1, now() + make_interval(secs => $2))
       on conflict (id) do update set
         owner = excluded.owner,
         expires_at = excluded.expires_at
         where reducer_lease.expires_at < now()
       returning owner`,
      [owner, ttlSeconds],
    );
    return r.rows.length > 0 && r.rows[0].owner === owner;
  }

  async releaseReducerLease(owner: string): Promise<void> {
    await this.sql.query(
      `delete from reducer_lease where id = 'sweep' and owner = $1`,
      [owner],
    );
  }

  async lastSweepAt(): Promise<string | null> {
    const r = await this.sql.query<{ at: string | null }>(
      `select max(reduced_at) as at from attempt_episodes`,
    );
    return r.rows[0]?.at ? toIso(r.rows[0].at) : null;
  }

  /* --- L5: accounts, classes, enrolment, sessions ----------------------- */
  /*
   * Identity, added in migration 0012.
   *
   * Everything here is keyed on (school_id, ...) rather than on a bare id, and
   * that is not decoration: there is deliberately no query in this file that
   * can read across schools, so a bug in a route cannot become a cross-school
   * disclosure. The teacher-facing reads all join through `class_teachers`,
   * so "which class is this" and "may this person see it" are one question.
   */

  async findAccountByUsername(
    schoolId: string,
    username: string,
  ): Promise<(SchoolAccountRow & { passwordHash: string; passwordSalt: string }) | null> {
    const r = await this.sql.query<Record<string, unknown>>(
      `select user_id, school_id, role, username, display_name, must_change_password,
              password_hash, password_salt, disabled_at
         from school_accounts
        where school_id = $1 and lower(username) = lower($2)`,
      [schoolId, username],
    );
    const row = r.rows[0];
    if (!row) return null;
    return {
      ...rowToAccount(row),
      passwordHash: row.password_hash as string,
      passwordSalt: row.password_salt as string,
    };
  }

  async findAccountById(userId: string): Promise<SchoolAccountRow | null> {
    const r = await this.sql.query<Record<string, unknown>>(
      `select user_id, school_id, role, username, display_name, must_change_password, disabled_at
         from school_accounts where user_id = $1`,
      [userId],
    );
    return r.rows[0] ? rowToAccount(r.rows[0]) : null;
  }

  async createAccount(input: {
    schoolId: string;
    role: "student" | "teacher" | "admin";
    username: string;
    displayName: string;
    passwordHash: string;
    passwordSalt: string;
    mustChangePassword?: boolean;
  }): Promise<string> {
    const userId = randomUUID();
    await this.sql.query(
      `insert into school_accounts
         (user_id, school_id, role, username, display_name,
          password_hash, password_salt, must_change_password)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        userId,
        input.schoolId,
        input.role,
        input.username,
        input.displayName,
        input.passwordHash,
        input.passwordSalt,
        input.mustChangePassword ?? true,
      ],
    );
    return userId;
  }

  async setPassword(userId: string, hash: string, salt: string): Promise<void> {
    await this.sql.query(
      `update school_accounts
          set password_hash = $2, password_salt = $3, must_change_password = false
        where user_id = $1`,
      [userId, hash, salt],
    );
  }

  async markLogin(userId: string): Promise<void> {
    await this.sql.query(
      `update school_accounts set last_login_at = now() where user_id = $1`,
      [userId],
    );
  }

  async upsertClass(schoolId: string, classId: string, name: string): Promise<void> {
    await this.sql.query(
      `insert into school_classes (school_id, class_id, name) values ($1,$2,$3)
       on conflict (school_id, class_id) do update set name = excluded.name`,
      [schoolId, classId, name],
    );
  }

  async assignTeacher(schoolId: string, classId: string, userId: string): Promise<void> {
    await this.sql.query(
      `insert into class_teachers (school_id, class_id, user_id) values ($1,$2,$3)
       on conflict do nothing`,
      [schoolId, classId, userId],
    );
  }

  async enrol(schoolId: string, classId: string, userId: string): Promise<void> {
    await this.sql.query(
      `insert into class_enrolments (school_id, class_id, user_id) values ($1,$2,$3)
       on conflict (school_id, class_id, user_id) do update set withdrawn_at = null`,
      [schoolId, classId, userId],
    );
  }

  /** The classes this teacher actually teaches. The whole of their authority. */
  async classesForTeacher(userId: string): Promise<{ schoolId: string; classId: string; name: string }[]> {
    const r = await this.sql.query<Record<string, unknown>>(
      `select c.school_id, c.class_id, c.name
         from class_teachers t
         join school_classes c
           on c.school_id = t.school_id and c.class_id = t.class_id
        where t.user_id = $1 and c.archived_at is null
        order by c.class_id`,
      [userId],
    );
    return r.rows.map((row) => ({
      schoolId: row.school_id as string,
      classId: row.class_id as string,
      name: row.name as string,
    }));
  }

  async teachesClass(userId: string, schoolId: string, classId: string): Promise<boolean> {
    const r = await this.sql.query<{ n: number }>(
      `select count(*)::int as n from class_teachers
        where user_id = $1 and school_id = $2 and class_id = $3`,
      [userId, schoolId, classId],
    );
    return Number(r.rows[0]?.n ?? 0) > 0;
  }

  /* --- L6: curriculum publication (migration 0013) ---------------------- */

  /** Live approvals, newest first. A withdrawn one is not an approval. */
  async publications(): Promise<
    {
      monthIndex: number;
      curriculumHash: string;
      reviewerId: string;
      reviewerName: string;
      note: string | null;
      publishedAt: string;
    }[]
  > {
    const r = await this.sql.query<Record<string, unknown>>(
      `select p.month_index, p.curriculum_hash, p.reviewer_id,
              a.display_name as reviewer_name, p.note, p.published_at
         from curriculum_publications p
         join school_accounts a on a.user_id = p.reviewer_id
        where p.withdrawn_at is null
        order by p.published_at desc`,
    );
    return r.rows.map((row) => ({
      monthIndex: Number(row.month_index),
      curriculumHash: row.curriculum_hash as string,
      reviewerId: row.reviewer_id as string,
      reviewerName: row.reviewer_name as string,
      note: (row.note as string | null) ?? null,
      publishedAt: toIso(row.published_at),
    }));
  }

  /**
   * Record a human approval.
   *
   * The reviewer is a real account, checked by the caller to be a teacher or an
   * admin. There is no system reviewer and no way to omit one — approving
   * material for minors is not something a service account may do.
   */
  async publishCurriculum(input: {
    monthIndex: number;
    curriculumHash: string;
    reviewerId: string;
    note: string | null;
  }): Promise<string> {
    const id = randomUUID();
    await this.sql.query(
      `insert into curriculum_publications
         (publication_id, month_index, curriculum_hash, reviewer_id, note)
       values ($1,$2,$3,$4,$5)
       on conflict (month_index, curriculum_hash) where withdrawn_at is null do nothing`,
      [id, input.monthIndex, input.curriculumHash, input.reviewerId, input.note],
    );
    return id;
  }

  async withdrawCurriculum(monthIndex: number, byUserId: string): Promise<void> {
    await this.sql.query(
      `update curriculum_publications
          set withdrawn_at = now(), withdrawn_by = $2
        where month_index = $1 and withdrawn_at is null`,
      [monthIndex, byUserId],
    );
  }

  /** The classes a learner is enrolled in. One, for the pilot; the shape allows more. */
  async classesForLearner(userId: string): Promise<{ schoolId: string; classId: string }[]> {
    const r = await this.sql.query<Record<string, unknown>>(
      `select e.school_id, e.class_id
         from class_enrolments e
         join school_classes c
           on c.school_id = e.school_id and c.class_id = e.class_id
        where e.user_id = $1 and e.withdrawn_at is null and c.archived_at is null
        order by e.enrolled_at`,
      [userId],
    );
    return r.rows.map((row) => ({
      schoolId: row.school_id as string,
      classId: row.class_id as string,
    }));
  }

  /** Enrolled learners, with the display name a teacher needs to read the list. */
  async rosterForClass(
    schoolId: string,
    classId: string,
  ): Promise<{ userId: string; displayName: string; username: string }[]> {
    const r = await this.sql.query<Record<string, unknown>>(
      `select a.user_id, a.display_name, a.username
         from class_enrolments e
         join school_accounts a on a.user_id = e.user_id
        where e.school_id = $1 and e.class_id = $2
          and e.withdrawn_at is null and a.disabled_at is null
        order by a.display_name`,
      [schoolId, classId],
    );
    return r.rows.map((row) => ({
      userId: row.user_id as string,
      displayName: row.display_name as string,
      username: row.username as string,
    }));
  }

  /**
   * The learning subject behind an account.
   *
   * `learning_subjects.user_id` and the 'user_id' alias have existed since 0003
   * for exactly this. Binding through the alias — rather than minting a subject
   * per device — is what makes a learner who signs in on a second machine the
   * same person with the same year of history.
   */
  async resolveSubjectForUser(
    userId: string,
    scope: { schoolId: string; classId: string },
    cohort: Cohort = "public",
  ): Promise<string> {
    const existing = await this.sql.query<{ subject_id: string }>(
      `select subject_id from learning_subject_aliases
        where alias_kind = 'user_id' and alias_value = $1`,
      [userId],
    );
    if (existing.rows.length > 0) {
      const id = existing.rows[0].subject_id;
      await this.sql.query(
        `update learning_subjects set last_seen_at = now() where subject_id = $1`,
        [id],
      );
      await this.setSubjectScope(id, scope);
      return id;
    }

    const subjectId = randomUUID();
    await this.sql.tx(async (t) => {
      await t.query(
        `insert into learning_subjects (subject_id, user_id, cohort) values ($1,$2,$3)`,
        [subjectId, userId, cohort],
      );
      await t.query(
        `insert into learning_subject_aliases (alias_kind, alias_value, subject_id)
         values ('user_id', $1, $2)`,
        [userId, subjectId],
      );
    });
    await this.setSubjectScope(subjectId, scope);
    return subjectId;
  }

  async setSubjectScope(
    subjectId: string,
    scope: { schoolId: string; classId: string },
  ): Promise<void> {
    await this.sql.query(
      `insert into school_subject_scope (subject_id, school_id, class_id)
       values ($1,$2,$3)
       on conflict (subject_id) do update
         set school_id = excluded.school_id, class_id = excluded.class_id`,
      [subjectId, scope.schoolId, scope.classId],
    );
  }

  /* --- account preferences ------------------------------------------- */

  /**
   * The account's stored preference bag, or null if it has never been saved.
   *
   * `null` and `{}` are meaningfully different here: null means "this person
   * has never expressed a preference, so keep following whatever the browser
   * decided", and an empty object means "they saved, and everything is at its
   * default". Collapsing the two would make a deliberate reset look like an
   * absence and let a stale local value win over it.
   */
  async getPreferences(userId: string): Promise<Record<string, unknown> | null> {
    const r = await this.sql.query<{ prefs: unknown }>(
      `select prefs from account_preferences where user_id = $1`,
      [userId],
    );
    const row = r.rows[0];
    if (!row) return null;
    // PGlite hands back a parsed object; a wire driver may hand back text.
    return typeof row.prefs === "string"
      ? (JSON.parse(row.prefs) as Record<string, unknown>)
      : (row.prefs as Record<string, unknown>);
  }

  async putPreferences(userId: string, prefs: unknown): Promise<void> {
    await this.sql.query(
      `insert into account_preferences (user_id, prefs, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (user_id) do update
         set prefs = excluded.prefs, updated_at = now()`,
      [userId, JSON.stringify(prefs)],
    );
  }

  async createSession(userId: string, tokenHash: string, expiresAt: string): Promise<string> {
    const sessionId = randomUUID();
    await this.sql.query(
      `insert into school_sessions (session_id, token_hash, user_id, expires_at)
       values ($1,$2,$3,$4)`,
      [sessionId, tokenHash, userId, expiresAt],
    );
    return sessionId;
  }

  /**
   * Look a session up by the hash of its cookie.
   *
   * Expiry and revocation are in the WHERE clause rather than checked by the
   * caller, so there is no path where someone forgets. A revoked session reads
   * as no session at all.
   */
  async sessionByTokenHash(tokenHash: string): Promise<{ sessionId: string; userId: string } | null> {
    const r = await this.sql.query<Record<string, unknown>>(
      `select session_id, user_id from school_sessions
        where token_hash = $1 and revoked_at is null and expires_at > now()`,
      [tokenHash],
    );
    const row = r.rows[0];
    if (!row) return null;
    await this.sql.query(
      `update school_sessions set last_seen_at = now() where session_id = $1`,
      [row.session_id as string],
    );
    return { sessionId: row.session_id as string, userId: row.user_id as string };
  }

  async revokeSession(tokenHash: string): Promise<void> {
    await this.sql.query(
      `update school_sessions set revoked_at = now()
        where token_hash = $1 and revoked_at is null`,
      [tokenHash],
    );
  }

  /** Every session for a user. Used when a password changes. */
  async revokeAllSessions(userId: string): Promise<void> {
    await this.sql.query(
      `update school_sessions set revoked_at = now()
        where user_id = $1 and revoked_at is null`,
      [userId],
    );
  }

}

/* -------------------------------------------------------------------------- */

/** Postgres returns timestamps as Date under some drivers and string under others. */
export interface SchoolAccountRow {
  userId: string;
  schoolId: string;
  role: "student" | "teacher" | "admin";
  username: string;
  displayName: string;
  mustChangePassword: boolean;
  disabledAt: string | null;
}

function rowToAccount(row: Record<string, unknown>): SchoolAccountRow {
  return {
    userId: row.user_id as string,
    schoolId: row.school_id as string,
    role: row.role as SchoolAccountRow["role"],
    username: row.username as string,
    displayName: row.display_name as string,
    mustChangePassword: Boolean(row.must_change_password),
    disabledAt: row.disabled_at ? toIso(row.disabled_at) : null,
  };
}

interface PostHelpRow {
  episode_id: string;
  block_id: string;
  assistance_level: number;
  intervention_id: string | null;
  response: string | null;
  status: string;
  created_at: string;
}

/**
 * Row → domain object.
 *
 * `status` is cast rather than validated because the column carries a CHECK
 * constraint naming the three legal values — the database is the validator, and
 * a second one here would be a place for the two to disagree.
 */
function toPostHelp(row: PostHelpRow): PostHelpExplanation {
  return {
    episodeId: row.episode_id,
    blockId: row.block_id,
    assistanceLevel: Number(row.assistance_level),
    interventionId: row.intervention_id,
    response: row.response,
    status: row.status as PostHelpStatus,
    createdAt: toIso(row.created_at),
  };
}

/**
 * The event insert, shared by `appendEvents` and `appendEventsAndSettle`.
 *
 * Takes the executor rather than using `this.sql`, so the caller decides the
 * transaction. Nesting `tx` inside `tx` would be a second `BEGIN` on the PGlite
 * driver — a warning and a no-op, with the inner commit committing the outer
 * work — so the two entry points open exactly one transaction each and share
 * the body.
 *
 * `on conflict (event_id) do nothing` is the per-EVENT idempotency guarantee: a
 * retried beacon or a duplicated batch collapses to one row. It cannot collapse
 * a duplicated SUBMISSION, because a second call to the submit route mints
 * fresh event ids for the same answer — that is what migration 0017 and
 * `learning_submissions` are for.
 */
async function insertEvents(
  t: SqlExecutor,
  rows: readonly LearningEventRow[],
): Promise<number> {
  let inserted = 0;
  for (const r of rows) {
    const res = await t.query(
      `insert into learning_events
         (event_id, subject_id, episode_id, session_id, seq, event_name,
          occurred_at, source_trust, environment, cohort, route, payload)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
       on conflict (event_id) do nothing`,
      [
        r.eventId,
        r.subjectId,
        r.episodeId,
        r.sessionId,
        r.seq,
        r.eventName,
        r.occurredAt,
        r.sourceTrust,
        r.environment,
        r.cohort,
        r.route,
        JSON.stringify(r.payload),
      ],
    );
    if (res.rowCount > 0) inserted += 1;
  }
  return inserted;
}

/**
 * One row, mapped once.
 *
 * Shared by the per-episode and per-subject reads so the two cannot drift. A
 * replay that carried trust and a sweep that did not would eventually disagree
 * about the same child's history, and nothing would surface the disagreement —
 * both would look like a working query returning rows.
 *
 * The cast on `source_trust` is reading a closed vocabulary the database
 * already enforces (`check (source_trust in (...))`, migration 0003), not
 * trusting a string that arrived from somewhere.
 */
function toTrustedEvent(row: {
  event_name: string;
  occurred_at: unknown;
  received_at: unknown;
  seq: number;
  source_trust: SourceTrust;
  payload: Record<string, string | number | boolean> | null;
}): TrustedEvent {
  return {
    event_name: row.event_name,
    occurred_at: toIso(row.occurred_at),
    received_at: toIso(row.received_at),
    seq: Number(row.seq),
    sourceTrust: row.source_trust,
    payload: row.payload ?? {},
  };
}

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return new Date(v).toISOString();
  return new Date(0).toISOString();
}

function rowToReview(row: Record<string, unknown>): ReviewRow {
  return {
    reviewId: row.review_id as string,
    blockId: row.block_id as string,
    reason: row.reason as ReviewRow["reason"],
    originLevel: Number(row.origin_level),
    originEpisodeId: row.origin_episode_id as string,
    originAt: toIso(row.origin_at),
    dueAt: toIso(row.due_at),
    policyId: row.policy_id as string,
    reviewEpisodeId: (row.review_episode_id as string) ?? null,
    startedAt: row.started_at ? toIso(row.started_at) : null,
    completedAt: row.completed_at ? toIso(row.completed_at) : null,
    outcome: (row.outcome as ReviewOutcome) ?? null,
  };
}

function rowToReducedEpisode(row: Record<string, unknown>): ReducedEpisode {
  return {
    task_ref: row.task_ref as string,
    task_kind: row.task_kind as string,
    opened_at: toIso(row.opened_at),
    closed_at: row.closed_at ? toIso(row.closed_at) : null,
    active_seconds: Number(row.active_seconds),
    resume_count: Number(row.resume_count),
    outcome: row.outcome as ReducedEpisode["outcome"],
    verdict_sequence: (row.verdict_sequence ?? []) as ReducedEpisode["verdict_sequence"],
    diff_class_sequence: (row.diff_class_sequence ?? []) as ReducedEpisode["diff_class_sequence"],
    submissions: Number(row.submissions),
    runs: Number(row.runs),
    self_authored_tests: Number(row.self_authored_tests),
    statement_revisits: Number(row.statement_revisits),
    statement_revisits_after_failure: Number(row.statement_revisits_after_failure ?? 0),
    language: (row.language as string) ?? null,
    skill_id: (row.skill_id as string) ?? null,
    max_assistance_level: Number(row.max_assistance_level),
    intervention_count: Number(row.intervention_count),
    solution_revealed: Boolean(row.solution_revealed),
    independence_weight: Number(row.independence_weight),
    struggle_class: (row.struggle_class as ReducedEpisode["struggle_class"]) ?? null,
    /* Load-bearing. These are the ONLY source of every misconception
       downstream; reading them back as empty makes the model structurally
       incapable of learning anything, silently. */
    attributions: (row.attributions ?? []) as ReducedEpisode["attributions"],
    attributed_failures: Number(row.attributed_failures ?? 0),
    event_count: Number(row.event_count),
    reducer_version: Number(row.reducer_version),
  };
}

function rowToSkillState(row: Record<string, unknown>): SkillState {
  return {
    skill: row.skill_id as string,
    level: row.level as SkillState["level"],
    attempts: Number(row.attempts),
    solved: Number(row.solved),
    soloSolved: Number(row.solo_solved),
    assistedSolved: Number(row.assisted_solved),
    failures: Number(row.failures),
    attributedFailures: Number(row.attributed_failures),
    distinctTasks: Number(row.distinct_tasks),
    misconceptions: (row.misconceptions ?? []) as SkillState["misconceptions"],
    rationale: (row.rationale as string) ?? "",
  };
}
