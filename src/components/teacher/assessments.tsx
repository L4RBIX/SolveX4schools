"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale, Localized } from "@schools/curriculum/types";
import type {
  AssessmentBlockResult,
  AssessmentLearnerRow,
  AssessmentState,
  ClassAssessments,
  ReviewItem,
  ReviewQueue,
} from "@schools/teacher/contracts";
import { TL } from "@schools/teacher/labels";
import {
  EXTRA,
  REVIEW,
  blockMarker,
  learnersMeasured,
  learnersUnmeasured,
  requiredLevel,
  responsesUnreadable,
  rosterTotal,
} from "@schools/teacher/labels-extra/assessments";
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
import { GAP, INK, LINE, MOTION, NUM, SURFACE, TYPE } from "./tokens";
import { useTeacherView } from "./shell";
import {
  Chip,
  DataTable,
  Distribution,
  EmptyState,
  Hint,
  Meter,
  Num,
  Section,
  SearchInput,
  type DataColumn,
  type DistributionSlice,
} from "./ui";
import { ReviewPanel } from "./review-panel";
import { minutes as formatMinutes, toneFill, toneText, type Tone } from "./format";

/**
 * The monthly check.
 *
 * ## Why this screen exists at all
 *
 * The audit's item 23: neither the class projection nor any signal kind
 * mentioned a monthly assessment, so a teacher literally could not see whether
 * their class had sat the September check. This is the whole of that gap, and
 * it is deliberately not windowed — «has this learner sat the September check»
 * is not a question about the last seven days.
 *
 * ## The three things it refuses to do
 *
 * 1. **No score column.** There is none in the schema and there must be none on
 *    screen. A human-marked explanation collapsed into a number would be an
 *    invented measurement of a fourteen-year-old's prose, and the one thing a
 *    school report must never contain is a figure nobody computed.
 * 2. **No zero for an absent measurement.** A judge outage during the check
 *    leaves a coding block with submissions and no verdict; the honest rendering
 *    is «не измерено», never `0%`. `AssessmentLearnerRow.unmeasuredCoding` is
 *    the only trace such an outage leaves and it is rendered on the row.
 * 3. **No empty table for a closed month.** `open === false` means the content
 *    is not being served, and the screen says that instead of drawing an
 *    eighteen-row table of «не начал».
 *
 * ## What the redesign changed, and why
 *
 * **The learner table used to render one column per assessment block.** Six
 * blocks put the table over a 1290px minimum, so on a 1280 laptop it escaped
 * its scroll box and pushed the page sideways. Those columns are now ONE status
 * strip per learner — a run of 14px marks, each carrying the block number, its
 * kind and the rung that learner reached as its accessible name — and the full
 * per-block detail opens inside the cell. The table is five columns wide at any
 * number of blocks, and nothing was dropped: what was six columns of chips is
 * six marks plus a disclosure holding the same three sentences.
 *
 * **The two honest limits moved up.** `unmeasuredCoding` (a judge outage) and
 * `unreadableResponses` (prose the ledger does not store) were sentences below
 * the fold, under a table. They are now the third thing on the page, on a spine
 * in their tone, because both change how everything under them is read.
 *
 * The human-review limit is deliberately NOT amber. Nothing broke: the product
 * does not store written and oral answers and never claimed to. It is a lock
 * tone — the surface's «not applicable» — beside a sentence that says the
 * answers cannot be read here, so nobody goes looking for a review screen that
 * does not exist.
 *
 * ## Where the marking criteria go
 *
 * `AssessmentBlockResult.expectedPoints` is identical for every learner — it is
 * authored on the block — so it belongs in the task band ABOVE the table, once,
 * rather than repeated in eighteen rows. `types.ts:400-403` says the teacher
 * console showing these is the reason they exist; they are the standard a human
 * marks against, not the answer, and the note beside them says so. They sit in
 * a `Hint` rather than a tinted box: six blocks × three criteria is fifty lines
 * of standard above the six meters that say who met it.
 */

type Assessment = ClassAssessments["assessments"][number];

/* -------------------------------------------------------------------------- */
/* State vocabulary                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The four states a learner can be in once the check is open.
 *
 * `not_open` is excluded on purpose: when the month is closed every learner is
 * in it, and a distribution that is 100% one row is a picture of a fact the
 * header has already stated in words.
 */
const OPEN_STATES: readonly AssessmentState[] = [
  "not_started",
  "in_progress",
  "awaiting_review",
  "complete",
];

const STATE_LABEL: Record<AssessmentState, Localized> = {
  not_open: EXTRA.stateNotOpen,
  not_started: TL.assessmentStateNotStarted,
  in_progress: TL.assessmentStateInProgress,
  awaiting_review: TL.assessmentStateAwaitingReview,
  complete: TL.assessmentStateComplete,
};

/**
 * `awaiting_review` is amber because it is the one state that needs a person,
 * and `not_started` is grey rather than red because a learner who has not sat a
 * check the class sits together is not failing — they were absent, or it has not
 * been set yet.
 */
