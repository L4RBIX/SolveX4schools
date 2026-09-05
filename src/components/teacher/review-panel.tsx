"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@schools/curriculum/types";
import type {
  ReviewDisposition,
  ReviewResponse,
  ReviewState,
  StudentReview,
} from "@schools/teacher/contracts";
import { TL } from "@schools/teacher/labels";
import { EXTRA, REVIEW } from "@schools/teacher/labels-extra/assessments";
import { EXTRA as SHELL_EXTRA } from "@schools/teacher/labels-extra/shell";
import { numericDateTime } from "@schools/presentation/dates";
import {
  teacherLoadFailure,
  teacherLoadFailureLabel,
  type TeacherLoadFailure,
} from "@schools/presentation/teacher-outcome";
import { useLocale } from "@/components/sx/i18n";
import { cn } from "@/lib/utils";
import { richText } from "@/lib/rich-text";
import { INK, LINE, MOTION, RADIUS, SURFACE, TYPE } from "./tokens";
import { toneChip, toneText } from "./format";
import { Chip, EmptyState, Hint, QuotedResponse, SidePanel } from "./ui";

/**
 * One learner's submitted work, opened.
 *
 * ## Why it is its own module
 *
 * Two screens open it and they arrive from opposite directions. The assessments
 * page reaches it from the marking queue — *whose turn is next* — and the
 * student page reaches it from one child — *what did she actually write*. Both
 * are the same panel over the same endpoint, and duplicating it would be two
 * copies of a component whose whole job is to render a fourteen-year-old's own
 * words correctly.
 *
 * ## Fetched on open, never shipped with a list
 *
 * The queue that leads here carries names and timestamps and no prose. Sending
 * every learner's writing to render a list of names would hand out twenty
 * children's work to display none of it, and fetching per-open keeps "whose
 * work was read" a question a request log can answer.
 *
 * ## What it cannot show
 *
 * The endpoint behind it returns only blocks the curriculum declares a human
 * marks, for one learner, in one class the teacher provably teaches. No Nova
 * conversation (none is stored anywhere), no hidden test, no expected output,
 * no reference solution — see the route's own comment for why each of those is
 * unreachable rather than filtered.
 *
 * ## The review action, and the two things it is not
 *
 * There used to be no control here at all, and the panel said so: nothing in
 * `database/migrations` could record that a teacher had marked something, so a
 * button would have looked like it worked and changed nothing. Migration 0022
 * adds `human_reviews` and the control is real.
 *
 * It is **not a grade.** The two dispositions both mean READ — one says nothing
 * further is needed, the other says the class has to come back to it — and the
 * table has no column for a score, a percentage or a note. The sentence under
 * the buttons says where a mark actually goes, which is the school's own
 * register.
 *
 * It is **not shown to the learner.** Nothing in the learner's surface reads
 * `human_reviews`; a follow-up flag is a teacher's note to themselves about a
 * conversation to have, and a fourteen-year-old discovering it on their own
 * screen would turn it into the verdict it is careful not to be.
 *
 * ## Optimistic, but never silently
 *
 * The button paints the new state immediately and reverts if the write fails,
 * because a teacher marking a stack of answers should not wait on a round trip
 * per answer. A failure is stated rather than swallowed — an action that
 * appears to work and did not is the exact defect the old missing button was
 * being honest about.
 */
