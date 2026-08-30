"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import type { Locale, Localized } from "@schools/curriculum/types";
import { dayMonthShort, monthLong, numericDate } from "@schools/presentation/dates";
import { L, teacherFailureClassLabel } from "@schools/presentation/labels";
import {
  teacherLoadFailure,
  teacherLoadFailureLabel,
  type TeacherLoadFailure,
} from "@schools/presentation/teacher-outcome";
import type {
  AssessmentState,
  Finding,
  LearnerStatus,
  LessonSummary,
  RosterRow,
  SkillSummary,
  TeacherOverview,
  TeacherPeriod,
} from "@schools/teacher/contracts";
import { TL, nOfM } from "@schools/teacher/labels";
import {
  EXTRA,
  basedOnEpisodes,
  mistakeSpread,
  requiredWorkBasis,
  showMoreLearners,
  unmeasuredCodingCount,
  awaitingReadingCount,
} from "@schools/teacher/labels-extra/overview";
import { useLocale } from "@/components/sx/i18n";
import { cn } from "@/lib/utils";
import { minutes, share, toneChip, toneFill, toneText, type Tone } from "./format";
import { useTeacherView } from "./shell";
import { GAP, INK, LINE, MOTION, NUM, RADIUS, SURFACE, TYPE } from "./tokens";
import {
  BarChart,
  Distribution,
  EmptyState,
  EvidenceDot,
  Finding as FindingLine,
  Hint,
  Meter,
  Num,
  Section,
  SpineRow,
  StatRow,
  StatTile,
  StatusBadge,
  TrendDelta,
  type ChartBucket,
  type DistributionSlice,
} from "./ui";

/**
 * The first screen, and it answers one question: **what requires my attention
 * right now?**
 *
 * ## Why the order changed
 *
 * The first build opened with eight identical stat tiles in two rows of four,
 * and the attention queue — the reason the page exists — started roughly 700px
 * down at 1280. `ОҚУШЫ 20` was in position one: the least useful number on the
 * screen, at the top of it. That is a report's shape, not a briefing's.
 *
 * So the page is inverted. Four figures state the situation, and the fourth is
 * the required-work meter rather than a roster count — the roster is visible as
 * the denominator of the other three. Then the queue, which is the only part of
 * this page that changes what someone does in the next lesson. Then the one
 * chart, then where the class is struggling, then who can be stretched, then
 * the monthly check. The counters a teacher does not start with — solves,
 * median practice, the roster size — are a quiet rail at the foot.
 *
 * «Готовы к сложному» is still **on** the page rather than hidden. A child who
 * is flying is not a reason to look past one who is stuck, and a dashboard that
 * drops the second list entirely teaches a teacher that the top of the class is
 * not its business.
 *
 * ## What it refuses to do
 *
 * No composite score, no invented mastery percentage, and no `0` standing in
 * for a measurement nobody made. Every ratio prints the counts it was built
 * from, every finding names a cause a teacher can disagree with, and every
 * finding that rests on episodes says how many — in the disclosure's own label,
 * so the count is legible before it is opened. That last property is the one
 * the old panel dropped: `episodeIds` was on the wire and rendered nowhere, so
 * a teacher who said «я не верю» could only be argued with.
 *
 * Colour never carries a status on its own. Every tone here sits beside a word.
 *
 * ## What moved into a disclosure
 *
 * The prose that explains how a number was BUILT — the window semantics, the
 * queue's ordering rule, what a skill row counts, how the comparison window is
 * chosen. The caveats that change how a number is READ stay in the layout: the
 * window label under the situation line, the judge outage and the unstored
 * written answers under the monthly check, and every «Не измерено».
 */

/* -------------------------------------------------------------------------- */
/* Windows                                                                    */
/* -------------------------------------------------------------------------- */

const WINDOW_LABEL: Record<TeacherPeriod, Localized> = {
  week: TL.windowWeek,
  month: TL.windowMonth,
  programme: TL.windowProgramme,
};

/** The four states a monthly check can be in, in the order a teacher reads them. */
const ASSESSMENT_ROW: readonly { state: AssessmentState; label: Localized }[] = [
  { state: "not_started", label: TL.assessmentStateNotStarted },
  { state: "in_progress", label: TL.assessmentStateInProgress },
  { state: "awaiting_review", label: TL.assessmentStateAwaitingReview },
  { state: "complete", label: TL.assessmentStateComplete },
];

/** How many attention rows open by default. The rest are one click away. */
const ATTENTION_VISIBLE = 5;

/**
 * The spine's tone, from the status alone.
 *
 * There are no severity tiers here and none are being invented: `LearnerStatus`
 * has exactly one attention state, and the queue arrives already sorted by how
 * much a teacher's attention would change something, so the ORDER carries the
 * priority. `dormant` and `not_started` take the lock tone because they are
 * absences — amber on a child who has never signed in is a judgement about a
 * login problem.
 */