const STATE_TONE: Record<AssessmentState, Tone> = {
  not_open: "lock",
  not_started: "lock",
  in_progress: "info",
  awaiting_review: "warn",
  complete: "ok",
};

/**
 * Sort order for the state column: everyone who touched the check, first.
 *
 * It used to be least-done-first, which on a check that opened this morning put
 * nineteen «Не начал» rows at the top and the only two learners with work at
 * the bottom of a long scroll. The count of learners who have not started is
 * already stated exactly, twice, in the distribution directly above the table —
 * repeating it as nineteen identical rows tells a teacher nothing and buries
 * the two rows that do.
 *
 * So the rows a teacher can act on come first, worst-first among them:
 * in progress, then waiting on a person, then finished, then not started.
 */
const STATE_RANK: Record<AssessmentState, number> = {
  in_progress: 0,
  awaiting_review: 1,
  complete: 2,
  not_started: 3,
  not_open: 4,
};

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export function TeacherAssessments() {
  const { t } = useLocale();
  const { classId, report } = useTeacherView();

  /*
   * The class the answer belongs to travels WITH the answer.
   *
   * Clearing the state at the top of the effect would be a synchronous setState
   * in an effect body — a cascading render, and one the lint rule refuses. It is
   * also the wrong shape: switching class must not leave the previous class's
   * table on screen for a frame, and stamping the id onto the result makes a
   * stale payload unrenderable rather than merely unlikely.
   *
   * `failure` is a CLOSED union, never a caught message. On an expired session
   * the body says `not_authenticated`; behind a proxy that answers HTML the JSON
   * parser says `Unexpected token '<'`. Neither is a sentence for someone
   * standing in front of a class, and typing the state as the union means no
   * failure can carry a string that reaches the screen.
   */
  const [loaded, setLoaded] = useState<{
    classId: string;
    data: ClassAssessments | null;
    failure: TeacherLoadFailure | null;
  } | null>(null);

  /*
   * A counter that bumps to force a refetch after a review lands.
   *
   * The alternative — patching the payload in place — would leave «Ждут
   * проверки — N», the three group lists and the pending count on the overview
   * to be updated by hand in four places, and one of them would eventually be
   * missed. Refetching means the screen always shows what the server actually
   * holds, which is the same rule the panel follows when it renders the stored
   * disposition rather than the requested one.
   */
  const [revision, setRevision] = useState(0);
  const refetch = useCallback(() => setRevision((n) => n + 1), []);

  useEffect(() => {
    if (!classId) return;
    let live = true;

    fetch(`/api/teacher/class/${encodeURIComponent(classId)}/assessments`)
      .then(async (response) => {
        if (!response.ok) {
          /* The body may not be JSON at all — that is exactly the case that
             produced the parser error above — so failing to read it is just
             another way of saying "unavailable". */
          const reason = await response
            .json()
            .then((body: { error?: unknown }) => body?.error)
            .catch(() => null);
          if (live) setLoaded({ classId, data: null, failure: teacherLoadFailure(reason) });
          return;
        }
        const payload = (await response.json()) as ClassAssessments;
        if (!live) return;
        setLoaded({ classId, data: payload, failure: null });
        /* The chrome does not fetch a seventh time; the page that already has
           the context and the freshness reports them up. */
        report({ context: payload.context, freshness: payload.freshness });
      })
      // No parameter, deliberately: there is nothing in a network error a
      // teacher can act on, and reading it is how it ends up rendered.
      .catch(() => {
        if (live) setLoaded({ classId, data: null, failure: "unavailable" });
      });

    return () => {
      live = false;
    };
  }, [classId, report, revision]);

  const current = loaded && loaded.classId === classId ? loaded : null;
  const failure = current?.failure ?? null;
  const data = current?.data ?? null;

  if (!classId) {
    return (
      <Section title={t(TL.assessmentsTitle)}>
        <EmptyState title={t(SHELL_EXTRA.noClassSelected)} />
      </Section>
    );
  }

  if (failure) {
    return (
      <Section title={t(TL.assessmentsTitle)}>
        <EmptyState title={t(teacherLoadFailureLabel(failure))} />
      </Section>
    );
  }

  if (!data) {
    return (
      <Section title={t(TL.assessmentsTitle)}>
        <div
          role="status"
          aria-label={t(TL.loading)}
          className={cn("h-48 animate-pulse rounded-[14px] border", LINE.hair, SURFACE.inset)}
        />
      </Section>
    );
  }

  if (data.assessments.length === 0) {
    return (
      <Section title={t(TL.assessmentsTitle)}>
        <EmptyState title={t(EXTRA.noAssessment)} hint={t(EXTRA.noAssessmentHint)} />
      </Section>
    );
  }

  return (
    <>
      {data.assessments.map((assessment, index) => (
        <article
          key={assessment.assessmentId}
          className={index > 0 ? cn("mt-8 border-t pt-8", LINE.hair) : undefined}
        >
          <AssessmentPanel
            assessment={assessment}
            classId={classId}
            review={index === 0 ? data.review : null}
            onReviewed={refetch}
          />
        </article>
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* One assessment                                                             */
/* -------------------------------------------------------------------------- */

function AssessmentPanel({
  assessment,
  classId,
  review,
  onReviewed,
}: {
  assessment: Assessment;
  classId: string;
  /** The month's marking queue. Null when the month has no check of its own. */
  review: ReviewQueue | null;
  /** A review landed; refetch so the counts and the groups move together. */
  onReviewed: () => void;
}) {
  const { t, locale } = useLocale();
  const loc = locale as Locale;
  const [query, setQuery] = useState("");

  const learners = assessment.learners;
  const total = learners.length;

  /* Every learner is measured against the same ordered policy blocks, so the
     first row's list is the key for all of them. Cells still look their own
     block up by id rather than by position. Memoised because `?? []` would
     otherwise be a new array every render, and the column list depends on it. */
  const blocks: readonly AssessmentBlockResult[] = useMemo(
    () => learners[0]?.blocks ?? [],
    [learners],
  );

  /* A plain median of a measured quantity, with the population it was taken
     over printed beside it. Not a composite and not a score — the question it
     answers is «is the authored 40 minutes anywhere near the truth». */
  const measured = learners
    .map((row) => row.minutes)
    .filter((value): value is number => value !== null);
  const medianMinutes = median(measured);
  const medianText =
    medianMinutes === null ? null : `${formatMinutes(medianMinutes) ?? ""} ${t(TL.minutesShort)}`;

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return learners;
    return learners.filter((row) => row.displayName.toLocaleLowerCase().includes(needle));
  }, [learners, query]);

  const slices: DistributionSlice[] = OPEN_STATES.map((state) => ({
    key: state,
    label: t(STATE_LABEL[state]),
    value: assessment.counts[state],
    tone: STATE_TONE[state],
  }));

  const columns = useMemo<DataColumn<AssessmentLearnerRow>[]>(
    () => [
      {
        key: "student",
        header: TL.colStudent,
        sortable: true,
        sortValue: (row) => row.displayName,
        render: (row) => (
          <span className={cn(TYPE.rowTitle, INK.primary)}>{row.displayName}</span>
        ),
      },
      {
        key: "state",
        header: TL.colStatus,
        sortable: true,
        sortValue: (row) => STATE_RANK[row.state],
        render: (row) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <StateBadge state={row.state} />
            {/* The judge-outage flag, on the row it belongs to. It says nothing
                about the learner, which is why the chip carries the sentence. */}
            {row.unmeasuredCoding ? (
              <Chip tone="warn" title={t(TL.assessmentUnmeasured)}>
                {t(TL.emptyNotMeasured)}
              </Chip>
            ) : null}
          </div>
        ),
      },
      {
        /* One column, whatever the block count. This is the fix for the 1290px
           minimum: six blocks used to be six columns of chips. */
        key: "blocks",
        header: EXTRA.blocksStrip,
        render: (row) => <BlockStrip blocks={row.blocks} />,
      },
      {
        key: "completedAt",
        header: EXTRA.colCompletedAt,
        align: "right",
        sortable: true,
        sortValue: (row) => (row.completedAt ? new Date(row.completedAt).getTime() : null),
        render: (row) =>
          row.completedAt ? (
            <span className={cn(NUM.cell, INK.secondary)}>
              {numericDateTime(loc, new Date(row.completedAt))}
            </span>
          ) : (
            /* NOT «не измерено»: an absent completion is a fact about the work,
               and the state column beside it already says which fact. */
            <span className={cn(TYPE.meta, INK.muted)}>{t(EXTRA.notCompleted)}</span>
          ),
      },
      {
        key: "minutes",
        header: EXTRA.colMinutes,
        align: "right",
        sortable: true,
        sortValue: (row) => row.minutes,
        render: (row) => <Num value={row.minutes} suffix={t(TL.minutesShort)} />,
      },
    ],
    [loc, t],
  );


  return (
    <>
      <Section title={t(assessment.title)} action={<ExportCsv classId={classId} locale={loc} />}>
        <div className={GAP.block}>
          {/* The situation, in one line: which month, and whether the class can
              sit the check at all. */}
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="neutral">
              <span className="tabular-nums">
                {t(TL.monthLabel)} {assessment.monthIndex}
              </span>
            </Chip>
            {assessment.open ? (
              <Chip tone="ok">{t(EXTRA.assessmentOpen)}</Chip>
            ) : (
              <Chip tone="lock">{t(TL.assessmentNotOpen)}</Chip>
            )}
          </div>

          {/* The authored budget beside the measured median, because the only
              useful question about an estimate is whether it held. Marked as an
              estimate in the same breath: there is no timer in this product and
              no submission is ever refused for arriving late, so presenting it
              as a limit would be a claim about a rule that does not exist. */}
          <dl className="flex flex-wrap gap-x-12 gap-y-4">
            <div className="min-w-0">
              <dt className={cn(TYPE.meta, INK.muted)}>{t(EXTRA.budgetLabel)}</dt>
              <dd className="mt-0.5">
                {assessment.budgetMinutes === null ? (
                  <span className={cn(TYPE.body, INK.muted)}>{t(EXTRA.budgetNone)}</span>
                ) : (
                  <span className={cn(NUM.figure, INK.primary)}>
                    {assessment.budgetMinutes} {t(TL.minutesShort)}
                  </span>
                )}
              </dd>
              <dd className={cn("mt-1 max-w-[52ch]", TYPE.meta, INK.muted)}>
                {t(EXTRA.budgetEstimate)}
              </dd>
            </div>

            {assessment.open ? (
              <div className="min-w-0">
                <dt className={cn(TYPE.meta, INK.muted)}>{t(EXTRA.measuredMedian)}</dt>
                <dd className="mt-0.5">
                  {medianText === null ? (
                    <span className={cn(TYPE.body, INK.muted)}>{t(TL.emptyNotMeasured)}</span>
                  ) : (
                    <span className={cn(NUM.figure, INK.primary)}>{medianText}</span>
                  )}
                </dd>
                <dd className={cn("mt-1 max-w-[52ch]", TYPE.meta, INK.muted)}>
                  {medianMinutes === null
                    ? t(TL.emptyInsufficientEvidence)
                    : t(learnersMeasured(measured.length))}
                </dd>
              </div>
            ) : null}
          </dl>

          {/* Four counted rows, the count first. The full-width stacked rule
              this replaces was precise and unreadable: «19 / 1 / 0 / 0» had to
              be recovered by following four colours to four captions. */}
          {assessment.open && total > 0 ? (
            <Distribution slices={slices} total={total} caption={t(rosterTotal(total))} />
          ) : null}

          {/* The judge outage, above the table rather than under it: it changes
              how every completion figure below is read. The human-review limit
              that used to sit beside it is gone, because it is no longer a
              limit — the answers are stored and the next section opens them. */}
          {assessment.unmeasuredCoding > 0 ? (
            <ul className="flex flex-col gap-4">
              <LimitNote
                tone="warn"
                title={t(EXTRA.unmeasuredTitle)}
                count={t(learnersUnmeasured(assessment.unmeasuredCoding))}
                body={t(TL.assessmentUnmeasured)}
              />
            </ul>
          ) : null}
        </div>
      </Section>

      <ReviewSection
        review={review}
        classId={classId}
        open={assessment.open}
        onReviewed={onReviewed}
      />

      <Section title={t(EXTRA.blockKeyTitle)} description={t(EXTRA.blockKeyNote)}>
        <BlockKey blocks={blocks} learners={learners} open={assessment.open} />
      </Section>

      <Section
        title={t(TL.navStudents)}
        action={
          assessment.open && total > 0 ? (
            <SearchInput value={query} onChange={setQuery} className="w-[200px] sm:w-[240px]" />
          ) : undefined
        }
      >
        {!assessment.open ? (
          /* A closed month is not an empty class. Eighteen rows of «не начал»
             would read as a class that ignored the check. */
          <EmptyState title={t(TL.assessmentNotOpen)} hint={t(EXTRA.notOpenHint)} />
        ) : total === 0 ? (
          <EmptyState title={t(TL.emptyNoStudents)} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(row) => row.subjectId ?? `name:${row.displayName}`}
              caption={t(EXTRA.studentsCaption)}
              initialSort={{ key: "state", direction: "asc" }}
              empty={<EmptyState title={t(SHELL_EXTRA.searchNoMatch)} />}
            />
            <MarkerLegend />
          </>
        )}
      </Section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Human review                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The three states of the marking queue, in the order a teacher works through
 * them.
 *
 * Declared as data rather than three copy-pasted blocks so the grouping, the
 * heading and the count can never disagree — each group's rows and its heading
 * come from the same entry.
 */
const GROUPS: {
  key: "pending" | "followUp" | "reviewed";
  rows: (items: readonly ReviewItem[]) => ReviewItem[];
  heading: (n: number) => Localized;
  /** The server's own count for this group. Never `rows(...).length`. */
  count: (q: ReviewQueue) => number;
  note?: Localized;
}[] = [
  {
    key: "pending",
    rows: (items) => items.filter((i) => i.review === null),
    heading: REVIEW.waiting,
    count: (q) => q.pending,
  },
  {
    key: "followUp",
    rows: (items) => items.filter((i) => i.review?.disposition === "needs_followup"),
    heading: REVIEW.groupFollowUp,
    count: (q) => q.followUp,
    note: REVIEW.followUpNote,
  },
  {
    key: "reviewed",
    rows: (items) => items.filter((i) => i.review?.disposition === "reviewed"),
    heading: REVIEW.groupReviewed,
    count: (q) => q.items.length - q.pending - q.followUp,
  },
];

/**
 * The marking a person owes, as a queue rather than a statistic.
 *
 * ## Why this is a section and not a warning
 *
 * It used to be one. `unreadableResponses` sat beside the judge-outage note as
 * a stated product boundary — *written and oral answers are not stored, you
 * cannot read them here* — because that was true. Migration 0021 made it false
 * for written work, and a console that kept the sentence would be telling a
 * teacher not to look for something that is now three lines below.
 *
 * ## Oldest first, and no other order
 *
 * A teacher with twenty minutes before a lesson should reach the learner who
 * has been waiting longest. Sorting by name would be arbitrary; sorting by how
 * much the system thinks a learner is struggling would be the console deciding
 * whose writing matters more, which is exactly the judgement this screen exists
 * to hand back to a person.
 *
 * ## The count does not go down, and the panel says why
 *
 * «Ждут проверки — N» used to count SUBMISSIONS, because submissions were the
 * only thing there was to count: nothing could record that a teacher had read
 * anything. Migration 0022 adds `human_reviews`, so the number now counts
 * outstanding work and falls when a teacher marks something.
 *
 * What did NOT change is what may be recorded. `human_reviews` has no score, no
 * percentage and no note, and migration 0016's argument — that the absent
 * column IS the guarantee explanations are never auto-graded — is preserved
 * rather than worked around. `REVIEW.noRecord` still says where a real mark
 * goes, which is the school's own register.
 */
function ReviewSection({
  review,
  classId,
  open,
  onReviewed,
}: {
  review: ReviewQueue | null;
  classId: string;
  /** The month is published. A closed month has nothing to have been sat. */
  open: boolean;
  /** A review landed; the counts on this page are stale. */
  onReviewed: () => void;
}) {
  const { t, locale } = useLocale();
  const loc = locale as Locale;
  const [openFor, setOpenFor] = useState<ReviewItem | null>(null);

  if (!review) return null;

  const columns: DataColumn<ReviewItem>[] = [
    {
      key: "student",
      header: REVIEW.colStudent,
      sortable: true,
      sortValue: (row) => row.displayName,
      render: (row) => (
        <span className={cn(TYPE.rowTitle, INK.primary)}>{row.displayName}</span>
      ),
    },
    {
      key: "task",
      header: REVIEW.colTask,
      sortable: true,
      sortValue: (row) => t(row.taskLabel),
      render: (row) => (
        <span className={cn(TYPE.body, INK.secondary)}>{t(row.taskLabel)}</span>
      ),
    },
    {
      key: "submitted",
      header: REVIEW.colSubmitted,
      sortable: true,
      sortValue: (row) => row.submittedAt,
      render: (row) => (
        <span className={cn(TYPE.meta, INK.secondary, "tabular-nums")}>
          {numericDateTime(loc, new Date(row.submittedAt))}
        </span>
      ),
    },
    {
      key: "action",
      header: REVIEW.colAction,
      align: "right",
      /*
       * One control per row, and it is a real button.
       *
       * The learner's name was the control in the first build, with the word
       * «Читать» sitting inertly in this column — two things that looked
       * clickable, one of which was. A `<tr>` cannot take focus or be
       * activated from a keyboard, so the affordance has to be an element that
       * can, and there should be exactly one of it.
       */
      /*
       * Every row opens, including the ones with no stored text.
       *
       * The first build rendered an inert lock chip for a pre-0021 submission,
       * and that reintroduced the exact defect this whole workstream exists to
       * remove: those rows are counted as pending, so a queue containing one
       * could never reach zero from this screen. The learner did the work and a
       * teacher still owes them something — the platform simply cannot show the
       * words. Opening it explains that and still lets the teacher record what
       * they decided.
       */
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          {row.readable ? null : (
            /* Lock tone, never amber. The text is missing because the learner
               submitted before the platform kept answers — nothing failed. */
            <Chip tone="lock">{t(TL.assessmentUnreadableShort)}</Chip>
          )}
          <button
            type="button"
            onClick={() => setOpenFor(row)}
            aria-label={`${t(row.readable ? REVIEW.open : REVIEW.openUnreadable)}: ${row.displayName}`}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-[7px] px-2 py-1 font-medium",
              "-mr-2 text-b-purple hover:bg-b-purple/10",
              TYPE.meta,
              MOTION.base,
            )}
          >
            {t(row.readable ? REVIEW.open : REVIEW.openUnreadable)}
            <span aria-hidden="true">→</span>
          </button>
        </span>
      ),
    },
    {
      key: "state",
      header: REVIEW.colState,
      align: "right",
      sortable: true,
      sortValue: (row) => row.review?.disposition ?? "",
      /* Amber for a follow-up because it is on the teacher's list, never
         because the child did badly — both dispositions mean the work was
         read. A pending row shows nothing rather than a third chip: the group
         it is in already says it is waiting. */
      render: (row) =>
        row.review ? (
          <Chip tone={row.review.disposition === "reviewed" ? "lock" : "warn"}>
            {t(
              row.review.disposition === "reviewed"
                ? REVIEW.stateReviewed
                : REVIEW.stateFollowUp,
            )}
          </Chip>
        ) : null,
    },
  ];


  return (
    <Section title={t(REVIEW.title)}>
      {review.items.length === 0 ? (
        /* Three empty states, and they are three different facts. The month is
           closed; the month's check is entirely machine-marked; nobody has
           submitted yet. Only the last is about the class. */
        <EmptyState
          title={t(
            !open
              ? TL.assessmentNotOpen
              : review.humanMarkedBlocks === 0
                ? REVIEW.emptyNoHumanBlocks
                : REVIEW.emptyNone,
          )}
          hint={t(
            !open
              ? EXTRA.notOpenHint
              : review.humanMarkedBlocks === 0
                ? REVIEW.emptyNoHumanBlocksHint
                : REVIEW.emptyNoneHint,
          )}
        />
      ) : (
        <div className={GAP.block}>
          {/*
            * Three groups, because they are three different states of a
            * teacher's working day and only one of them is outstanding.
            *
            * Pending is what «Ждут проверки — N» counts, and it is the number
            * that has to fall when a teacher marks something. A follow-up has
            * been READ — a person decided the class must come back to it — so
            * it leaves the pending count and stays visible in its own group
            * rather than disappearing. Reviewed is the record, kept because a
            * teacher who wants to re-read an answer needs somewhere to find it.
            *
            * `review.items` is never filtered: `unreadable` is derived from it
            * against ledger evidence, so shrinking the array would make the
            * screen report phantom unreadable answers.
            */}
          {GROUPS.map(({ key, rows, heading, note, count }) => {
            const group = rows(review.items);
            if (group.length === 0) return null;
            /* The heading's number comes from the SERVER's count, and the rows
               from the same payload. If they ever disagree the payload is
               inconsistent and the screen should show it rather than paper over
               it with a length that always matches by construction. */
            const n = count(review);
            return (
              <section key={key} className={GAP.tight}>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className={cn(TYPE.subsection, INK.primary)}>{t(heading(n))}</h3>
                  {key === "pending" && review.unreadable > 0 ? (
                    <span className={cn(TYPE.meta, INK.muted)}>
                      {t(responsesUnreadable(review.unreadable))}
                    </span>
                  ) : null}
                </div>
                {note ? (
                  <p className={cn("max-w-[76ch]", TYPE.meta, INK.muted)}>{t(note)}</p>
                ) : null}
                <DataTable
                  className="mt-3"
                  /* The pending group has no decisions in it by definition, so
                     it drops the column rather than heading three empty cells.
                     A column of nothing is a column a teacher reads once and
                     then has to keep ignoring. */
                  columns={key === "pending" ? columns.filter((c) => c.key !== "state") : columns}
                  rows={group}
                  rowKey={(row) => `${row.subjectId}:${row.blockId}`}
                  caption={t(REVIEW.caption)}
                  rowSelected={(row) =>
                    openFor?.subjectId === row.subjectId && openFor?.blockId === row.blockId
                  }
                />
              </section>
            );
          })}

          {/* What the platform holds, stated in full and told apart. Written
              work is readable; the oral defence is given in the room and no
              audio is recorded anywhere in this product. */}
          <div className={cn("flex flex-col gap-1.5 max-w-[76ch]", TYPE.meta, INK.secondary)}>
            <p>{t(TL.assessmentWrittenStored)}</p>
            <p>{t(TL.assessmentOralInPerson)}</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className={cn("max-w-[76ch]", TYPE.body, INK.secondary)}>
              {t(REVIEW.noRecord)}
            </p>
            <Hint label={t(SHELL_EXTRA.why)}>
              <p>{t(REVIEW.noRecordWhy)}</p>
            </Hint>
          </div>
        </div>
      )}

      <ReviewPanel
        classId={classId}
        subject={
          openFor
            ? { subjectId: openFor.subjectId, displayName: openFor.displayName }
            : null
        }
        onClose={() => setOpenFor(null)}
        onReviewed={onReviewed}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* The two limits                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A stated product boundary.
 *
 * A 2px spine in the tone, and nothing else — no fill, no border, no rounded
 * box. The filled amber panel this replaces made the human-review limit look
 * like an incident, and it is not one: written and oral answers are not stored
 * and nothing failed to store them. The tone is carried by the spine and the
 * heading; the sentence stays in ordinary ink so it can be read.
 */
function LimitNote({
  tone,
  title,
  count,
  body,
}: {
  tone: "warn" | "lock";
  title: string;
  /** The counted phrase, when there is a count. */
  count?: string | null;
  body: string;
}) {
  return (
    <li className="relative pl-4">
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-0.5 left-0 w-[2px] rounded-full", toneFill(tone))}
      />
      <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className={cn(TYPE.rowTitle, INK.primary)}>{title}</span>
        {count ? (
          <span className={cn("tabular-nums", TYPE.meta, INK.muted)}>{count}</span>
        ) : null}
      </p>
      <p className={cn("mt-1 max-w-[76ch]", TYPE.body, INK.secondary)}>{body}</p>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Task band                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * What the check asks for, once, and how many met it.
 *
 * The requirement, who marks it and the marking criteria are authored on the
 * block, so they are the same for every learner and belong here rather than in
 * eighteen identical table cells. The per-block meter is the one thing that
 * varies, and it is a counted ratio — «12 / 18» beside the bar, never a bar
 * over an unstated denominator.
 *
 * Rows are separated by a hairline rather than boxed: six bordered cards is six
 * frames competing with the six meters that are the actual content.
 */
function BlockKey({
  blocks,
  learners,
  open,
}: {
  blocks: readonly AssessmentBlockResult[];
  learners: readonly AssessmentLearnerRow[];
  open: boolean;
}) {
  const { t } = useLocale();

  if (blocks.length === 0) {
    /*
     * Two different reasons for an empty list, and they must not share a
     * sentence.
     *
     * The block list is derived from `learners[0].blocks` — every learner is
     * measured against the same ordered policy blocks, so the first row is the
     * key for all of them. That works until the class has no learners, at which
     * point an existing, open, authored assessment renders «В этом месяце
     * проверки нет» three hundred pixels under a heading that names it. The
     * page contradicted itself.
     */
    return learners.length === 0 ? (
      <EmptyState title={t(TL.emptyNoStudents)} hint={t(EXTRA.blockKeyNeedsLearners)} />
    ) : (
      <EmptyState title={t(EXTRA.noAssessment)} hint={t(EXTRA.noAssessmentHint)} />
    );
  }

  return (
    <ol className="flex flex-col">
      {blocks.map((block, index) => {
        const met = learners.filter((row) =>
          row.blocks.some((cell) => cell.blockId === block.blockId && cell.met),
        ).length;
        const points = block.expectedPoints ?? [];

        return (
          <li
            key={block.blockId}
            className={cn("flex gap-3 py-4", index > 0 ? cn("border-t", LINE.hair) : "pt-0")}
          >
            <span className={cn("w-4 shrink-0 pt-0.5 tabular-nums", TYPE.meta, INK.muted)}>
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <h3 className={cn("min-w-0", TYPE.rowTitle, INK.primary)}>{t(block.kindLabel)}</h3>
                {open ? (
                  <Meter
                    className="w-full max-w-[200px]"
                    value={met}
                    total={learners.length}
                    label={t(EXTRA.metByStudents)}
                  />
                ) : null}
              </div>

              <p className={cn("mt-1", TYPE.meta, INK.secondary)}>
                {t(EXTRA.requirementLabel)}: {t(requiredLevel(block.required))}
                <span aria-hidden="true" className={cn("px-1.5", INK.muted)}>
                  ·
                </span>
                {t(block.machineGradable ? EXTRA.markedByMachine : EXTRA.markedByHuman)}
              </p>

              {/* Kept visible, not disclosed: it changes how the meter above is
                  read. A met requirement on this block is a person's judgement,
                  not a verdict a machine produced. */}
              {!block.machineGradable ? (
                <p className={cn("mt-1 max-w-[72ch]", TYPE.meta, INK.muted)}>
                  {t(TL.blockNotMachineGraded)}
                </p>
              ) : null}

              {points.length > 0 ? (
                <Hint label={t(EXTRA.markingCriteria)} className="mt-2">
                  <p className={cn(TYPE.meta, INK.muted)}>{t(TL.assessmentExpectedPoints)}</p>
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {points.map((point, pointIndex) => (
                      <li key={`${block.blockId}:${pointIndex}`} className="flex gap-2">
                        <span aria-hidden="true" className={INK.muted}>
                          ·
                        </span>
                        <span>{richText(t(point))}</span>
                      </li>
                    ))}
                  </ul>
                  <p className={cn("mt-2", TYPE.meta, INK.muted)}>{t(EXTRA.expectedPointsNote)}</p>
                </Hint>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* -------------------------------------------------------------------------- */
/* The status strip                                                           */
/* -------------------------------------------------------------------------- */

/** Which mark a block gets. Three, and they differ by shape as well as tone. */
type MarkerVariant = "met" | "short" | "untouched";

const MARKER_TONE: Record<MarkerVariant, Tone> = {
  met: "ok",
  short: "warn",
  untouched: "lock",
};

function variantOf(block: AssessmentBlockResult): MarkerVariant {
  if (block.met) return "met";
  /* `reached` is compared, never rendered: it is a machine rung name and the
     payload ships `reachedLabel` beside it for exactly this reason. */
  return block.reached === "none" ? "untouched" : "short";
}

/**
 * One 14px mark.
 *
 * Solid, ringed-with-a-dot, hollow. Three shapes, not three colours: the strip
 * is the densest thing on the page and roughly one boy in twelve cannot
 * separate the green from the amber, so the tone is the second cue and the fill
 * is the first. The word arrives twice more — in the marker's accessible name
 * and in the legend under the table.
 */
function MarkerShape({ variant }: { variant: MarkerVariant }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block size-[14px] shrink-0", toneText(MARKER_TONE[variant]))}
    >
      {variant === "met" ? (
        <span className="block size-full rounded-[4px] bg-current" />
      ) : variant === "short" ? (
        <span className="grid size-full place-items-center rounded-[4px] border-[1.5px] border-current">
          <span className="block size-[4px] rounded-full bg-current" />
        </span>
      ) : (
        <span className="block size-full rounded-[4px] border-[1.5px] border-current" />
      )}
    </span>
  );
}

/**
 * Every block for one learner, as a run of marks with the detail behind them.
 *
 * ## Why this is not six columns any more
 *
 * It was. Six blocks put the learner table over a 1290px minimum, which on a
 * 1280 laptop is a table wider than the viewport inside a scroll box the page
 * then fought. A strip is one column at any block count.
 *
 * ## Why a `<details>` and not a tooltip or a modal
 *
 * The strip is a summary in the literal sense, and the thing a teacher wants
 * next is the same three sentences per block the old chips carried. `<details>`
 * is keyboard-operable, announced as a disclosure, and — because a collapsed
 * `<details>` contributes nothing to `max-content` — it costs the closed table
 * no width at all. The open panel is width-capped so expanding a row cannot
 * push the table sideways.
 */
function BlockStrip({ blocks }: { blocks: readonly AssessmentBlockResult[] }) {
  const { t } = useLocale();

  if (blocks.length === 0) {
    return <span className={cn(TYPE.meta, INK.muted)}>{t(TL.noData)}</span>;
  }

  return (
    <details className="group">
      <summary
        className={cn(
          "-mx-1.5 inline-flex cursor-pointer list-none items-center gap-2 rounded-[7px] px-1.5 py-1",
          SURFACE.hover,
          MOTION.base,
        )}
      >
        <span className="flex items-center gap-1">
          {blocks.map((block, index) => (
            <span
              key={block.blockId}
              role="img"
              aria-label={t(
                blockMarker(index, block.kindLabel, block.reachedLabel, block.met),
              )}
              className="block"
            >
              <MarkerShape variant={variantOf(block)} />
            </span>
          ))}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={cn("shrink-0 group-open:rotate-180", INK.muted, MOTION.transform)}
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>

      <dl className="mt-2 flex w-[188px] flex-col gap-2">
        {blocks.map((block, index) => {
          const variant = variantOf(block);
          return (
            <div key={block.blockId}>
              <dt className={cn(TYPE.meta, INK.muted)}>
                {index + 1}. {t(block.kindLabel)}
              </dt>
              <dd className={cn("mt-0.5 flex items-start gap-1.5", TYPE.meta)}>
                <span className="mt-[2px]">
                  <MarkerShape variant={variant} />
                </span>
                <span className={INK.primary}>
                  {t(block.reachedLabel)}
                  <span aria-hidden="true" className={cn("px-1", INK.muted)}>
                    ·
                  </span>
                  <span className={toneText(MARKER_TONE[variant])}>
                    {t(block.met ? EXTRA.requirementMet : EXTRA.requirementNotMet)}
                  </span>
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </details>
  );
}

/** What the three marks mean, in words, under the table they appear in. */
function MarkerLegend() {
  const { t } = useLocale();
  const keys: readonly { variant: MarkerVariant; label: Localized }[] = [
    { variant: "met", label: EXTRA.requirementMet },
    { variant: "short", label: EXTRA.requirementNotMet },
    { variant: "untouched", label: EXTRA.blockNotStarted },
  ];
  return (
    <ul className={cn("mt-3 flex flex-wrap items-center gap-x-6 gap-y-2", TYPE.meta, INK.muted)}>
      {keys.map(({ variant, label }) => (
        <li key={variant} className="flex items-center gap-2">
          <MarkerShape variant={variant} />
          <span>{t(label)}</span>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The assessment table, as a file.
 *
 * `?locale=` because there is no server-side locale in this product and a CSV
 * opened in Excel with `solvedIndependent` as a heading is the same defect as
 * machine vocabulary on screen. The note beside the button says what does and
 * does not leave — it is a promise the route keeps, not reassurance.
 */
function ExportCsv({ classId, locale }: { classId: string; locale: Locale }) {
  const { t } = useLocale();
  const href = `/api/teacher/class/${encodeURIComponent(classId)}/export?kind=assessment&locale=${locale}`;
  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <a
        href={href}
        download
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-[10px] border px-3.5",
          LINE.edge,
          TYPE.body,
          "font-medium",
          INK.primary,
          SURFACE.hover,
          MOTION.base,
        )}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 2v8m0 0L5 7m3 3l3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2.5 11.5v1A1.5 1.5 0 004 14h8a1.5 1.5 0 001.5-1.5v-1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {t(TL.exportCsv)}
      </a>
      <p className={cn("max-w-[38ch] sm:text-right", TYPE.meta, INK.muted)}>{t(TL.exportNote)}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A learner's state, as a badge.
 *
 * Not `StatusBadge`: that one is total over `LearnerStatus`, which is a
 * different union with a different meaning, and widening it to take either
 * would produce a component whose props do not say what it renders.
 */
function StateBadge({ state }: { state: AssessmentState }): ReactNode {
  const { t } = useLocale();
  return (
    <Chip tone={STATE_TONE[state]}>
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current" />
      {t(STATE_LABEL[state])}
    </Chip>
  );
}

/** The middle value, or `null` for an empty population. Never 0 for "nobody". */
function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}