export function ReviewPanel({
  classId,
  subject,
  onClose,
  onReviewed,
}: {
  classId: string;
  /** The learner whose work is open, or null when the panel is closed. */
  subject: { subjectId: string; displayName: string } | null;
  onClose: () => void;
  /**
   * A review landed. The queue behind the panel is now stale.
   *
   * Both mount sites pass one — the assessments page to re-count «Ждут
   * проверки», the student page because its own assessment band shows the same
   * state. A callback rather than a shared store because there is no store on
   * this surface, and inventing one for two callers would be the larger change.
   */
  onReviewed?: () => void;
}) {
  const { t, locale } = useLocale();
  const loc = locale as Locale;
  const [loaded, setLoaded] = useState<{
    key: string;
    data: StudentReview | null;
    failure: TeacherLoadFailure | null;
  } | null>(null);

  const subjectId = subject?.subjectId ?? null;
  const key = subjectId ? `${classId}:${subjectId}` : null;

  useEffect(() => {
    if (!key || !subjectId) return;
    let live = true;

    fetch(
      `/api/teacher/class/${encodeURIComponent(classId)}/review/${encodeURIComponent(subjectId)}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          /* The body may not be JSON at all behind a proxy that answers HTML,
             so failing to read it is just another way of saying "unavailable".
             `failure` is a closed union and never a caught message: neither
             `not_authenticated` nor `Unexpected token '<'` is a sentence for
             somebody standing in front of a class. */
          const reason = await response
            .json()
            .then((body: { error?: unknown }) => body?.error)
            .catch(() => null);
          if (live) setLoaded({ key, data: null, failure: teacherLoadFailure(reason) });
          return;
        }
        const payload = (await response.json()) as StudentReview;
        if (live) setLoaded({ key, data: payload, failure: null });
      })
      .catch(() => {
        if (live) setLoaded({ key, data: null, failure: "unavailable" });
      });

    return () => {
      live = false;
    };
  }, [key, classId, subjectId]);

  /* The answer travels with the learner it belongs to. A stale payload from the
     previously-opened learner must be unrenderable, not merely unlikely — this
     panel shows a named child's private writing under a named child's heading. */
  const current = loaded && loaded.key === key ? loaded : null;

  /*
   * Optimistic review state, keyed by submission id.
   *
   * Keyed rather than a single value because the panel shows every human-marked
   * block for this learner and each is reviewed separately. Cleared whenever
   * the learner changes, so a mark made on one child can never paint on the
   * next — the same rule the payload itself follows above.
   */
  const [optimistic, setOptimistic] = useState<Record<string, ReviewState | null>>({});
  /**
   * Which submission's write failed, not merely *that* one did.
   *
   * A single boolean meant a click on the second block silently cleared an
   * unreported failure on the first, leaving that block unreviewed with no
   * message and no visual difference from one simply not yet marked — the
   * swallowed failure the optimistic paint exists to avoid.
   */
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  /**
   * The fence.
   *
   * Two things can make a response irrelevant by the time it arrives: the
   * teacher has opened a different learner, or they have clicked again on the
   * same block. Both were live bugs — an in-flight rejection painted its alert
   * onto the next child's panel, and two overlapping clicks let whichever
   * response landed last win regardless of what the database actually holds.
   *
   * So every click stamps the learner it belongs to and a per-submission
   * sequence number, and a resolved request that is not the newest for its
   * submission, or belongs to a learner no longer on screen, is dropped
   * entirely. A ref rather than state because it must be readable inside a
   * closure that outlives the render that created it.
   */
  const fence = useRef<{ key: string | null; seq: Record<string, number> }>({
    key: null,
    seq: {},
  });

  useEffect(() => {
    setOptimistic({});
    setFailed({});
    fence.current = { key, seq: {} };
  }, [key]);

  async function decide(response: ReviewResponse, next: ReviewDisposition) {
    if (!subjectId || !response.submissionId) return;
    const id = response.submissionId;
    const mine = (fence.current.seq[id] ?? 0) + 1;
    fence.current.seq[id] = mine;
    const forKey = key;
    /** Still the request this component cares about? */
    const current = () => fence.current.key === forKey && fence.current.seq[id] === mine;

    /* Paint first. A teacher working through a stack should not wait on a round
       trip per answer — but a failure must be visible, not swallowed. */
    setOptimistic((o) => ({
      ...o,
      [id]: { disposition: next, reviewedAt: new Date().toISOString(), byYou: true },
    }));
    setFailed((f) => ({ ...f, [id]: false }));

    try {
      const res = await fetch(
        `/api/teacher/class/${encodeURIComponent(classId)}/review/${encodeURIComponent(subjectId)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            submissionId: id,
            blockId: response.blockId,
            disposition: next,
          }),
        },
      );
      if (!res.ok) throw new Error("refused");
      const stored = (await res.json()) as ReviewState;
      if (!current()) return;
      /* Render what was STORED, not what was asked for. */
      setOptimistic((o) => ({ ...o, [id]: stored }));
      onReviewed?.();
    } catch {
      if (!current()) return;
      /*
       * Reverting to a snapshot taken at click time would clobber anything that
       * landed since — including a review the server really did store. The
       * fence means this only runs when nothing newer exists for this
       * submission, so the pre-click value is genuinely the current truth.
       */
      setOptimistic((o) => ({ ...o, [id]: response.review }));
      setFailed((f) => ({ ...f, [id]: true }));
    }
  }

  return (
    <SidePanel
      open={subject !== null}
      onClose={onClose}
      title={subject?.displayName ?? ""}
      /*
       * The assessment, not the block that was clicked.
       *
       * The queue row names one task, but the panel shows every human-marked
       * block this learner submitted — so a header reading «Письменное
       * объяснение · 27.08, 23:47» both repeated the first article's own
       * heading and mislabelled the second one. What is constant across the
       * panel is which check it belongs to.
       */
      subtitle={
        current?.data ? (
          <span className={cn(TYPE.meta, INK.muted)}>{t(current.data.assessmentTitle)}</span>
        ) : undefined
      }
    >
      {current?.failure ? (
        <EmptyState title={t(teacherLoadFailureLabel(current.failure))} />
      ) : !current?.data ? (
        <div
          role="status"
          aria-label={t(TL.loading)}
          className={cn("h-40 animate-pulse rounded-[14px] border", LINE.hair, SURFACE.inset)}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {current.data.responses.map((response) => (
            <article key={response.blockId} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className={cn(TYPE.subsection, INK.primary)}>{t(response.taskLabel)}</h3>
                {response.submittedAt ? (
                  <span className={cn(TYPE.meta, INK.muted, "tabular-nums")}>
                    {numericDateTime(loc, new Date(response.submittedAt))}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <p className={cn(TYPE.meta, INK.muted)}>{t(REVIEW.promptTitle)}</p>
                <p className={cn("max-w-[68ch]", TYPE.body, INK.secondary)}>
                  {richText(t(response.prompt))}
                </p>
              </div>

              {/* The oral block, named as what the platform actually holds. The
                  defence happens in the room; nothing records it. */}
              {response.form === "spoken_note" ? (
                <p className={cn("max-w-[68ch]", TYPE.meta, INK.muted)}>
                  {t(TL.assessmentOralInPerson)}
                </p>
              ) : null}

              <div className="flex flex-col gap-1.5">
                <p className={cn(TYPE.meta, INK.muted)}>{t(REVIEW.answerTitle)}</p>
                {response.text !== null ? (
                  <QuotedResponse>{response.text}</QuotedResponse>
                ) : (
                  /*
                   * Three different absences, and the panel names which one.
                   *
                   * Never submitted, submitted before the platform kept answers,
                   * and submitted with an empty box lead a teacher to three
                   * different conversations with the same child. Collapsing them
                   * into one «нет ответа» would lose the only part that tells
                   * them which conversation to have.
                   */
                  <p className={cn("max-w-[68ch]", TYPE.body, INK.muted)}>
                    {t(absence(response.submittedAt, response.text))}
                  </p>
                )}
              </div>

              {/* The standard, one keypress away. Authored on the block and
                  identical for every learner, so it is a disclosure rather than
                  fifty lines above the thing being marked. It is the criteria,
                  never the reference solution. */}
              {response.expectedPoints.length > 0 ? (
                <Hint label={t(EXTRA.markingCriteria)}>
                  <ul className="flex list-disc flex-col gap-1.5 pl-4">
                    {response.expectedPoints.map((point, index) => (
                      <li key={index}>{richText(t(point))}</li>
                    ))}
                  </ul>
                  <p className={cn("mt-2", TYPE.meta, INK.muted)}>{t(EXTRA.expectedPointsNote)}</p>
                </Hint>
              ) : null}

              <ReviewAction
                response={response}
                state={
                  response.submissionId && response.submissionId in optimistic
                    ? optimistic[response.submissionId]
                    : response.review
                }
                /* Beside the block it belongs to, not at the foot of the panel:
                   two blocks share this screen and a teacher has to know which
                   one did not save. */
                failed={response.submissionId ? failed[response.submissionId] === true : false}
                onDecide={(next) => void decide(response, next)}
              />
            </article>
          ))}

          <div className={cn("flex flex-col gap-2 border-t pt-4", LINE.hair)}>
            <p className={cn("max-w-[68ch]", TYPE.meta, INK.secondary)}>{t(REVIEW.noRecord)}</p>
            <Hint label={t(SHELL_EXTRA.why)}>
              <p>{t(REVIEW.noRecordWhy)}</p>
            </Hint>
          </div>
        </div>
      )}
    </SidePanel>
  );
}

/**
 * Which kind of nothing this is.
 *
 * `submittedAt === null` — the learner never sent this block. Nothing was lost.
 *
 * Otherwise a row exists and `text` is still null, which is a settled
 * submission whose artifact could not be read: either it predates migration
 * 0021 or the learner pressed check on an empty field. The panel cannot tell
 * those two apart from this payload alone — both are `answer is null` at the
 * column — so it says the honest thing, which is that the text is not on file,
 * rather than accusing a child of submitting nothing.
 */
function absence(submittedAt: string | null, text: string | null) {
  if (submittedAt === null) return REVIEW.notSubmitted;
  return text === null ? REVIEW.textMissing : REVIEW.textEmpty;
}

/* -------------------------------------------------------------------------- */
/* The one decision a teacher records                                         */
/* -------------------------------------------------------------------------- */

/**
 * Two buttons and a line of state. Not a grading UI.
 *
 * Deliberately small and deliberately last: it sits under the answer, after the
 * criteria, because the order of the panel is the order of the work — read the
 * task, read the child's words, check them against the standard, then say what
 * you are going to do. A control at the top would invite a decision before the
 * reading.
 *
 * No filled card, no colour block, no icons. The current state is a quiet chip
 * in the surface's own tone vocabulary — lock for read-and-done, amber for
 * come-back-to-it — and amber here means "on your list", never "the child
 * failed". The two dispositions are both READ.
 *
 * A block the learner never submitted has no artifact to review, so there is
 * nothing to press: the row renders the reason instead of a disabled control
 * pretending an action exists.
 */
function ReviewAction({
  response,
  state,
  failed,
  onDecide,
}: {
  response: ReviewResponse;
  state: ReviewState | null;
  /** This block's own write did not land. */
  failed: boolean;
  onDecide: (next: ReviewDisposition) => void;
}) {
  const { t, locale } = useLocale();
  const loc = locale as Locale;

  if (!response.submissionId) return null;

  const done = state !== null;

  return (
    <div className={cn("mt-1 flex flex-col gap-2 border-t pt-3", LINE.hair)}>
      <div className="flex flex-wrap items-center gap-2">
        {(["reviewed", "needs_followup"] as const).map((option) => {
          const active = state?.disposition === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onDecide(option)}
              className={cn(
                "cursor-pointer border px-3 py-1.5",
                RADIUS.control,
                TYPE.meta,
                "font-medium",
                MOTION.base,
                active
                  ? toneChip(option === "reviewed" ? "lock" : "warn")
                  : cn(LINE.edge, INK.secondary, SURFACE.hover),
              )}
            >
              {t(option === "reviewed" ? REVIEW.markReviewed : REVIEW.markFollowUp)}
            </button>
          );
        })}
      </div>

      {failed ? (
        /* An action that appears to work and did not is the exact defect the
           old missing button was being honest about. */
        <p role="alert" className={cn("max-w-[68ch]", TYPE.meta, toneText("warn"))}>
          {t(REVIEW.reviewFailed)}
        </p>
      ) : null}

      {done ? (
        <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", TYPE.meta, INK.muted)}>
          <span className="tabular-nums">{numericDateTime(loc, new Date(state.reviewedAt))}</span>
          {state.byYou ? null : <span>· {t(REVIEW.reviewedByColleague)}</span>}
          <span>· {t(REVIEW.notShownToLearner)}</span>
        </p>
      ) : null}
    </div>
  );
}