const SPINE_TONE: Record<LearnerStatus, Tone> = {
  not_started: "lock",
  dormant: "lock",
  needs_attention: "warn",
  ready_to_stretch: "ok",
  on_track: "neutral",
};

/* -------------------------------------------------------------------------- */
/* The page                                                                   */
/* -------------------------------------------------------------------------- */

export function OverviewPanel() {
  const { t } = useLocale();
  const { classId, period, query, report } = useTeacherView();

  /*
   * One state, stamped with the request it answers.
   *
   * The obvious shape — separate `data` and `failure` reset at the top of the
   * effect — writes state synchronously on every class or period change, which
   * costs a cascading render and which React's own lint rule refuses. Stamping
   * the result instead means a stale payload is simply not the one being asked
   * for, so switching to another class shows the skeleton rather than the
   * previous class's numbers under the new class's name — a subtle way for a
   * dashboard to tell a teacher something false about a child.
   *
   * `failure` is a CLOSED union, never a caught message. The old panel typed it
   * `string | null` and fed it from `e.message`, which on a proxy-returned HTML
   * error page is the JSON parser complaining about an unexpected `<`, rendered
   * verbatim to a teacher between two lessons. There is no value a failure can
   * carry that reaches the screen: the sentence is chosen here, from three we
   * wrote.
   */
  const [loaded, setLoaded] = useState<{
    key: string;
    data: TeacherOverview | null;
    failure: TeacherLoadFailure | null;
  }>({ key: "", data: null, failure: null });

  const requestKey = `${classId}:${period}`;

  useEffect(() => {
    if (!classId) return;
    const key = `${classId}:${period}`;
    let live = true;

    fetch(`/api/teacher/class/${encodeURIComponent(classId)}/overview?period=${period}`)
      .then(async (response) => {
        if (!response.ok) {
          /* The body may not be JSON at all — that is the case that produced the
             parser error above — so failing to read it is just another way of
             saying "unavailable", never something to propagate. */
          const reason = await response
            .json()
            .then((body: { error?: unknown }) => body?.error)
            .catch(() => null);
          if (live) setLoaded({ key, data: null, failure: teacherLoadFailure(reason) });
          return;
        }
        const payload = (await response.json()) as TeacherOverview;
        if (!live) return;
        setLoaded({ key, data: payload, failure: null });
        /* The chrome does not fetch a seventh time — the page that already has
           the context and the freshness reports them up. */
        report({ context: payload.context, freshness: payload.freshness });
      })
      // No parameter, deliberately: there is nothing in a network error a
      // teacher can act on, and reading it is how it ends up rendered.
      .catch(() => {
        if (live) setLoaded({ key, data: null, failure: "unavailable" });
      });

    return () => {
      live = false;
    };
  }, [classId, period, report]);

  const current = loaded.key === requestKey ? loaded : null;

  if (current?.failure) {
    return <EmptyState title={t(teacherLoadFailureLabel(current.failure))} />;
  }

  const data = current?.data ?? null;
  if (!data) return <OverviewSkeleton />;

  /*
   * A class with nobody in it gets one sentence, not eleven zeroes.
   *
   * This is a real state — a class row exists before anyone is enrolled — and
   * the bands below all divide by the roster. Rendered against an empty one
   * they produced «Обязательные уроки 0/0» claiming the month has no lessons,
   * an axis frame with no series, and — the reason this guard exists — «Сейчас
   * никто не требует особого внимания. Это хороший результат.» An empty class
   * is not a good result. It is an empty class, and saying so is both shorter
   * and true.
   */
  if (data.context.enrolled === 0) {
    return <EmptyState title={t(EXTRA.noLearnersTitle)} hint={t(EXTRA.noLearnersHint)} />;
  }

  return (
    <div>
      <SituationLine overview={data} period={period} />
      <AttentionQueue rows={data.attention} query={query} />
      <ClassTrend overview={data} />
      <WeakestSkills skills={data.weakestSkills} enrolled={data.context.enrolled} query={query} />
      <HardestLessons lessons={data.hardestLessons} query={query} />
      <StretchList rows={data.stretch} query={query} />
      <AssessmentStrip overview={data} query={query} />
      <MetricsRail overview={data} period={period} />
    </div>
  );
}

/**
 * The teacher has no class at all.
 *
 * Rendered inside the shell rather than on a bare page: a teacher whose classes
 * have not been assigned yet still needs the account menu and the language
 * switch, which is exactly what the old full-screen box took away.
 */
export function TeacherNoClasses() {
  const { t } = useLocale();
  return <EmptyState title={t(L.teacherNoClasses)} />;
}

