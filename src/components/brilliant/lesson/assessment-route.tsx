"use client";

import { useCallback, useEffect } from "react";
import type { Locale } from "@schools/curriculum/types";
import type { PublicAssessment } from "@schools/curriculum/public";
import type { BlockAnswer } from "@schools/learning/checking";
import type { SchoolInteraction } from "@schools/learning";
import type { LearningPayload } from "@solvex/learning-contracts";
import { useLocale } from "@/components/sx/i18n";
import { ASSESSMENT_COMPLETION_POLICY } from "@schools/policies/completion";
import { markLessonComplete } from "@/lib/progress";
import { flushPending, postOrQueue } from "@/lib/pending-writes";
import { SchoolLesson, type LessonSummary } from "./school-lesson";
import type { BlockReveal } from "./blocks";

/**
 * Client wrapper for the monthly check.
 *
 * Deliberately a near-twin of `LessonRoute`. The assessment runs on the same
 * player for the same reason the lesson does — one runtime means one place for
 * a grading bug to live, and a learner meeting a familiar screen on the day it
 * counts. What differs is where the completion is recorded and that the check
 * announces its time budget up front.
 *
 * The submit path is identical because it has to be: `findBlock` in
 * `schools/learning/grade.ts` already resolves assessment blocks, and the
 * submit route now sends `verify` blocks that carry cases to the judge. Before
 * that change the whole check settled `unknown` and produced no evidence at
 * all, which is what made it ceremonial.
 */
export function AssessmentRoute({
  assessment,
  monthTitle,
}: {
  assessment: PublicAssessment;
  monthTitle: string;
}) {
  const { locale } = useLocale();

  const onInteraction = useCallback((interaction: SchoolInteraction) => {
    void fetch("/api/learning/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        events: [
          {
            eventName: "statement_revisited",
            occurredAt: new Date(interaction.timestamp).toISOString(),
            payload: { is_revisit: false },
          },
        ],
      }),
    }).catch(() => {});
  }, []);

  /**
   * `run_executed`, on the monthly check too.
   *
   * Worth stating rather than assuming: the check is the surface where a local
   * Run settles the least — `trust-policy.ts` sends every `verify` block to
   * `assessment`, which demands `server_verified` — and it is still the surface
   * where recording the effort matters, because Nova's hint ladder reads the
   * same ledger here. Not counting a Run means a learner who is genuinely
   * working through a hard check looks like one who is fishing for hints.
   *
   * The event carries no output and no code; see `runEventPayload`.
   */
  const onRunExecuted = useCallback(
    (run: { episodeId: string; occurredAt: string; payload: LearningPayload }) => {
      void fetch("/api/learning/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          events: [
            {
              episodeId: run.episodeId,
              eventName: "run_executed",
              occurredAt: run.occurredAt,
              payload: run.payload,
            },
          ],
        }),
      }).catch(() => {});
    },
    [],
  );

  /* Anything a previous session could not deliver, sent again. Same reasoning
     as `LessonRoute`: on mount, once, never on an interval. */
  useEffect(() => {
    void flushPending();
  }, []);

  const onSubmit = useCallback(
    async (input: {
      blockId: string;
      episodeId: string;
      /* The idempotency key, minted by the player once per Check press and held
         while the answer is unchanged. Declared here rather than left to
         structural typing so it is visibly part of the request: drop it from
         this object and the server silently goes back to appending a second set
         of learning events for every retried submission. See
         `schools/learning/submission.ts`. */
      submissionId: string;
      answer: BlockAnswer;
    }) => {
      try {
        const res = await fetch("/api/learning/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) return null;
        return (await res.json()) as {
          verdict: "correct" | "wrong" | "partial" | "unknown";
          reveal?: BlockReveal;
          why?: string | null;
          /* Same two facts the lesson route passes through. On the check they
             matter more, not less: an assessment block that quietly settled
             without being stored is a monthly result that never happened. */
          saved?: boolean;
          unmeasuredReason?: "judge_unavailable" | "not_machine_graded" | "no_trusted_judge" | null;
        };
      } catch {
        return null;
      }
    },
    [],
  );

  const onComplete = useCallback((summary: LessonSummary) => {
    /* The check is recorded under its own id, so the board can show it done
       without it being mistaken for a tenth lesson. `findCompletable` resolves
       assessment ids for the same reason `findBlock` does — one runtime, one
       lookup, two things a learner can finish. */
    markLessonComplete(summary.lessonId);
    /* And on the server, which is where a monthly check most needs to be.
       The learner still never waits for it and never sees a spinner — but a
       failure is now KEPT and re-sent rather than dropped, which for an
       assessment is the difference between a record and a rumour. See
       `src/lib/pending-writes.ts`. */
    void postOrQueue("/api/learning/complete", summary);
  }, []);

  return (
    <SchoolLesson
      lesson={{ id: assessment.id, title: assessment.title, blocks: assessment.blocks }}
      monthIndex={assessment.monthIndex}
      monthTitle={monthTitle}
      locale={locale as Locale}
      backHref={`/course/${assessment.monthIndex}`}
      onInteraction={onInteraction}
      onSubmit={onSubmit}
      onComplete={onComplete}
      onRunExecuted={onRunExecuted}
      /* The monthly check is held to the stricter rule: every block answered,
         every block a machine CAN grade actually graded, and the written and
         oral halves carrying the learner's own words. See
         `schools/policies/completion.ts` — the server evaluates the same policy
         id when this posts, so the two cannot drift. */
      policy={ASSESSMENT_COMPLETION_POLICY}
    />
  );
}
