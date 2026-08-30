"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale, Localized } from "@schools/curriculum/types";
import { dayMonthShort, monthLong, numericDate, numericDateTime } from "@schools/presentation/dates";
import {
  teacherLoadFailure,
  teacherLoadFailureLabel,
  type TeacherLoadFailure,
} from "@schools/presentation/teacher-outcome";
import type {
  AssessmentLearnerRow,
  AssessmentState,
  Finding,
  Strength,
  StudentDetail as StudentDetailPayload,
  TeacherPeriod,
} from "@schools/teacher/contracts";
import { TL, inEpisodes } from "@schools/teacher/labels";
/* The shell's catalogue already names the evidence-state column, and one name
   for one concept beats a second spelling of it three files away. */
import { EXTRA as SHELL } from "@schools/teacher/labels-extra/shell";
import { EXTRA, taskNumber } from "@schools/teacher/labels-extra/student";
import { REVIEW } from "@schools/teacher/labels-extra/assessments";
import { useLocale } from "@/components/sx/i18n";
import { cn } from "@/lib/utils";
import { useTeacherView } from "./shell";
import { ReviewPanel } from "./review-panel";
import { GAP, INK, LINE, MOTION, NUM, RADIUS, TYPE } from "./tokens";
import {
  BarChart,
  Chip,
  DataTable,
  EmptyState,
  EvidenceDot,
  Finding as FindingLine,
  Hint,
  Meter,
  Num,
  Section,
  StatRow,
  StatTile,
  StatusBadge,
  type ChartBucket,
  type DataColumn,
} from "./ui";
import {
  minutes as fmtMinutes,
  share as fmtShare,
  toneChip,
  toneFill,
  toneText,
  type Tone,
} from "./format";

/**
 * One learner, in depth — as a briefing rather than a report.
 *
 * ## The reading order
 *
 * A teacher has about three minutes and one question: *what is going on with
 * this child, and what do I do?* So the page answers it in the first screen —
 * who this is, then **what needs attention** beside **what is going well** — and
 * everything under that is the evidence for those two columns, in descending
 * order of how often it is actually consulted.
 *
 * The first build rendered nine sections of equal weight, each with its own
 * heading and its own two sentences of methodology, and the one fact that
 * matters was section two of nine. That is the specific defect this layout is
 * not allowed to repeat.
 *
 * ## The two clocks, and why every number still says which one it is on
 *
 * Half of what a teacher wants here is RECENT — what happened this week — and
 * half is ESTABLISHED — which skills this learner has independent evidence on
 * after two months. The first is windowed SQL over `attempt_episodes`; the
 * second is `learner_state`, which is all-time by construction and cannot
 * honestly be windowed.
 *
 * The old panel put «18 попыток» (all-time, including skill-less episodes) on
 * the same line as «5 самостоятельно» (per-skill, skill-bearing only) with
 * nothing to explain the gap. So the evidence band is TWO groups, each headed
 * with the window it is measured over, and the skill table states which clock it
 * is on. What moved into a disclosure is the *explanation* of the difference —
 * needed once — never the labels themselves.
 *
 * ## What is deliberately absent
 *
 * The learner's conversation with Nova. It is not stored anywhere — the payload
 * allowlist has no text key, `interventions.content_hash` is never written, and
 * the chat lives in browser state alone. The assistance section states that as a
 * property rather than leaving an absence for someone to fill in later.
 *
 * No mastery percentage and no composite score, here or anywhere. Every number
 * below is a count a teacher can audit, and every ratio prints the two counts it
 * was made from.
 */

/* -------------------------------------------------------------------------- */
/* Label maps                                                                 */
/* -------------------------------------------------------------------------- */

const WINDOW_LABEL: Record<TeacherPeriod, Localized> = {
  week: TL.windowWeek,
  month: TL.windowMonth,
  programme: TL.windowProgramme,
};

const ASSESSMENT_STATE: Record<AssessmentState, { label: Localized; tone: Tone }> = {
  /* An absence, not a fault: the month is not being served yet. */
  not_open: { label: TL.assessmentNotOpen, tone: "lock" },
  not_started: { label: TL.assessmentStateNotStarted, tone: "lock" },
  in_progress: { label: TL.assessmentStateInProgress, tone: "info" },
  /* Amber, because nobody has actually been asked to look — see the note the
     section renders under it. */
  awaiting_review: { label: TL.assessmentStateAwaitingReview, tone: "warn" },
  complete: { label: TL.assessmentStateComplete, tone: "ok" },
};

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export interface StudentDetailProps {
  /** From the route segment. Untrusted — the API answers 404 for a stranger. */
  subjectId: string;
}