/* -------------------------------------------------------------------------- */
/* 1 — the situation line                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Three figures about people, then one about work — and they are deliberately
 * not the same shape.
 *
 * How many of the class are working, how many are flagged, how many are free to
 * move on. Those three partition the roster because `LearnerStatus` is a ladder
 * evaluated in order, and all three print the roster as their denominator —
 * which is why there is no separate «Учеников» tile above them any more. It was
 * the least useful number on the screen and it was in position one.
 *
 * **Required work is no longer a fourth tile.** As `10 / 240` at headline
 * weight beside three roster-denominated figures it read as *the class is 4%
 * through the course*, which is a different and much worse claim than the one
 * the number makes. 240 is twenty children times twelve September lessons — a
 * count of (learner, lesson) pairs, reset every month — and a class that
 * finishes September perfectly reads 240 / 240 with eight months left. The
 * formula is untouched; the figure moved out of hero position into a labelled
 * progress line that names both sides of the fraction and says what it is not.
 *
 * The window is stated once, under the rail, rather than repeated as a subtitle
 * on every tile. It is a reading caveat, so it stays visible; the sentence about
 * how the window is applied is in the disclosure beside it.
 */
function SituationLine({
  overview,
  period,
}: {
  overview: TeacherOverview;
  period: TeacherPeriod;
}) {
  const { t } = useLocale();
  const k = overview.kpis;

  return (
    <Section title={t(EXTRA.summaryTitle)}>
      <StatRow columns={3}>
        <StatTile
          label={t(TL.kpiActive)}
          value={k.activeInPeriod}
          denominator={k.totalStudents}
        />
        <StatTile
          label={t(TL.kpiAttention)}
          value={k.needAttention}
          tone={k.needAttention > 0 ? "warn" : "neutral"}
          denominator={k.totalStudents}
        />
        <StatTile
          label={t(TL.kpiStretch)}
          value={k.readyForChallenge}
          tone={k.readyForChallenge > 0 ? "ok" : "neutral"}
          denominator={k.totalStudents}
        />
      </StatRow>

      {/* Required work, demoted and explained. A bar and two counts at body
          weight, with the composition of the denominator written out beneath —
          which is the whole of what «10 / 240» failed to say. */}
      <div className="mt-5 max-w-[46ch]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className={cn(TYPE.body, INK.secondary)}>{t(TL.kpiRequiredWork)}</span>
          <span className={cn(NUM.figure, INK.primary)}>
            {nOfM(k.requiredWork.completed, k.requiredWork.total)}
          </span>
        </div>
        <Meter
          value={k.requiredWork.completed}
          total={k.requiredWork.total}
          label={t(TL.kpiRequiredWork)}
          showValue={false}
          className="mt-2"
        />
        <p className={cn("mt-2", TYPE.meta, INK.muted)}>
          {t(requiredWorkBasis(k.totalStudents, lessonsInMonth(k.requiredWork.total, k.totalStudents)))}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1">
        <span className={cn(TYPE.meta, INK.muted)}>{t(WINDOW_LABEL[period])}</span>
        <Hint label={t(EXTRA.numbersHint)}>
          <p>{t(EXTRA.summaryDescription)}</p>
        </Hint>
      </div>
    </Section>
  );
}

/**
 * How many published lessons the month has, recovered from the denominator.
 *
 * `requiredWork.total` is `enrolled × lessons` and the payload carries no
 * separate lesson count. Dividing it back out is arithmetic on two numbers
 * already on screen — not a new measurement — and it is what lets the caption
 * name both sides of the fraction instead of asserting «240» and stopping.
 *
 * Guarded because an empty roster makes the denominator zero, and a class with
 * no enrolled learners must render a caption rather than `NaN`.
 */
function lessonsInMonth(total: number, enrolled: number): number {
  return enrolled > 0 ? Math.round(total / enrolled) : 0;
}

/* -------------------------------------------------------------------------- */
/* 2 — the attention queue                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The hero of the page, and it is no longer a card.
 *
 * Each row is a spine in the status tone with the name, the status word, the
 * findings, and what to do about each of them. The payload arrives sorted by
 * how much a teacher's attention would change something, so this list never
 * re-sorts it — and because the order carries the priority, the rows do not
 * need to differ in weight from one another.
 */