export function StudentDetail({ subjectId }: StudentDetailProps) {
  const { locale, t } = useLocale();
  const { classId, period, query, report } = useTeacherView();

  /*
   * One state cell, stamped with the request that produced it.
   *
   * The alternative — clearing `data` at the top of the effect — is a setState
   * inside an effect body, which cascades a render on every period change. This
   * shape gets the same behaviour for free: a result whose stamp does not match
   * the request the page is now making is simply not read, so switching class or
   * period shows the loading line rather than the previous learner's numbers.
   *
   * `failure` is a CLOSED union, never a string. Whatever comes back — a guard
   * reason, an unexpected field, a proxy's HTML error page that the JSON parser
   * complains about — goes through `teacherLoadFailure` to one of three
   * sentences we wrote. There is no value a failure can carry to the screen.
   */
  const [loaded, setLoaded] = useState<{
    key: string;
    data: StudentDetailPayload | null;
    failure: TeacherLoadFailure | null;
  } | null>(null);

  const requestKey = `${classId} ${subjectId} ${period}`;
  /* Bumped when a review lands, so the page reloads and shows what the server
     holds rather than a patched-in-place copy of it. Same reasoning as the
     assessments page: four derived numbers on one screen, and hand-patching
     would eventually miss one. */
  const [revision, setRevision] = useState(0);
  const refetch = useCallback(() => setRevision((n) => n + 1), []);
  const current = loaded?.key === requestKey ? loaded : null;
  const data = current?.data ?? null;
  const failure = current?.failure ?? null;

  useEffect(() => {
    if (!classId || !subjectId) return;
    let live = true;

    fetch(
      `/api/teacher/class/${encodeURIComponent(classId)}/students/${encodeURIComponent(
        subjectId,
      )}?period=${encodeURIComponent(period)}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          /* The body may not be JSON at all, and a failure to read it is just
             another way of saying "unavailable" — never something to propagate. */
          const reason = await response
            .json()
            .then((body: { error?: unknown }) => body?.error)
            .catch(() => null);
          if (live) {
            setLoaded({ key: requestKey, data: null, failure: teacherLoadFailure(reason) });
          }
          return;
        }
        const payload = (await response.json()) as StudentDetailPayload;
        if (!live) return;
        setLoaded({ key: requestKey, data: payload, failure: null });
        /* The chrome does not fetch a second time — the page that already has
           the context and the freshness reports them up. */
        report({ context: payload.context, freshness: payload.freshness });
      })
      /* No parameter, deliberately: there is nothing in a network error a
         teacher can act on, and reading it is how it ends up rendered. */
      .catch(() => {
        if (live) setLoaded({ key: requestKey, data: null, failure: "unavailable" });
      });

    return () => {
      live = false;
    };
  }, [classId, subjectId, period, requestKey, report, revision]);

  const rosterHref = query ? `/teacher/students?${query}` : "/teacher/students";

  if (failure) {
    return (
      <>
        <BackLink href={rosterHref} label={t(EXTRA.backToRoster)} />
        <div className="mt-6">
          <EmptyState title={t(teacherLoadFailureLabel(failure))} />
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <BackLink href={rosterHref} label={t(EXTRA.backToRoster)} />
        <p className={cn("mt-8", TYPE.body, INK.muted)}>{t(TL.loading)}</p>
      </>
    );
  }

  return (
    <>
      <BackLink href={rosterHref} label={t(EXTRA.backToRoster)} />
      {/* The briefing: who, then what needs doing. */}
      <IdentityBar data={data} locale={locale} />
      <StorySection data={data} locale={locale} />
      {/* The evidence for it, in the order it is consulted. */}
      <EvidenceSection data={data} locale={locale} />
      <SkillsSection data={data} locale={locale} />
      <LessonsSection data={data} locale={locale} />
      <AssessmentSection
        assessment={data.assessment}
        locale={locale}
        classId={classId}
        subjectId={subjectId}
        displayName={data.row.displayName}
        onReviewed={refetch}
      />
      <AssistanceSection data={data} />
      <ReviewsSection data={data} locale={locale} />
      <ActivitySection data={data} locale={locale} />
      <TimelineSection data={data} locale={locale} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 1 — identity                                                               */
/* -------------------------------------------------------------------------- */

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 hover:text-b-fg",
        TYPE.meta,
        INK.muted,
        MOTION.base,
      )}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M10 3L5 8L10 13"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </Link>
  );
}

/**
 * Who this is, and where they are in the course — on two rows, not six cells.
 *
 * The first build spent a four-column definition grid on this: six labels in
 * caps over six values, roughly 120px of chrome above the one thing the teacher
 * came for. None of those six facts is worth a headline; together they are the
 * caption under the name. So they are a single wrapping rail at metadata weight,
 * and the name and the status keep the emphasis.
 *
 * The shell owns the `<h1>` (the class), so the learner is an `<h2>`.
 */
function IdentityBar({ data, locale }: { data: StudentDetailPayload; locale: Locale }) {
  const { t } = useLocale();
  const { row, context } = data;
  const lastActive = row.lastActiveAt ? new Date(row.lastActiveAt) : null;
  const lastWorked = row.lastWorkedAt ? new Date(row.lastWorkedAt) : null;

  return (
    <header className="mt-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className={cn(TYPE.page, INK.primary)}>{row.displayName}</h2>
        <StatusBadge status={row.status} />
      </div>

      <dl className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <Fact label={t(TL.classLabel)}>{context.className}</Fact>
        <Fact label={t(TL.monthLabel)}>
          <span className="tabular-nums">{context.monthIndex}</span>
          <Dot />
          {t(context.monthTitle)}
        </Fact>
        <Fact label={t(TL.colTopic)}>
          {row.currentTopic ? (
            t(row.currentTopic.title)
          ) : (
            <span className={INK.muted}>{t(EXTRA.currentTopicNone)}</span>
          )}
        </Fact>
        <Fact label={t(TL.colRequired)}>
          <Meter
            value={row.requiredWork.completed}
            total={row.requiredWork.total}
            label={t(TL.colRequired)}
            className="w-[150px]"
          />
        </Fact>
        <Fact label={t(TL.colLastActive)}>
          {lastActive ? (
            <span className="tabular-nums">{numericDateTime(locale, lastActive)}</span>
          ) : (
            <span className={INK.muted}>{t(TL.never)}</span>
          )}
        </Fact>
        <Fact label={t(EXTRA.lastWorked)}>
          {lastWorked ? (
            <span className="tabular-nums">{numericDateTime(locale, lastWorked)}</span>
          ) : (
            <span className={INK.muted}>{t(TL.never)}</span>
          )}
        </Fact>
      </dl>
    </header>
  );
}

/** One label-and-value pair on the identity rail. */
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <dt className={cn("shrink-0", TYPE.meta, INK.muted)}>{label}</dt>
      <dd className={cn("min-w-0", TYPE.meta, INK.primary)}>{children}</dd>
    </div>
  );
}

/** A separator, never a word. */
function Dot() {
  return (
    <span aria-hidden="true" className={cn("px-1", INK.muted)}>
      ·
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* 2 — the story                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The ten-second read: what needs attention, and what is going well.
 *
 * Directly under the name, with no rule above it — this band and the identity
 * bar are one object, and everything below the first rule is evidence for them.
 *
 * Every finding names a checkable cause and carries a fixed recommendation
 * chosen by a `switch` over its kind — never generated. A finding a teacher
 * cannot disagree with on the evidence does not belong on this screen, so the
 * skill it concerns and the date it became true are rendered beside it.
 *
 * **An empty left column is a good outcome and reads as one.** It gets a real
 * sentence, in the same ink as a finding, rather than the blank panel a teacher
 * would read as a load failure.
 */
function StorySection({ data, locale }: { data: StudentDetailPayload; locale: Locale }) {
  const { t } = useLocale();
  const { findings, strengths } = data.row;

  return (
    <Section title={t(EXTRA.profileTitle)} className="border-t-0 pt-6">
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div>
          <h3 className={cn(TYPE.subsection, INK.primary)}>{t(EXTRA.findingsTitle)}</h3>
          {findings.length === 0 ? (
            <p className={cn("mt-2.5 max-w-[54ch]", TYPE.body, INK.secondary)}>
              {t(EXTRA.findingsNone)}
            </p>
          ) : (
            <ul className="mt-2.5">
              {findings.map((finding, index) => (
                <AttentionItem key={`${finding.kind}-${index}`} finding={finding} locale={locale} />
              ))}
            </ul>
          )}
        </div>

        {/* Narrower on purpose: a child who is flying is not a reason to look
            past one who is stuck, and the layout should not suggest otherwise. */}
        <div>
          <h3 className={cn(TYPE.subsection, INK.primary)}>{t(EXTRA.strengthsTitle)}</h3>
          {strengths.length === 0 ? (
            <p className={cn("mt-2.5 max-w-[54ch]", TYPE.body, INK.secondary)}>
              {t(EXTRA.strengthsNone)}
            </p>
          ) : (
            <ul className="mt-2.5">
              {strengths.map((strength, index) => (
                <StrengthItem key={`${strength.kind}-${index}`} strength={strength} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}

/**
 * One finding, on a spine.
 *
 * WHY (the finding's own sentence, body ink) → CONTEXT (skill, since) → WHAT TO
 * DO (indented, after the arrow). The 2px amber edge is the scanning cue; the
 * column heading beside it is the word, so the colour never travels alone.
 */
function AttentionItem({ finding, locale }: { finding: Finding; locale: Locale }) {
  const { t } = useLocale();
  const hasContext = Boolean(finding.skillTitle || finding.since);

  return (
    <li className={cn("relative border-t py-3.5 pl-4 first:border-t-0", LINE.hair)}>
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-4 left-0 w-[2px] rounded-full", toneFill("warn"))}
      />
      <FindingLine
        reason={t(finding.detail)}
        context={
          hasContext ? (
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {finding.skillTitle ? <span>{t(finding.skillTitle)}</span> : null}
              {finding.since ? (
                <span className="tabular-nums">
                  {t(TL.since)}: {numericDate(locale, new Date(finding.since))}
                </span>
              ) : null}
            </span>
          ) : undefined
        }
        action={t(finding.recommendation)}
      />
    </li>
  );
}

/**
 * A strength never outranks a finding, so it gets no spine and no green fill —
 * the column it sits in already says what it is. `skillIds` is deliberately not
 * rendered: it is a list of raw identifiers and `detail` already says what it
 * means.
 */
function StrengthItem({ strength }: { strength: Strength }) {
  const { t } = useLocale();
  return (
    <li className={cn("border-t py-3 first:border-t-0", LINE.hair)}>
      <p className={cn(TYPE.body, INK.primary)}>{t(strength.detail)}</p>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* 3 — learning evidence                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Two groups, two clocks, both labelled.
 *
 * The windowed rail moves with the period selector. The cumulative one does not
 * and cannot: it comes from `learner_state`, which is all-time by construction.
 * Mixing them silently is the audit's finding on the old panel, so each group
 * states its window in the heading.
 *
 * What moved into the `Hint` is the sentence explaining *why* the two rows
 * differ — read once, then in the way forever. `unexplainedNote` did NOT move:
 * "the system could not establish a cause for these errors, so the rest of the
 * numbers are incomplete" changes how every figure above it is read.
 */
function EvidenceSection({ data, locale }: { data: StudentDetailPayload; locale: Locale }) {
  const { t } = useLocale();
  const { row, cumulative } = data;

  const windowLabel = t(WINDOW_LABEL[data.period.period]);
  const solved = row.solvedIndependent + row.solvedAssisted;
  const independentPct = fmtShare(row.independentShare);
  const practice = fmtMinutes(row.practiceMinutes);
  const computedAt = cumulative.computedAt ? new Date(cumulative.computedAt) : null;

  return (
    <Section title={t(EXTRA.evidenceTitle)}>
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <GroupHeading title={t(EXTRA.groupWindowed)} window={windowLabel} />
          <Hint label={t(EXTRA.howCounted)}>
            <p>{t(EXTRA.evidenceLead)}</p>
          </Hint>
        </div>
        <div className={GAP.heading}>
          <StatRow columns={6}>
            <StatTile
              label={t(TL.colIndependent)}
              value={row.solvedIndependent}
              denominator={solved > 0 ? solved : null}
              tone="ok"
              sub={
                independentPct ? (
                  <span className="tabular-nums">
                    {t(EXTRA.independentShare)}: {independentPct}
                  </span>
                ) : (
                  /* Nothing was solved, so there is no share — and a share of an
                     empty denominator is not 0%, it is a question nobody can
                     answer yet. */
                  t(TL.emptyNotMeasured)
                )
              }
            />
            <StatTile label={t(TL.colAssisted)} value={row.solvedAssisted} />
            <StatTile label={t(TL.colAttempts)} value={row.submissions} />
            <StatTile
              label={t(TL.colPractice)}
              value={practice}
              sub={practice === null ? undefined : t(TL.minutesShort)}
            />
            <StatTile label={t(TL.colDays)} value={row.activeDays} />
            <StatTile label={t(TL.colHelp)} value={row.interventions} />
          </StatRow>
        </div>
      </div>

      <div className={cn("mt-5 border-t pt-5", LINE.hair)}>
        <GroupHeading title={t(EXTRA.groupCumulative)} window={t(TL.windowCumulative)} />
        <div className={GAP.heading}>
          <StatRow columns={6}>
            <StatTile label={t(TL.colAttempts)} value={cumulative.episodes} />
            <StatTile label={t(TL.colIndependent)} value={cumulative.soloSolved} tone="ok" />
            <StatTile label={t(TL.colAssisted)} value={cumulative.assistedSolved} />
            <StatTile label={t(TL.colHelp)} value={cumulative.interventions} />
            <StatTile
              label={t(EXTRA.unexplainedLabel)}
              value={cumulative.unexplainedFailures}
              tone={cumulative.unexplainedFailures > 0 ? "warn" : "neutral"}
            />
            <StatTile
              label={t(EXTRA.transferLabel)}
              value={cumulative.transferSolves}
              tone={cumulative.transferSolves > 0 ? "warn" : "neutral"}
            />
          </StatRow>
        </div>

        {/* Stays on the page: it says the numbers above are incomplete. */}
        <p className={cn("mt-3 max-w-[76ch]", TYPE.meta, INK.muted)}>
          {t(EXTRA.unexplainedNote)}
          {computedAt ? (
            <>
              {" "}
              <span className="tabular-nums">
                {t(TL.computedAt)}: {numericDateTime(locale, computedAt)}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </Section>
  );
}

/** A group of tiles, with the window it is measured over stated beside it. */
function GroupHeading({ title, window: windowLabel }: { title: string; window: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
      <h3 className={cn(TYPE.subsection, INK.primary)}>{title}</h3>
      <span className={cn(TYPE.meta, INK.muted)}>{windowLabel}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4 — skill profile                                                          */
/* -------------------------------------------------------------------------- */

type SkillRow = StudentDetailPayload["skills"][number];

/**
 * Every skill the curriculum has introduced so far, including the untouched
 * ones — hiding those would let the page imply the curriculum is only what has
 * been attempted.
 *
 * The lead sentence stays visible rather than moving into a disclosure: it says
 * this table is on the OTHER clock from the rail above it, which is a fact about
 * how every row is read.
 *
 * `rationale` is never rendered: it is the engine's own English machine prose.
 * `summary` says the same thing, built from the same counts, in the teacher's
 * language. `failureClass` is never rendered either; the `label` beside it is.
 */
function SkillsSection({ data, locale }: { data: StudentDetailPayload; locale: Locale }) {
  const { t } = useLocale();

  const columns = useMemo<DataColumn<SkillRow>[]>(
    () => [
      {
        key: "skill",
        header: TL.colSkill,
        width: "22%",
        sortable: true,
        sortValue: (row) => t(row.title),
        render: (row) => <span className={cn(TYPE.rowTitle, INK.primary)}>{t(row.title)}</span>,
      },
      {
        key: "state",
        header: SHELL.evidenceState,
        width: "150px",
        sortable: true,
        sortValue: (row) => EVIDENCE_ORDER[row.state],
        render: (row) => <EvidenceDot state={row.state} />,
      },
      {
        key: "attempts",
        header: TL.colAttempts,
        align: "right",
        sortable: true,
        sortValue: (row) => row.attempts,
        render: (row) => <Num value={row.attempts} />,
      },
      {
        key: "solo",
        header: TL.colIndependent,
        align: "right",
        sortable: true,
        sortValue: (row) => row.soloSolved,
        render: (row) => <Num value={row.soloSolved} tone="ok" />,
      },
      {
        key: "assisted",
        header: TL.colAssisted,
        align: "right",
        sortable: true,
        sortValue: (row) => row.assistedSolved,
        render: (row) => <Num value={row.assistedSolved} />,
      },
      {
        key: "summary",
        header: EXTRA.colSummary,
        width: "24%",
        render: (row) => <span className={cn(TYPE.meta, INK.secondary)}>{t(row.summary)}</span>,
      },
      {
        key: "mistakes",
        header: TL.colTopMistake,
        width: "26%",
        render: (row) =>
          row.misconceptions.length === 0 ? null : (
            <ul className="flex flex-col gap-1.5">
              {row.misconceptions.map((m) => (
                <li key={m.failureClass} className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Chip tone="warn">{t(m.label)}</Chip>
                  {/* The counts stay beside the claim: a misconception a teacher
                      cannot check is one they cannot disagree with. */}
                  <span className={cn("tabular-nums", TYPE.meta, INK.secondary)}>
                    {t(inEpisodes(m.distinctEpisodes))}
                  </span>
                  <span className={cn("tabular-nums", TYPE.meta, INK.muted)}>
                    {t(EXTRA.lastSeen)}: {numericDate(locale, new Date(m.lastSeenAt))}
                  </span>
                </li>
              ))}
            </ul>
          ),
      },
    ],
    [t, locale],
  );

  return (
    <Section title={t(EXTRA.skillProfileTitle)} description={t(EXTRA.skillProfileLead)}>
      <DataTable
        columns={columns}
        rows={data.skills}
        rowKey={(row) => row.skillId}
        caption={t(EXTRA.skillProfileTitle)}
        empty={<EmptyState title={t(TL.noData)} hint={t(TL.emptyInsufficientEvidence)} />}
      />
    </Section>
  );
}

/** Worst-first when sorted descending: `needs_review` is the state to look at. */
const EVIDENCE_ORDER: Record<SkillRow["state"], number> = {
  not_started: 0,
  learning: 1,
  practicing: 2,
  independent_evidence: 3,
  needs_review: 4,
};

/* -------------------------------------------------------------------------- */
/* 5 — lessons                                                                */
/* -------------------------------------------------------------------------- */

type LessonRow = StudentDetailPayload["lessons"][number];

function LessonsSection({ data, locale }: { data: StudentDetailPayload; locale: Locale }) {
  const { t } = useLocale();

  const columns = useMemo<DataColumn<LessonRow>[]>(
    () => [
      {
        key: "lesson",
        header: TL.colLesson,
        width: "46%",
        sortable: true,
        sortValue: (row) => t(row.title),
        render: (row) => <span className={cn(TYPE.body, INK.primary)}>{t(row.title)}</span>,
      },
      {
        key: "progress",
        header: TL.colRequired,
        width: "220px",
        sortable: true,
        sortValue: (row) => (row.total > 0 ? row.reached / row.total : null),
        render: (row) => <Meter value={row.reached} total={row.total} label={t(TL.colRequired)} />,
      },
      {
        key: "completed",
        header: TL.colCompleted,
        sortable: true,
        sortValue: (row) => row.completedAt,
        render: (row) =>
          row.completedAt ? (
            <span className={cn("tabular-nums", TYPE.meta, INK.secondary)}>
              {numericDate(locale, new Date(row.completedAt))}
            </span>
          ) : (
            /* Not a failure — the lesson is simply still open. */
            <span className={cn(TYPE.meta, INK.muted)}>{t(EXTRA.lessonNotCompleted)}</span>
          ),
      },
    ],
    [t, locale],
  );

  return (
    <Section title={t(TL.lessonsTitle)}>
      <DataTable
        columns={columns}
        rows={data.lessons}
        rowKey={(row) => row.lessonId}
        caption={t(TL.lessonsTitle)}
        empty={<EmptyState title={t(TL.noData)} hint={t(EXTRA.lessonsNone)} />}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 6 — assessment                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A caveat that changes how the numbers are read. Never a disclosure.
 *
 * Two callers: a coding block that was submitted and never judged, and an
 * assistance provider that was degraded to canned sentences. Both mean "this
 * measurement is not what it appears to be", and both are one line.
 */
function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      className={cn("border px-4 py-3 font-medium", RADIUS.control, TYPE.body, toneChip("warn"))}
    >
      {children}
    </p>
  );
}

/**
 * The monthly check.
 *
 * Two honesty rules run this section. `unmeasuredCoding` means a coding block
 * was submitted and never judged — that is a judge outage, not a learner who
 * did not sit the check, and it stays a band rather than a footnote.
 *
 * The second rule used to be that human-marked prose was stored nowhere, so
 * this screen refused to imply there was anything to open. Migration 0021 keeps
 * the learner's words, so the refusal became the wrong answer: the row now
 * carries a control that opens exactly what the child wrote. This is the
 * "where can I inspect the evidence" end of the page, and it is one click from
 * the claim rather than a page away.
 */
function AssessmentSection({
  assessment,
  locale,
  classId,
  subjectId,
  displayName,
  onReviewed,
}: {
  assessment: AssessmentLearnerRow | null;
  locale: Locale;
  classId: string;
  subjectId: string;
  displayName: string;
  /** A review landed here; the page's own assessment band is stale. */
  onReviewed: () => void;
}) {
  const { t } = useLocale();
  const [reviewOpen, setReviewOpen] = useState(false);

  if (!assessment) {
    return (
      <Section title={t(TL.assessmentsTitle)}>
        <EmptyState title={t(EXTRA.assessmentNone)} />
      </Section>
    );
  }

  const state = ASSESSMENT_STATE[assessment.state];
  const spent = fmtMinutes(assessment.minutes);

  return (
    <Section title={t(TL.assessmentsTitle)}>
      <div className={GAP.block}>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Chip tone={state.tone}>{t(state.label)}</Chip>
          {assessment.completedAt ? (
            <span className={cn(TYPE.meta, INK.muted)}>
              {t(EXTRA.assessmentCompletedAt)}:{" "}
              <span className="tabular-nums">
                {numericDateTime(locale, new Date(assessment.completedAt))}
              </span>
            </span>
          ) : null}
          <span className={cn(TYPE.meta, INK.muted)}>
            {t(EXTRA.assessmentMinutes)}:{" "}
            {spent === null ? (
              t(TL.emptyNotMeasured)
            ) : (
              <span className="tabular-nums">
                {spent} {t(TL.minutesShort)}
              </span>
            )}
          </span>
        </div>

        {assessment.unmeasuredCoding ? <Notice>{t(TL.assessmentUnmeasured)}</Notice> : null}

        {assessment.blocks.length === 0 ? (
          <EmptyState title={t(TL.noData)} hint={t(TL.emptyInsufficientEvidence)} />
        ) : (
          <ul className={cn("border", RADIUS.panel, LINE.hair)}>
            {assessment.blocks.map((block, index) => (
              <li
                key={block.blockId}
                className={cn("border-t px-4 py-3.5 first:border-t-0 sm:px-5", LINE.hair)}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className={cn(TYPE.rowTitle, INK.primary)}>{t(taskNumber(index + 1))}</span>
                  <Chip tone="neutral">{t(block.kindLabel)}</Chip>
                  <Chip tone={block.met ? "ok" : "lock"}>{t(block.reachedLabel)}</Chip>
                  <span className={cn(TYPE.meta, toneText(block.met ? "ok" : "neutral"))}>
                    {t(block.met ? EXTRA.requirementMet : EXTRA.requirementNotMet)}
                  </span>
                  {/* Human-marked and answered: the learner's own words are on
                      file, and this opens them. A control rather than a chip —
                      the whole point of the row is that a person has to read
                      something, and the reading starts here. */}
                  {!block.machineGradable && block.reached !== "none" ? (
                    <button
                      type="button"
                      onClick={() => setReviewOpen(true)}
                      className={cn(
                        "cursor-pointer rounded-[6px] font-medium text-b-purple",
                        "underline-offset-2 hover:underline",
                        TYPE.meta,
                        MOTION.base,
                      )}
                    >
                      {t(REVIEW.open)}
                    </button>
                  ) : null}
                </div>

                {block.expectedPoints && block.expectedPoints.length > 0 ? (
                  <div className="mt-2.5">
                    <p className={cn(TYPE.meta, INK.muted)}>{t(TL.assessmentExpectedPoints)}</p>
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {block.expectedPoints.map((point, pointIndex) => (
                        <li
                          key={pointIndex}
                          className={cn("flex gap-2", TYPE.meta, INK.secondary)}
                        >
                          <span aria-hidden="true" className={INK.muted}>
                            ·
                          </span>
                          {t(point)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {/* What the platform holds, told apart. Written work is readable; the
            oral defence happens in the room and no audio is recorded anywhere
            in this product, so the note the learner typed is all there is. */}
        {assessment.blocks.some((b) => !b.machineGradable) ? (
          <div className={cn("flex flex-col gap-1.5 max-w-[76ch]", TYPE.meta, INK.muted)}>
            <p>{t(TL.assessmentWrittenStored)}</p>
            <p>{t(TL.assessmentOralInPerson)}</p>
          </div>
        ) : null}
      </div>

      <ReviewPanel
        classId={classId}
        subject={reviewOpen ? { subjectId, displayName } : null}
        onClose={() => setReviewOpen(false)}
        onReviewed={onReviewed}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 7 — assistance                                                             */
/* -------------------------------------------------------------------------- */

type LevelRow = StudentDetailPayload["assistance"]["byLevel"][number];

/**
 * What Nova was asked for, and what happened in the twenty minutes after.
 *
 * Never the conversation: chat content is not stored anywhere, and
 * `TL.assistanceNoTranscripts` states that as a property of the system rather
 * than leaving an absence for someone to fill in later. Both that and the
 * twenty-minute window describe how these counts are ASSEMBLED, so both live
 * behind one disclosure at the foot of the band — reachable, and not re-read
 * every morning.
 *
 * `degradedProvider` does not: a "hint" was one canned sentence, so the outcome
 * columns describe nothing about tutoring and are removed rather than annotated.
 * What is left is delivery, which is still a fact.
 */
function AssistanceSection({ data }: { data: StudentDetailPayload }) {
  const { t } = useLocale();
  const a = data.assistance;
  const degraded = a.degradedProvider;

  const columns = useMemo<DataColumn<LevelRow>[]>(() => {
    const base: DataColumn<LevelRow>[] = [
      {
        key: "level",
        header: TL.assistanceLevel,
        width: "160px",
        render: (row) => <span className={cn(NUM.figure, INK.primary)}>{row.level}</span>,
      },
      {
        key: "delivered",
        header: TL.assistanceDelivered,
        align: "right",
        render: (row) => <Num value={row.delivered} />,
      },
    ];
    if (degraded) return base;
    return [
      ...base,
      {
        key: "solo",
        header: TL.assistanceResolvedIndependently,
        align: "right",
        render: (row) => <Num value={row.resolvedIndependently} tone="ok" />,
      },
      {
        key: "transfer",
        header: TL.assistanceResolvedByTransfer,
        align: "right",
        render: (row) => <Num value={row.resolvedByTransfer} tone="warn" />,
      },
      {
        key: "progressed",
        header: EXTRA.assistanceProgressed,
        align: "right",
        render: (row) => <Num value={row.progressed} />,
      },
      {
        key: "escalated",
        header: TL.assistanceEscalated,
        align: "right",
        render: (row) => <Num value={row.escalated} />,
      },
      {
        key: "stalled",
        header: TL.assistanceStalled,
        align: "right",
        render: (row) => <Num value={row.stalled} tone="warn" />,
      },
      {
        key: "regressed",
        header: EXTRA.assistanceRegressed,
        align: "right",
        render: (row) => <Num value={row.regressed} tone="warn" />,
      },
    ];
  }, [degraded]);

  return (
    <Section title={t(TL.assistanceTitle)}>
      <div className={GAP.block}>
        {/* Stays visible: it says what the columns below no longer measure. */}
        {degraded ? <Notice>{t(TL.assistanceDegraded)}</Notice> : null}

        <StatRow columns={3}>
          <StatTile label={t(TL.assistanceRequested)} value={a.requested} />
          <StatTile label={t(TL.assistanceDelivered)} value={a.delivered} />
          <StatTile
            label={t(TL.assistanceUndelivered)}
            value={a.undelivered}
            tone={a.undelivered > 0 ? "warn" : "neutral"}
          />
        </StatRow>

        {a.byLevel.length === 0 ? (
          <EmptyState title={t(TL.noData)} hint={t(EXTRA.assistanceNone)} />
        ) : (
          <DataTable
            columns={columns}
            rows={a.byLevel}
            rowKey={(row) => String(row.level)}
            caption={t(TL.assistanceLevel)}
          />
        )}

        {a.mostAssistedBlocks.length > 0 ? (
          <div>
            <h3 className={cn(TYPE.subsection, INK.primary)}>{t(EXTRA.assistanceBlocksTitle)}</h3>
            <ul className="mt-2 max-w-[560px]">
              {a.mostAssistedBlocks.map((block) => (
                <li
                  key={block.blockId}
                  className={cn(
                    "flex items-baseline justify-between gap-4 border-t py-2 first:border-t-0",
                    LINE.hair,
                  )}
                >
                  <span className={cn("min-w-0", TYPE.body, INK.primary)}>{t(block.title)}</span>
                  <span className={cn("shrink-0", NUM.cell, INK.secondary)}>
                    {block.interventions}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Hint label={t(EXTRA.assistanceNotes)}>
          <p>{t(TL.assistanceWindowNote)}</p>
          <p className="mt-1.5">{t(TL.assistanceNoTranscripts)}</p>
        </Hint>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 8 — reviews                                                                */
/* -------------------------------------------------------------------------- */

type ReviewRow = StudentDetailPayload["reviews"][number];

/** The delayed re-solve queue. A settled review carries its own outcome label. */
function ReviewsSection({ data, locale }: { data: StudentDetailPayload; locale: Locale }) {
  const { t } = useLocale();

  const columns = useMemo<DataColumn<ReviewRow>[]>(
    () => [
      {
        key: "block",
        header: TL.colBlock,
        width: "38%",
        render: (row) => <span className={cn(TYPE.body, INK.primary)}>{t(row.title)}</span>,
      },
      {
        key: "reason",
        header: EXTRA.colReviewReason,
        render: (row) => (
          <span className={cn(TYPE.meta, INK.secondary)}>{t(row.reasonLabel)}</span>
        ),
      },
      {
        key: "due",
        header: EXTRA.colReviewDue,
        sortable: true,
        sortValue: (row) => row.dueAt,
        render: (row) => (
          <span className={cn("tabular-nums", TYPE.meta, INK.secondary)}>
            {numericDate(locale, new Date(row.dueAt))}
          </span>
        ),
      },
      {
        key: "outcome",
        header: EXTRA.colReviewOutcome,
        render: (row) => {
          if (row.outcomeLabel) {
            return <Chip tone="neutral">{t(row.outcomeLabel)}</Chip>;
          }
          /* Not settled. Due and not settled is a different fact from waiting,
             and the colour is never the only cue — both carry a word. */
          const overdue = Date.parse(row.dueAt) <= Date.now();
          return (
            <Chip tone={overdue ? "warn" : "lock"}>
              {t(overdue ? TL.reviewDue : TL.reviewPending)}
            </Chip>
          );
        },
      },
    ],
    [t, locale],
  );

  return (
    <Section title={t(TL.reviewsTitle)}>
      <DataTable
        columns={columns}
        rows={data.reviews}
        rowKey={(row) => `${row.blockId}-${row.dueAt}`}
        caption={t(TL.reviewsTitle)}
        initialSort={{ key: "due", direction: "asc" }}
        empty={<EmptyState title={t(EXTRA.reviewsNone)} />}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 9 — activity                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Solves per bucket, independent over assisted.
 *
 * The bucket LIST comes from the period, not from the rows: SQL returns no row
 * for a day with no episodes, and a chart that silently drops those days
 * compresses a quiet week into a busy-looking one.
 */
function ActivitySection({ data, locale }: { data: StudentDetailPayload; locale: Locale }) {
  const { t } = useLocale();

  const buckets = useMemo<ChartBucket[]>(() => {
    const byBucket = new Map(data.activity.map((point) => [point.bucket, point]));
    const keys =
      data.period.buckets.length > 0
        ? data.period.buckets
        : data.activity.map((point) => point.bucket);
    return keys.map((key) => {
      const point = byBucket.get(key);
      return {
        key,
        label: bucketLabel(key, data.period.grain, locale),
        independent: point?.solvedIndependent ?? 0,
        assisted: point?.solvedAssisted ?? 0,
      };
    });
  }, [data, locale]);

  return (
    <Section title={t(EXTRA.activityTitle)} description={t(WINDOW_LABEL[data.period.period])}>
      <BarChart buckets={buckets} caption={t(EXTRA.activityTitle)} />
    </Section>
  );
}

/** `YYYY-MM-DD` or `YYYY-MM`, never through `Intl` — Chromium has no kk CLDR. */
function bucketLabel(bucket: string, grain: "day" | "month", locale: Locale): string {
  if (grain === "month") {
    const month = Number(bucket.slice(5, 7));
    if (!Number.isFinite(month) || month < 1 || month > 12) return "";
    return monthLong(locale, month - 1);
  }
  const at = new Date(`${bucket}T00:00:00Z`);
  if (Number.isNaN(at.getTime())) return "";
  return dayMonthShort(locale, at);
}

/* -------------------------------------------------------------------------- */
/* 10 — timeline                                                              */
/* -------------------------------------------------------------------------- */

/**
 * What happened, newest first — and the lightest band on the page.
 *
 * It was the heaviest: 15px rows, a wide time column at 13px and a section lead
 * on top of it, for the section a teacher consults last. One line per entry now
 * — a time, then the sentence the projection already wrote — at metadata weight
 * throughout.
 *
 * No reducer tick, no internal event name, no `episode_resumed` wall: the
 * projection excludes them and this renders only `detail`.
 */
function TimelineSection({ data, locale }: { data: StudentDetailPayload; locale: Locale }) {
  const { t } = useLocale();

  return (
    <Section title={t(EXTRA.timelineTitle)} description={t(EXTRA.timelineLead)}>
      {data.timeline.length === 0 ? (
        <EmptyState title={t(TL.noData)} hint={t(TL.emptyNoActivity)} />
      ) : (
        <ol className="max-w-[720px]">
          {data.timeline.map((entry, index) => (
            <li
              key={`${entry.at}-${entry.episodeId ?? entry.lessonId ?? index}`}
              className={cn(
                "flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-t py-2 first:border-t-0",
                LINE.hair,
              )}
            >
              <time
                dateTime={entry.at}
                className={cn("w-[124px] shrink-0 tabular-nums", TYPE.meta, INK.muted)}
              >
                {numericDateTime(locale, new Date(entry.at))}
              </time>
              <span className={cn("min-w-0 flex-1", TYPE.meta, INK.secondary)}>
                {t(entry.detail)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