function AttentionQueue({ rows, query }: { rows: readonly RosterRow[]; query: string }) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) {
    return (
      <Section title={t(TL.kpiAttention)}>
        {/* A good outcome, styled calmly — no green banner, no celebration. */}
        <EmptyState title={t(TL.emptyNoAttention)} hint={t(EXTRA.attentionCalm)} />
      </Section>
    );
  }

  const visible = expanded ? rows : rows.slice(0, ATTENTION_VISIBLE);
  const hidden = rows.length - visible.length;

  return (
    /* The count in the heading, because the list is truncated to five and a
       reviewer stopped to work out whether «Требуют внимания 10» above five
       rows was a bug. It is not — «Показать ещё 5» holds the rest — but a
       teacher should not have to add. */
    <Section title={`${t(TL.kpiAttention)} — ${rows.length}`}>
      <ol className="divide-y divide-b-fg/10">
        {visible.map((row) => (
          <AttentionRow key={row.userId} row={row} query={query} />
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {hidden > 0 || expanded ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className={cn(
              "cursor-pointer border px-3.5 py-2",
              RADIUS.control,
              LINE.edge,
              "hover:border-b-fg/30 hover:text-b-fg",
              TYPE.body,
              INK.secondary,
              MOTION.base,
            )}
          >
            {expanded ? t(EXTRA.collapseList) : t(showMoreLearners(hidden))}
          </button>
        ) : null}
        <Hint label={t(EXTRA.queueOrderHint)}>
          <p>{t(EXTRA.attentionDescription)}</p>
        </Hint>
      </div>
    </Section>
  );
}

/**
 * One learner: who, what, why, since when, and what to do.
 *
 * The name carries the link and stretches it over the row — a teacher aiming at
 * a row should not have to hit five characters of a name. The findings are
 * lifted back above that overlay so their sentences stay selectable and their
 * evidence disclosures stay clickable; a click on a sentence that navigated
 * away mid-read would be a worse row than a smaller target.
 */
function AttentionRow({ row, query }: { row: RosterRow; query: string }) {
  const { t, locale } = useLocale();
  const href = row.subjectId
    ? `/teacher/students/${encodeURIComponent(row.subjectId)}?${query}`
    : null;

  const name = href ? (
    <Link
      href={href}
      aria-label={`${row.displayName} — ${t(EXTRA.openStudent)}`}
      className={cn(
        "after:absolute after:inset-0 after:content-['']",
        "hover:text-b-purple",
        MOTION.base,
      )}
    >
      {row.displayName}
    </Link>
  ) : (
    /* A learner with no subject has never opened anything, so there is no
       detail page to send a teacher to. The row still appears — that absence is
       precisely what needs acting on. */
    row.displayName
  );

  return (
    <SpineRow
      tone={SPINE_TONE[row.status]}
      href={href ?? undefined}
      title={name}
      status={<StatusBadge status={row.status} />}
      action={
        <div className={cn("sm:text-right", TYPE.meta, INK.muted, GAP.tight)}>
          <p>
            {t(TL.colLastActive)}:{" "}
            <span className="tabular-nums">
              {row.lastActiveAt ? numericDate(locale, new Date(row.lastActiveAt)) : t(TL.never)}
            </span>
          </p>
          {row.currentTopic ? (
            <p className="max-w-[240px] truncate">
              {t(TL.colTopic)}: {t(row.currentTopic.title)}
            </p>
          ) : null}
        </div>
      }
    >
      {row.findings.map((finding, index) => {
        const episodes = finding.episodeIds?.length ?? 0;
        const auditable = episodes > 0 || Boolean(finding.failureClass);
        return (
          <div
            key={`${finding.kind}-${finding.skillId ?? index}`}
            /* Above the stretched link: prose stays selectable, the disclosure
               stays a disclosure rather than a second way to leave the page. */
            className="relative z-[1] w-fit max-w-full"
          >
            <FindingLine
              reason={t(finding.detail)}
              context={findingContext(finding, t, locale)}
              action={t(finding.recommendation)}
              evidence={
                auditable ? <FindingEvidence finding={finding} episodes={episodes} /> : undefined
              }
            />
          </div>
        );
      })}
    </SpineRow>
  );
}

/**
 * The skill and the date, on one muted line.
 *
 * Returns `undefined` rather than an empty element when a finding carries
 * neither — an empty line under a sentence reads as a value that failed to
 * render.
 */
function findingContext(
  finding: Finding,
  t: (value: Localized) => string,
  locale: Locale,
): ReactNode | undefined {
  const parts: string[] = [];
  if (finding.skillTitle) parts.push(t(finding.skillTitle));
  if (finding.since) {
    parts.push(`${t(TL.since)}: ${numericDate(locale, new Date(finding.since))}`);
  }
  if (parts.length === 0) return undefined;
  return <span className="tabular-nums">{parts.join(" · ")}</span>;
}

/**
 * What the claim rests on, and how much of it there is.
 *
 * The episode count is the disclosure's own LABEL rather than something inside
 * it: «Основано на 4 попытках» read while closed is most of the answer, and the
 * audit's complaint about the old build was that the product's whole integrity
 * claim was a small link at the bottom of one row. The identifiers themselves
 * are never printed — a teacher has no use for a database key, and
 * `teacherFailureClassLabel` degrades an unknown class to a readable sentence.
 */
function FindingEvidence({ finding, episodes }: { finding: Finding; episodes: number }) {
  const { t } = useLocale();
  return (
    <Hint label={episodes > 0 ? t(basedOnEpisodes(episodes)) : t(TL.showEvidence)}>
      {finding.failureClass ? (
        <p>
          <span className={INK.muted}>{t(EXTRA.namedMistake)}: </span>
          {t(teacherFailureClassLabel(finding.failureClass))}
        </p>
      ) : null}
      <p className={cn(finding.failureClass ? "mt-1.5" : undefined, TYPE.meta, INK.muted)}>
        {t(EXTRA.evidenceDispute)}
      </p>
    </Hint>
  );
}

/* -------------------------------------------------------------------------- */
/* 3 — the class trend                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The one chart on this page, and it plots one quantity: solved tasks, split by
 * whether help was taken.
 *
 * Under it the four comparisons, as a plain strip at metadata weight rather
 * than four bordered boxes — they support the chart, they are not four more
 * metrics. Only two are tinted: a rise in assisted solves is not a green number
 * and neither is a rise in practice minutes, so `direction` is left neutral
 * there and the teacher supplies the judgement.
 */
function ClassTrend({ overview }: { overview: TeacherOverview }) {
  const { t, locale } = useLocale();
  const grain = overview.period.grain;

  const buckets: ChartBucket[] = overview.trend.map((point) => ({
    key: point.bucket,
    label: bucketLabel(point.bucket, grain, locale),
    independent: point.solvedIndependent,
    assisted: point.solvedAssisted,
  }));

  const comparisons = [
    {
      label: t(TL.kpiActive),
      comparison: overview.comparison.activeLearners,
      direction: "higher_is_better" as const,
    },
    {
      label: t(TL.kpiIndependent),
      comparison: overview.comparison.independentSolves,
      direction: "higher_is_better" as const,
    },
    {
      label: t(TL.kpiAssisted),
      comparison: overview.comparison.assistedSolves,
      direction: "neutral" as const,
    },
    {
      label: t(EXTRA.comparePractice),
      comparison: overview.comparison.practiceMinutes,
      direction: "neutral" as const,
      /* The one comparison whose absolute difference needs naming: «+1734»
         beside a count of learners would be ambiguous, beside minutes it is
         not. */
      unit: t(TL.minutesShort),
    },
  ];

  return (
    <Section title={t(EXTRA.trendTitle)}>
      {buckets.length === 0 ? (
        <EmptyState title={t(TL.noData)} hint={t(TL.emptyNoActivity)} />
      ) : (
        <BarChart buckets={buckets} />
      )}

      <p className={cn("mt-5", TYPE.meta, INK.muted)}>{t(EXTRA.comparisonCaption)}</p>
      <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-3">
        {comparisons.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className={cn(TYPE.meta, INK.muted)}>{item.label}</dt>
            <dd className={cn("mt-0.5", TYPE.meta)}>
              <TrendDelta
                comparison={item.comparison}
                direction={item.direction}
                unit={"unit" in item ? item.unit : undefined}
              />
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <Hint label={t(EXTRA.numbersHint)}>
          <p>{t(EXTRA.trendDescription)}</p>
        </Hint>
      </div>
    </Section>
  );
}

/**
 * A bucket key as an axis tick.
 *
 * The keys are `YYYY-MM-DD` for a day grain and `YYYY-MM` for a month one, both
 * UTC — the same boundary the learner's own week uses, so two people looking at
 * one screen see one week. Formatting goes through the product's own tables and
 * never through `Intl`: Chromium ships no Kazakh calendar data and answers a
 * `kk` request with «M08 24» rather than failing.
 */
function bucketLabel(bucket: string, grain: "day" | "month", locale: Locale): string {
  const [rawYear, rawMonth, rawDay] = bucket.split("-");
  const year = Number(rawYear);
  const month = Number(rawMonth);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return bucket;
  if (grain === "month" || rawDay === undefined) return monthLong(locale, month - 1);
  const day = Number(rawDay);
  if (!Number.isFinite(day)) return bucket;
  return dayMonthShort(locale, new Date(Date.UTC(year, month - 1, day)));
}

/* -------------------------------------------------------------------------- */
/* 4 — where the class struggles                                              */
/* -------------------------------------------------------------------------- */

/**
 * Where the class is thinnest, worst first — as rows, not as a spreadsheet.
 *
 * The six-column table this replaces made a teacher read across five numeric
 * cells to learn one thing: how far this skill has got. The bar does that
 * comparison, the two counts beside it are exact and each sits next to its own
 * word, and `attemptedBy` is printed against the enrolled roster rather than
 * against itself — the population differs per skill, and a layout that hides
 * that invites a teacher to compare two rows that are not comparable.
 */
function WeakestSkills({
  skills,
  enrolled,
  query,
}: {
  skills: readonly SkillSummary[];
  enrolled: number;
  query: string;
}) {
  const { t } = useLocale();
  const href = `/teacher/skills?${query}`;

  return (
    <Section
      title={t(EXTRA.weakestSkillsTitle)}
      action={<SectionLink href={href} label={t(EXTRA.allSkills)} />}
    >
      {skills.length === 0 ? (
        <EmptyState title={t(EXTRA.emptySkills)} hint={t(TL.emptyNoActivity)} />
      ) : (
        <ul className="divide-y divide-b-fg/10">
          {skills.map((skill) => (
            <SkillRow key={skill.skillId} skill={skill} enrolled={enrolled} href={href} />
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Hint label={t(EXTRA.numbersHint)}>
          <p>{t(EXTRA.weakestSkillsDescription)}</p>
        </Hint>
      </div>
    </Section>
  );
}

function SkillRow({
  skill,
  enrolled,
  href,
}: {
  skill: SkillSummary;
  enrolled: number;
  href: string;
}) {
  const { t } = useLocale();
  const independent = skill.counts.independent_evidence;
  const review = skill.counts.needs_review;

  return (
    <li className={cn("-mx-2 px-2 py-3.5", SURFACE.hover, MOTION.base)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Link
          href={href}
          className={cn(TYPE.rowTitle, INK.primary, "hover:text-b-purple", MOTION.base)}
        >
          {t(skill.title)}
        </Link>
        <span className={cn(TYPE.meta, INK.muted)}>
          {t(TL.colAttemptedBy)}:{" "}
          <span className="tabular-nums">{nOfM(skill.attemptedBy, enrolled)}</span>
        </span>
      </div>

      {/* The bar compares; the counts below it are the fact. Both states are
          named in words beside their numbers, so the fill is the second cue. */}
      <div
        aria-hidden="true"
        className="mt-2 flex h-[6px] w-full overflow-hidden rounded-full bg-b-fg/10"
      >
        <span
          className={cn("block h-full", toneFill("ok"))}
          style={{ width: `${barWidth(independent, enrolled)}%` }}
        />
        <span
          className={cn("block h-full", toneFill("warn"))}
          style={{ width: `${barWidth(review, enrolled)}%` }}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <CountedState state="independent_evidence" value={independent} />
        <CountedState state="needs_review" value={review} />
        <span className={cn(TYPE.meta, INK.muted)}>
          {t(TL.colMedianAttempts)}: <Num value={skill.medianAttempts} />
        </span>
        {skill.topMistake ? (
          <span className={cn(TYPE.meta, INK.secondary)}>
            {t(skill.topMistake.label)}{" "}
            <span className={cn("tabular-nums", INK.muted)}>
              {t(mistakeSpread(skill.topMistake.learners, skill.topMistake.occurrences))}
            </span>
          </span>
        ) : (
          <span className={cn(TYPE.meta, INK.muted)}>{t(TL.emptyInsufficientEvidence)}</span>
        )}
      </div>
    </li>
  );
}

/** One evidence state, its word, and how many learners are in it. */
function CountedState({
  state,
  value,
}: {
  state: "independent_evidence" | "needs_review";
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <EvidenceDot state={state} />
      <span className={cn(NUM.figure, value === 0 ? INK.faint : INK.primary)}>{value}</span>
    </span>
  );
}

/**
 * A segment's width, floored at 2% so a single learner is still visible.
 *
 * Zero stays zero: a sliver on a skill nobody has independent evidence for
 * would be a bar claiming a fraction of a learner.
 */
function barWidth(value: number, total: number): number {
  if (total <= 0 || value <= 0) return 0;
  return Math.max(Math.round((value / total) * 100), 2);
}

/* -------------------------------------------------------------------------- */
/* 5 — hardest lessons                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The lessons costing the most, as a short list.
 *
 * The five-column table made the reader divide «3 / 5» in their head, per row,
 * to learn the one thing the band is for. `Meter` does that arithmetic and
 * still prints both counts, so a completion rate over two starters is visibly
 * a rate over two starters.
 */
function HardestLessons({
  lessons,
  query,
}: {
  lessons: readonly LessonSummary[];
  query: string;
}) {
  const { t } = useLocale();
  const href = `/teacher/lessons?${query}`;

  return (
    <Section
      title={t(EXTRA.hardestLessonsTitle)}
      action={<SectionLink href={href} label={t(EXTRA.allLessons)} />}
    >
      {lessons.length === 0 ? (
        <EmptyState title={t(EXTRA.emptyLessons)} hint={t(TL.emptyNoActivity)} />
      ) : (
        <ul className="divide-y divide-b-fg/10">
          {lessons.map((lesson) => (
            <li
              key={lesson.lessonId}
              className={cn(
                "-mx-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-2 py-3.5",
                SURFACE.hover,
                MOTION.base,
              )}
            >
              <div className="min-w-[180px] flex-1">
                <Link
                  href={href}
                  className={cn(TYPE.rowTitle, INK.primary, "hover:text-b-purple", MOTION.base)}
                >
                  {t(lesson.title)}
                </Link>
                <p className={cn("mt-0.5 truncate", TYPE.meta, INK.muted)}>{t(lesson.unitTitle)}</p>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {/* «Завершили 0/5» over a class of 21 read as a broken
                    denominator. It is not: five is how many STARTED this
                    lesson, which is the only denominator a completion rate can
                    honestly use. The label now says so. */}
                <span className={cn("flex items-center gap-2", TYPE.meta, INK.muted)}>
                  {t(EXTRA.completedOfStarted)}
                  <Meter
                    value={lesson.completedBy}
                    total={lesson.startedBy}
                    label={t(EXTRA.completedOfStarted)}
                    className="w-[124px]"
                  />
                </span>
                <span className={cn(TYPE.meta, INK.muted)}>
                  {t(TL.colIndependent)}: <Num value={lesson.completedIndependentlyBy} tone="ok" />
                </span>
                <span className={cn(TYPE.meta, INK.muted)}>
                  {t(TL.colMedianTime)}:{" "}
                  <Num value={lesson.medianMinutes} suffix={t(TL.minutesShort)} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        <Hint label={t(EXTRA.numbersHint)}>
          <p>{t(EXTRA.hardestLessonsDescription)}</p>
        </Hint>
      </div>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 6 — ready to stretch                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Secondary in ordering weight, not in visibility.
 *
 * Ruled rows rather than the bordered grid it used to be, so it reads as the
 * quieter counterpart to the queue instead of as a second queue. Every row
 * states the counts behind its share, because «100% самостоятельно» over two
 * solves is not a fact about a learner.
 */
function StretchList({ rows, query }: { rows: readonly RosterRow[]; query: string }) {
  const { t } = useLocale();

  return (
    <Section title={t(TL.kpiStretch)} description={t(EXTRA.stretchDescription)}>
      {rows.length === 0 ? (
        <EmptyState title={t(TL.emptyNoStretch)} hint={t(TL.emptyInsufficientEvidence)} />
      ) : (
        <ul className="divide-y divide-b-fg/10">
          {rows.map((row) => {
            const solved = row.solvedIndependent + row.solvedAssisted;
            const pct = share(row.independentShare);
            const href = row.subjectId
              ? `/teacher/students/${encodeURIComponent(row.subjectId)}?${query}`
              : null;
            return (
              <li key={row.userId} className={cn("-mx-2 px-2 py-3.5", SURFACE.hover, MOTION.base)}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className={cn(TYPE.rowTitle, INK.primary)}>
                    {href ? (
                      <Link
                        href={href}
                        aria-label={`${row.displayName} — ${t(EXTRA.openStudent)}`}
                        className={cn("hover:text-b-purple", MOTION.base)}
                      >
                        {row.displayName}
                      </Link>
                    ) : (
                      row.displayName
                    )}
                  </span>
                  <span className={cn(TYPE.meta, INK.muted)}>
                    {t(TL.colIndependent)}:{" "}
                    {pct === null ? (
                      <span>{t(TL.emptyNotMeasured)}</span>
                    ) : (
                      <span className={cn("tabular-nums", toneText("ok"))}>{pct}</span>
                    )}{" "}
                    <span className="tabular-nums">{nOfM(row.solvedIndependent, solved)}</span>
                  </span>
                </div>

                <ul className={cn("mt-1", GAP.tight)}>
                  {row.strengths.map((strength, index) => (
                    <li
                      key={`${strength.kind}-${index}`}
                      className={cn(TYPE.meta, INK.secondary)}
                    >
                      {t(strength.detail)}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* 7 — the monthly check                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The state of the month's assessment, and the two ways it can be quietly wrong.
 *
 * The four states are a counted list rather than four more headline tiles: this
 * band is not competing with the situation line, and «Ждёт проверки 3» beside a
 * proportional bar is read faster than a tile is. Zero rows are kept — «Не начал
 * 0» is a fact — and the roster the four are counted against is named under
 * them, because a distribution without its denominator is a picture.
 *
 * `unmeasuredCoding` is a judge outage: the learner sat the check, the code was
 * submitted and no verdict was ever recorded, so the completion count above it
 * is deflated by something that happened to the infrastructure rather than to a
 * child. It stays in the layout rather than in a disclosure, because an absence
 * a dashboard does not mention is one a teacher reads as a result.
 *
 * `humanMarkedAnswers` used to sit beside it as a second warning — written and
 * oral answers were accepted and stored nowhere. Migration 0021 keeps them, so
 * the same number is now a piece of WORK rather than a loss, and it is rendered
 * as what a teacher does next: a count and a link into the marking queue. A
 * warning band would be telling them something broke.
 */
function AssessmentStrip({ overview, query }: { overview: TeacherOverview; query: string }) {
  const { t } = useLocale();
  const assessment = overview.assessment;
  const href = `/teacher/assessments?${query}`;

  if (!assessment) {
    return (
      <Section title={t(TL.assessmentsTitle)}>
        <EmptyState title={t(TL.assessmentNotOpen)} />
      </Section>
    );
  }

  const slices: DistributionSlice[] = ASSESSMENT_ROW.map((entry) => ({
    key: entry.state,
    label: t(entry.label),
    value: assessment.counts[entry.state],
    tone: ASSESSMENT_TONE[entry.state],
  }));

  return (
    <Section
      title={t(TL.assessmentsTitle)}
      description={t(assessment.title)}
      action={<SectionLink href={href} label={t(EXTRA.allAssessments)} />}
    >
      {assessment.open ? (
        <Distribution
          slices={slices}
          total={overview.context.enrolled}
          caption={`${t(TL.kpiStudents)}: ${overview.context.enrolled}`}
        />
      ) : (
        <EmptyState title={t(TL.assessmentNotOpen)} />
      )}

      {assessment.unmeasuredCoding > 0 ? (
        <WarnBand
          headline={t(unmeasuredCodingCount(assessment.unmeasuredCoding))}
          body={t(TL.assessmentUnmeasured)}
        />
      ) : null}

      {/* Only what nobody has read. `humanMarkedAnswers` counts everything the
          class produced and never falls, so using it here was the same broken
          promise the queue itself had: a teacher works through the stack and
          the overview keeps saying three. `pendingReview` comes from
          `human_reviews` and reaches zero. */}
      {assessment.pendingReview > 0 ? (
        <p className={cn("mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1", TYPE.body)}>
          <span className={cn("font-medium", INK.primary)}>
            {t(awaitingReadingCount(assessment.pendingReview))}
          </span>
          <SectionLink href={href} label={t(REVIEW_LINK)} />
        </p>
      ) : null}
    </Section>
  );
}

/** The link into the queue. A verb, and the same verb the queue's rows use. */
const REVIEW_LINK = { kk: "Жұмыстарды оқу", ru: "Читать работы" } as const;

const ASSESSMENT_TONE: Record<AssessmentState, Tone> = {
  not_open: "lock",
  /* Not amber: nobody starting a check that opened this morning is not a fault. */
  not_started: "lock",
  in_progress: "info",
  /* Amber because it is work waiting on a person, and that person is the reader. */
  awaiting_review: "warn",
  complete: "ok",
};

/** A full-width warning. Never a chip — these two are not footnotes. */
function WarnBand({ headline, body }: { headline: string; body: string }) {
  return (
    <p className={cn("mt-4 border px-4 py-3", RADIUS.panel, TYPE.body, toneChip("warn"))}>
      <span className="font-semibold">{headline}</span>{" "}
      <span className={INK.secondary}>{body}</span>
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* 8 — the quiet rail                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The counters, last.
 *
 * Not because they are unimportant — the roster size and the independent /
 * assisted split are how a teacher checks the situation line's arithmetic — but
 * because nobody with three minutes before a lesson starts with them. Three of
 * the four are windowed and say so; the roster is not, and does not.
 */
function MetricsRail({
  overview,
  period,
}: {
  overview: TeacherOverview;
  period: TeacherPeriod;
}) {
  const { t } = useLocale();
  const k = overview.kpis;
  const windowLabel = t(WINDOW_LABEL[period]);
  const median = minutes(k.medianPracticeMinutes);

  return (
    <Section title={t(EXTRA.railTitle)}>
      <StatRow columns={4}>
        <StatTile label={t(TL.kpiStudents)} value={k.totalStudents} />
        <StatTile label={t(TL.kpiIndependent)} value={k.independentSolves} sub={windowLabel} />
        <StatTile label={t(TL.kpiAssisted)} value={k.assistedSolves} sub={windowLabel} />
        <StatTile
          label={t(TL.kpiPracticeMedian)}
          value={median}
          sub={median === null ? windowLabel : `${t(TL.minutesShort)} · ${windowLabel}`}
        />
      </StatRow>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Shared bits                                                                */
/* -------------------------------------------------------------------------- */

/** The "see all of this" link in a section header. */
function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium text-b-purple hover:opacity-80",
        TYPE.body,
        MOTION.base,
      )}
    >
      {label}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/**
 * The wait.
 *
 * Blocks of the right shape rather than a spinner, so the page does not jump
 * when the payload lands, and a live region that says what is happening —
 * «Загрузка…» is information a screen reader otherwise never receives.
 */
function OverviewSkeleton() {
  const { t } = useLocale();
  return (
    <div className={GAP.band} role="status" aria-live="polite">
      <span className="sr-only">{t(TL.loading)}</span>
      {[0, 1, 2].map((block) => (
        <div key={block} className="grid gap-3">
          <div className="h-4 w-[180px] animate-pulse rounded bg-b-fg/10" />
          <div
            className={cn(
              "animate-pulse rounded-[14px] bg-b-fg/5",
              block === 0 ? "h-[104px]" : "h-[180px]",
            )}
          />
        </div>
      ))}
    </div>
  );
}
