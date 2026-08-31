"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  BlockSummary,
  ClassSkillMatrix,
  SkillDetail,
  SkillSummary,
} from "@schools/teacher/contracts";
import { EVIDENCE_LABEL, type EvidenceState } from "@schools/presentation/evidence";
import { numericDate } from "@schools/presentation/dates";
import {
  teacherLoadFailure,
  teacherLoadFailureLabel,
  type TeacherLoadFailure,
} from "@schools/presentation/teacher-outcome";
import { TL } from "@schools/teacher/labels";
import {
  EXTRA,
  introducedInMonth,
  learnersAffected,
} from "@schools/teacher/labels-extra/skills";
import { useLocale } from "@/components/sx/i18n";
import { cn } from "@/lib/utils";
import { useTeacherView } from "./shell";
import { GAP, INK, MOTION, NUM, RADIUS, SURFACE, TYPE } from "./tokens";
import {
  Chip,
  DataTable,
  EmptyState,
  EVIDENCE_TONE_THEMED,
  EvidenceDot,
  Hint,
  Num,
  SearchInput,
  Section,
  StatRow,
  StatTile,
  type DataColumn,
} from "./ui";

/**
 * Class × skill.
 *
 * ## The question this page is opened with
 *
 * «Which concept is the class weakest on?» — one line, asked between two
 * lessons. The first build answered it with a twenty-column heatmap whose
 * headers were full names rotated 90°, and put the per-skill distribution — the
 * thing that actually answers it — below the fold underneath that grid. That is
 * analytical tooling served to somebody who asked a one-line question.
 *
 * So the default is now **one row per taught skill**: the title, the five-state
 * spread as a proportional strip with its counts beside it, who has attempted
 * it, the median attempt count, and the mistake that shows up most. Sorted by
 * how much of the class needs review, so the answer is the first row.
 *
 * The matrix is kept in full behind a two-option switcher, because "which of my
 * twenty children is the one on this skill" is a real second question — it is
 * just not the first one. It reads better there than it did as the default:
 * initials instead of rotated names (the full name is in a `title` *and* an
 * `sr-only` span, so it is never hover-only), a sticky header and a sticky skill
 * column, 40px cells, and a row/column cross-highlight.
 *
 * ## The one thing this page has always existed to fix
 *
 * The old skill table listed a skill only if somebody in the class had already
 * attempted it (audit #17). That is not a small omission: it means the surface a
 * teacher uses to answer "what has this class actually covered?" silently
 * redefines the curriculum as *whatever the class happens to have opened*. A
 * skill September taught and nobody touched — the single most actionable row on
 * the screen — was the one row that could not appear.
 *
 * `ClassSkillMatrix.skills` already carries those rows, with
 * `counts.not_started` equal to the whole roster. They are rendered in both
 * views, and a skill nobody has started says so in a sentence
 * (`TL.skillNobodyStarted`) rather than being left as an empty stripe for a
 * teacher to interpret as "nobody has learned this".
 *
 * ## No percentage, anywhere
 *
 * There is no mastery number on this page and there is no bar that stands in for
 * one. A mastery figure needs difficulty calibration and a cause for most
 * failures, and the system has neither — `unattributedFailures` sits at the top
 * level of `LearnerState` precisely so nobody can read the rest without seeing
 * how much of it is unexplained. The five evidence states are the vocabulary,
 * every count is an integer a teacher could recount by hand, and every ratio
 * ships its denominator. `EXTRA.statesNote` says all of that out loud and stays
 * on screen in both views: it is a caveat that changes how the numbers are read,
 * not methodology that can be folded into a disclosure.
 */

/* -------------------------------------------------------------------------- */
/* Shared vocabulary                                                          */
/* -------------------------------------------------------------------------- */

/** Which of the two cuts of the payload is on screen. */
type SkillsView = "list" | "matrix";

/**
 * Reading order for the five states, and it is a progression with a flag on the
 * end rather than a ranking.
 *
 * `not_started` → `learning` → `practicing` → `independent_evidence` is how much
 * evidence exists. `needs_review` is last because it is orthogonal: a learner
 * can hold it while solving plenty, and it is the column a teacher scans for.
 */
const EVIDENCE_ORDER: readonly EvidenceState[] = [
  "not_started",
  "learning",
  "practicing",
  "independent_evidence",
  "needs_review",
];

/**
 * Solid fills, for the distribution strips and their legend swatches.
 *
 * `b-green-2` is the independent series and `b-chart` the assisted one — the
 * same two the learner chart uses, so the surfaces cannot drift. `b-green` is
 * deliberately absent: it is the SAME colour as `b-green-2` in the light arm, so
 * a series using both would collapse into one stripe on a school projector.
 *
 * The two neutral greys are not "bad" — they are absence and near-absence of
 * measurement, and every swatch is rendered beside its word.
 */
const EVIDENCE_FILL: Record<EvidenceState, string> = {
  not_started: "bg-b-fg/15",
  learning: "bg-b-fg/35",
  practicing: "bg-b-chart",
  independent_evidence: "bg-b-green-2",
  needs_review: "bg-b-warn-fill",
};

/**
 * A distinct SHAPE per state.
 *
 * The grid is the reason. Twenty columns of `EvidenceDot` would be twenty
 * columns of identical bullets separated only by hue, which is exactly the
 * WCAG 1.4.1 failure the audit recorded (#18) and useless to the roughly one boy
 * in twelve who cannot separate the green from the amber. Dash, ring, half-ring,
 * disc and triangle are told apart in monochrome, at 16px, from the back of a
 * classroom — and every cell still carries its word in `sr-only` text and a
 * `title`, so nothing here depends on seeing the shape either.
 *
 * The same marks label the counts beside each skill's strip in the list view, so
 * the two views share one visual vocabulary and one legend.
 */
const EVIDENCE_GLYPH: Record<EvidenceState, ReactNode> = {
  not_started: <rect x="4.5" y="7.25" width="7" height="1.5" rx="0.75" fill="currentColor" />,
  learning: <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.5" fill="none" />,
  practicing: (
    <>
      <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M8 4.9A3.1 3.1 0 0 0 8 11.1Z" fill="currentColor" />
    </>
  ),
  independent_evidence: <circle cx="8" cy="8" r="3.9" fill="currentColor" />,
  needs_review: <path d="M8 3.5L14.1 13H1.9Z" fill="currentColor" />,
};

function EvidenceMark({ state }: { state: EvidenceState }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", EVIDENCE_TONE_THEMED[state])}
    >
      {EVIDENCE_GLYPH[state]}
    </svg>
  );
}

/** A learner with no subject row has no cells; the key still has to be stable. */
function learnerKey(learner: { subjectId: string | null; displayName: string }, index: number) {
  return learner.subjectId ?? `row-${index}`;
}

/**
 * A learner's initials, for a 40px column header.
 *
 * Two parts at most — «Айгүл Серікқызы» is «АС», not «АС» plus whatever a third
 * name would add to a header that has to stay square. Nothing depends on
 * reading these: the `<th>`'s accessible name is the full name, in an `sr-only`
 * span, and the same name is in a `title` for the pointer.
 */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => [...part][0]?.toUpperCase() ?? "").join("");
}

function cellState(
  cells: ClassSkillMatrix["cells"],
  skillId: string,
  subjectId: string | null,
): EvidenceState {
  /* "Absent means `not_started`" is the contract, and it is the honest default:
     a learner with no row on a skill has not been measured on it. */
  if (!subjectId) return "not_started";
  return cells[skillId]?.[subjectId] ?? "not_started";
}

function totalOf(counts: Record<EvidenceState, number>): number {
  return EVIDENCE_ORDER.reduce((sum, state) => sum + (counts[state] ?? 0), 0);
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function TeacherSkills() {
  const { t } = useLocale();
  const { classId, period, report } = useTeacherView();

  /**
   * One state cell for the whole load, stamped with the request it answers.
   *
   * The obvious shape — `matrix`, `failure`, and a `setMatrix(null)` at the top
   * of the effect to clear the previous class — is a synchronous setState inside
   * an effect body, which cascades a render on every period change. Stamping the
   * payload with its own request key gets the same guarantee for free: a result
   * whose key is not the key currently on screen is a stale answer, and render
   * treats it as "still loading" without anything having to reset it.
   *
   * `failure` is a CLOSED union, never a caught message. The three sentences
   * behind it are the only things this page can say about a failure, so there is
   * no value a network error or an HTML error page can carry onto a screen in
   * front of a class.
   */
  const [load, setLoad] = useState<{
    key: string;
    matrix: ClassSkillMatrix | null;
    failure: TeacherLoadFailure | null;
  }>({ key: "", matrix: null, failure: null });
  const [openSkillId, setOpenSkillId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  /* Page-local, and deliberately not in the URL: the shell owns `class` and
     `period`, which are the two a teacher pastes to a colleague. Which of two
     renderings of the same payload you were looking at is not. */
  const [view, setView] = useState<SkillsView>("list");

  const requestKey = `${classId}|${period}`;

  useEffect(() => {
    if (!classId) return;
    let live = true;
    fetch(
      `/api/teacher/class/${encodeURIComponent(classId)}/skills?period=${encodeURIComponent(period)}`,
    )
      .then(async (r) => {
        if (!r.ok) {
          const reason = await r
            .json()
            .then((d: { error?: unknown }) => d?.error)
            .catch(() => null);
          if (live) {
            setLoad({ key: requestKey, matrix: null, failure: teacherLoadFailure(reason) });
          }
          return;
        }
        const data = (await r.json()) as ClassSkillMatrix;
        if (!live) return;
        setLoad({ key: requestKey, matrix: data, failure: null });
        /* The chrome does not fetch a seventh time — the page that already holds
           the context and the freshness stamp reports them up. */
        report({ context: data.context, freshness: data.freshness });
      })
      /* No parameter, deliberately: there is nothing in a network error a
         teacher can act on, and reading it is how it ends up rendered. */
      .catch(() => {
        if (live) setLoad({ key: requestKey, matrix: null, failure: "unavailable" });
      });
    return () => {
      live = false;
    };
  }, [classId, period, requestKey, report]);

  const answered = load.key === requestKey;
  const matrix = answered ? load.matrix : null;
  const failure = answered ? load.failure : null;

  const skills = useMemo(() => matrix?.skills ?? [], [matrix]);
  const learners = matrix?.learners ?? [];

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return skills;
    return skills.filter((s) => t(s.title).toLocaleLowerCase().includes(needle));
  }, [skills, query, t]);

  const openSkill = useMemo(
    () => skills.find((s) => s.skillId === openSkillId) ?? null,
    [skills, openSkillId],
  );

  const closeDrawer = useCallback(() => setOpenSkillId(null), []);

  if (failure) {
    return (
      <Section title={t(TL.skillsTitle)}>
        <EmptyState title={t(teacherLoadFailureLabel(failure))} />
      </Section>
    );
  }

  if (!matrix) {
    return (
      <Section title={t(TL.skillsTitle)}>
        <div
          role="status"
          aria-live="polite"
          className={cn("h-64 animate-pulse border border-b-fg/12 bg-b-fg/5", RADIUS.panel)}
        >
          <span className="sr-only">{t(TL.loading)}</span>
        </div>
      </Section>
    );
  }

  if (skills.length === 0) {
    return (
      <Section title={t(TL.skillsTitle)}>
        <EmptyState title={t(EXTRA.noSkillsYet)} hint={t(TL.skillNotIntroduced)} />
      </Section>
    );
  }

  const untouched = skills.filter((s) => s.attemptedBy === 0).length;
  const withReview = skills.filter((s) => s.counts.needs_review > 0).length;
  const withIndependent = skills.filter((s) => s.counts.independent_evidence > 0).length;

  return (
    <>
      <Section title={t(TL.skillsTitle)} action={<ViewSwitch value={view} onChange={setView} />}>
        <div className={GAP.block}>
          <div>
            {/* Stays visible in both views. It is not documentation — it is the
                sentence that stops a teacher looking for the percentage that is
                deliberately not there. */}
            <p className={cn("max-w-[68ch]", TYPE.body, INK.secondary)}>{t(EXTRA.statesNote)}</p>
            <div className="mt-2">
              <Hint label={t(EXTRA.howToRead)}>
                <p>{t(EXTRA.legendNotStartedNote)}</p>
                {view === "matrix" ? (
                  <p className="mt-1.5">{t(EXTRA.matrixDescription)}</p>
                ) : null}
              </Hint>
            </div>
          </div>

          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t(EXTRA.searchSkill)}
            className="w-full sm:w-[280px]"
          />

          {/* Directly above whichever view is showing, because both of them are
              drawn in the same five marks. */}
          <EvidenceLegend />

          {filtered.length === 0 ? (
            <EmptyState title={t(EXTRA.searchNoSkill)} />
          ) : view === "list" ? (
            <SkillList skills={filtered} onOpen={setOpenSkillId} />
          ) : learners.length === 0 ? (
            <EmptyState title={t(TL.emptyNoStudents)} />
          ) : (
            <SkillMatrix
              skills={filtered}
              learners={learners}
              cells={matrix.cells}
              onOpen={setOpenSkillId}
            />
          )}
        </div>
      </Section>

      {/*
        The counts about the curriculum, not about a skill.

        Last, and that is the demotion the audit asked for on the overview and
        that applies here for the same reason: four tiles counting *skills* are
        context for the list, not the answer to "which concept is weakest". They
        were the first thing on the page and they answered nothing a teacher
        opens this route to ask.
      */}
      <Section title={t(EXTRA.summaryTitle)}>
        <StatRow columns={4}>
          <StatTile label={t(EXTRA.kpiSkillsTaught)} value={skills.length} />
          <StatTile
            label={t(EXTRA.kpiSkillsUntouched)}
            value={untouched}
            denominator={skills.length}
            tone="lock"
          />
          <StatTile
            label={t(EXTRA.kpiSkillsWithReview)}
            value={withReview}
            denominator={skills.length}
            tone="warn"
            sub={t(EXTRA.kpiAtLeastOne)}
          />
          <StatTile
            label={t(EXTRA.kpiSkillsWithIndependent)}
            value={withIndependent}
            denominator={skills.length}
            tone="ok"
            sub={t(EXTRA.kpiAtLeastOne)}
          />
        </StatRow>
      </Section>

      {openSkill ? (
        <SkillDrawer
          key={openSkill.skillId}
          classId={classId}
          period={period}
          summary={openSkill}
          onClose={closeDrawer}
        />
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* View switcher                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Skills-as-rows or the class grid.
 *
 * Same construction as the shell's period control — `radiogroup` with
 * `aria-checked`, so the browser supplies arrow-key movement once the roles are
 * right — rather than a second idiom for the same job one bar further down the
 * page. The shell's own `Segmented` is private to `shell.tsx`, and this page is
 * not the right reason to widen that file's API.
 */
function ViewSwitch({
  value,
  onChange,
}: {
  value: SkillsView;
  onChange: (next: SkillsView) => void;
}) {
  const { t } = useLocale();
  const options: readonly { value: SkillsView; label: string }[] = [
    { value: "list", label: t(EXTRA.viewBySkill) },
    { value: "matrix", label: t(EXTRA.viewByLearner) },
  ];
  return (
    <div
      role="radiogroup"
      aria-label={t(EXTRA.viewLabel)}
      className={cn("flex w-fit gap-0.5 border border-b-fg/15 p-0.5", RADIUS.pill)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "cursor-pointer px-3 py-1.5 whitespace-nowrap",
            RADIUS.pill,
            TYPE.body,
            MOTION.base,
            value === option.value
              ? "bg-b-fg font-medium text-b-bg"
              : cn(INK.secondary, "hover:bg-b-fg/[0.06] hover:text-b-fg"),
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Legend                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The key to both views, and it is not optional decoration.
 *
 * `LegendKey` in the primitive kit paints a colour swatch, which is right for a
 * two-series bar chart and wrong here: what distinguishes these five is the
 * shape, so the legend has to show the shape.
 *
 * Its own label is sentence case at `TYPE.meta`. It used to be `b-eyebrow` —
 * caps at 12px in Cyrillic, over a list of five words also in Cyrillic, for a
 * caption nobody needs to find twice.
 */
function EvidenceLegend() {
  const { t } = useLocale();
  return (
    <div>
      <p className={cn(TYPE.meta, INK.muted)}>{t(EXTRA.legendTitle)}</p>
      <ul className="mt-1.5 flex flex-wrap gap-x-5 gap-y-2">
        {EVIDENCE_ORDER.map((state) => (
          <li
            key={state}
            className={cn("flex items-center gap-1.5", TYPE.meta, INK.secondary)}
          >
            <EvidenceMark state={state} />
            <span>{t(EVIDENCE_LABEL[state])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Default view: skills as rows                                               */
/* -------------------------------------------------------------------------- */

/**
 * One skill's class split: a proportional strip, and the counts under it.
 *
 * The strip is a shape and the numbers are absolute, which is the only honest
 * pairing — a segment cannot be measured off the screen, and the integer under
 * it is what a teacher could recount against a register. There is no percentage
 * on it and no single number standing in for the skill.
 *
 * Each count is marked with the state's own glyph, carries the state's word in
 * an `sr-only` span and in a `title`, and is ordered identically in every row,
 * so a column of rows can be scanned down one state at a time. A zero takes
 * `INK.faint`: the point of a dense count row is finding what is *not* zero.
 */
function SkillSpread({ counts }: { counts: Record<EvidenceState, number> }) {
  const { t } = useLocale();
  const total = totalOf(counts);
  return (
    <div className="min-w-[186px]">
      {total > 0 ? (
        <div
          aria-hidden="true"
          className="flex h-2 w-full overflow-hidden rounded-full bg-b-fg/10"
        >
          {EVIDENCE_ORDER.map((state) => {
            const n = counts[state] ?? 0;
            if (n <= 0) return null;
            return (
              <div
                key={state}
                className={EVIDENCE_FILL[state]}
                style={{ width: `${(n / total) * 100}%` }}
              />
            );
          })}
        </div>
      ) : null}
      <ul
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1",
          total > 0 ? "mt-2" : undefined,
        )}
      >
        {EVIDENCE_ORDER.map((state) => {
          const n = counts[state] ?? 0;
          const label = t(EVIDENCE_LABEL[state]);
          return (
            <li key={state} title={label} className="flex items-center gap-1">
              <EvidenceMark state={state} />
              <span className="sr-only">{label}</span>
              <span className={cn(NUM.cell, n === 0 ? INK.faint : INK.primary)}>{n}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The default view: one row per taught skill.
 *
 * Ordered by `counts.needs_review`, descending, on first render — so the row a
 * teacher opened the page to find is the top one, before they touch anything.
 * That sort lives on the distribution column, because the strip is where the
 * quantity being sorted on is visible; every other column sorts on its own
 * value.
 *
 * `lastActivityAt` is not a column here. It is in the drawer, on the line under
 * the distribution, which is where it is read — one date per skill, in a row a
 * teacher scans for a name and a spread, was the eighth thing competing for the
 * width. Same for a named mistake's `occurrences`: the row states how many
 * learners it touched, and the full count with its last-seen date is one click
 * away in the drawer's own mistakes table.
 */
function SkillList({
  skills,
  onOpen,
}: {
  skills: readonly SkillSummary[];
  onOpen: (skillId: string) => void;
}) {
  const { t } = useLocale();

  const columns: DataColumn<SkillSummary>[] = [
    {
      key: "skill",
      header: TL.colSkill,
      width: "280px",
      sortable: true,
      sortValue: (s) => t(s.title),
      render: (s) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => onOpen(s.skillId)}
            aria-label={`${t(s.title)} — ${t(EXTRA.openSkill)}`}
            className={cn(
              "cursor-pointer text-left hover:text-b-purple",
              TYPE.rowTitle,
              INK.primary,
              MOTION.base,
            )}
          >
            {t(s.title)}
          </button>
          {/* The audit's #17, said out loud rather than left as a row of zeroes
              for a teacher to read as "nobody has learned this". */}
          {s.attemptedBy === 0 ? (
            <p className={cn("mt-1 max-w-[42ch]", TYPE.meta, INK.muted)}>
              {t(TL.skillNobodyStarted)}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "spread",
      header: EXTRA.colSpread,
      width: "230px",
      sortable: true,
      /* How much of the class needs another look — the question the page is
         opened with, and the order it opens in. */
      sortValue: (s) => s.counts.needs_review ?? 0,
      render: (s) => <SkillSpread counts={s.counts} />,
    },
    {
      key: "attemptedBy",
      header: TL.colAttemptedBy,
      align: "right",
      sortable: true,
      sortValue: (s) => s.attemptedBy,
      render: (s) => <Num value={s.attemptedBy} />,
    },
    {
      key: "medianAttempts",
      header: TL.colMedianAttempts,
      align: "right",
      sortable: true,
      sortValue: (s) => s.medianAttempts,
      render: (s) => <Num value={s.medianAttempts} />,
    },
    {
      key: "topMistake",
      header: TL.colTopMistake,
      width: "250px",
      sortable: true,
      sortValue: (s) => s.topMistake?.learners ?? null,
      render: (s) =>
        s.topMistake ? (
          <div className="min-w-0">
            <p className={cn(TYPE.body, INK.primary)}>{t(s.topMistake.label)}</p>
            <p className={cn("mt-0.5 tabular-nums", TYPE.meta, INK.muted)}>
              {t(learnersAffected(s.topMistake.learners))}
            </p>
          </div>
        ) : (
          <span className={cn(TYPE.meta, INK.muted)}>{t(EXTRA.noNamedMistake)}</span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={skills}
      rowKey={(s) => s.skillId}
      caption={t(EXTRA.summaryCaption)}
      initialSort={{ key: "spread", direction: "desc" }}
      empty={<EmptyState title={t(EXTRA.searchNoSkill)} />}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Second view: the class grid                                                */
/* -------------------------------------------------------------------------- */

/**
 * Skills down, learners across.
 *
 * **Why this orientation and not the transpose.** The two axes are not
 * symmetrical. A skill's label is a phrase — «Циклдағы шартты тексеру» — and a
 * learner's is a name; only one of them can survive being a 40px column header.
 * Putting skills in rows gives every one of them a full readable line at the
 * left and leaves the narrow axis to the thing that fits in it.
 *
 * **What changed.** The header used to be twenty full names in `writing-mode:
 * vertical-rl`, 132px of rotated Cyrillic that a teacher had to tilt their head
 * to read and that cost the same 132px at every breakpoint. It is now the
 * learner's initials, horizontal, in a 40px square — with the full name in a
 * `title` for the pointer AND in an `sr-only` span, so the column is identified
 * without hovering and without sight. Cells went from 32px to 40px, which is a
 * real hit area rather than a mosaic.
 *
 * **The cross-highlight.** Finding «what is Айгүл's state on this skill» in a
 * 20 × 30 grid is a row-and-column intersection problem, and an unaided eye
 * loses the row about four columns in. Hovering any cell tints its row and its
 * column; focusing a skill's button tints its row, which is the keyboard path.
 * The column has no focusable element and does not get a focus arm — thirty tab
 * stops in a header would cost far more than the highlight is worth, and the
 * `sr-only` names already make the association explicit without it.
 *
 * At 1024px this scrolls horizontally *inside its own box*: 18–30 columns at
 * 40px never fit, and the page itself must never scroll sideways. The skill
 * column is `sticky left-0` — narrower below `sm`, so a 375px viewport keeps a
 * usable strip of grid beside it — and the header row is `sticky top-0`.
 *
 * `border-separate` rather than `border-collapse`: collapsed borders are dropped
 * by several browsers under `position: sticky`, and a header that loses its rule
 * when it sticks reads as a rendering fault.
 */
function SkillMatrix({
  skills,
  learners,
  cells,
  onOpen,
}: {
  skills: readonly SkillSummary[];
  learners: ClassSkillMatrix["learners"];
  cells: ClassSkillMatrix["cells"];
  onOpen: (skillId: string) => void;
}) {
  const { t } = useLocale();
  const [activeColumn, setActiveColumn] = useState<number | null>(null);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  const clear = useCallback(() => {
    setActiveColumn(null);
    setActiveSkill(null);
  }, []);

  const stickyWidth = "w-[176px] min-w-[176px] sm:w-[248px] sm:min-w-[248px]";

  return (
    /* `w-full min-w-0` is defensive: the matrix table is `w-max`, and a scroll
       container that inherits `min-width: auto` from a future flex ancestor
       would let the table push the page wide instead of scrolling inside
       itself. */
    <div
      onMouseLeave={clear}
      className={cn(
        "max-h-[560px] w-full min-w-0 overflow-auto border border-b-fg/12",
        RADIUS.panel,
      )}
    >
      <table className="w-max border-separate border-spacing-0 text-left">
        <caption className="sr-only">{t(EXTRA.matrixCaption)}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              onMouseEnter={() => setActiveColumn(null)}
              className={cn(
                "sticky top-0 left-0 z-30 border-r border-b border-b-fg/12",
                stickyWidth,
                SURFACE.raised,
                "px-3 py-2 align-bottom",
                TYPE.meta,
                INK.muted,
              )}
            >
              {t(EXTRA.matrixCorner)}
            </th>
            {learners.map((learner, index) => (
              <th
                key={learnerKey(learner, index)}
                scope="col"
                onMouseEnter={() => setActiveColumn(index)}
                className={cn(
                  "sticky top-0 z-20 h-10 w-10 min-w-10 border-b border-b-fg/12 p-0",
                  "text-center align-middle",
                  SURFACE.raised,
                  MOTION.base,
                  activeColumn === index ? INK.primary : INK.muted,
                )}
              >
                <span
                  aria-hidden="true"
                  title={learner.displayName}
                  className={cn("block font-semibold", TYPE.meta)}
                >
                  {initialsOf(learner.displayName)}
                </span>
                {/* The full name, always available — never hover-only. */}
                <span className="sr-only">{learner.displayName}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => {
            const nobody = skill.attemptedBy === 0;
            const rowActive = activeSkill === skill.skillId;
            return (
              <tr key={skill.skillId} onMouseEnter={() => setActiveSkill(skill.skillId)}>
                <th
                  scope="row"
                  onMouseEnter={() => setActiveColumn(null)}
                  className={cn(
                    "sticky left-0 z-10 border-r border-b border-b-fg/10",
                    stickyWidth,
                    "px-3 py-2 text-left align-middle font-normal",
                    MOTION.base,
                    rowActive ? SURFACE.raised : SURFACE.page,
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(skill.skillId)}
                    onFocus={() => setActiveSkill(skill.skillId)}
                    onBlur={() => setActiveSkill(null)}
                    aria-label={`${t(skill.title)} — ${t(EXTRA.openSkill)}`}
                    className={cn(
                      "block w-full cursor-pointer rounded text-left hover:text-b-purple",
                      TYPE.body,
                      INK.primary,
                      MOTION.base,
                    )}
                  >
                    <span className="line-clamp-2">{t(skill.title)}</span>
                  </button>
                  {nobody ? (
                    <span className="mt-1 flex">
                      <Chip tone="lock" title={t(TL.skillNobodyStarted)}>
                        {t(EXTRA.nobodyStartedShort)}
                        <span className="sr-only">. {t(TL.skillNobodyStarted)}</span>
                      </Chip>
                    </span>
                  ) : null}
                </th>
                {learners.map((learner, index) => {
                  const state = cellState(cells, skill.skillId, learner.subjectId);
                  const label = t(EVIDENCE_LABEL[state]);
                  /* The one state a teacher must not scroll past keeps its wash
                     under the cross-highlight, and deepens rather than losing it
                     — two competing `bg-` classes on one element would be
                     resolved by stylesheet order, not by intent. */
                  const flagged = state === "needs_review";
                  const crossed = rowActive || activeColumn === index;
                  return (
                    <td
                      key={learnerKey(learner, index)}
                      onMouseEnter={() => setActiveColumn(index)}
                      className={cn(
                        "h-10 w-10 min-w-10 border-b border-l border-b-fg/10 p-0",
                        "text-center align-middle",
                        MOTION.base,
                        flagged
                          ? crossed
                            ? "bg-b-warn/20"
                            : "bg-b-warn/10"
                          : crossed
                            ? SURFACE.inset
                            : undefined,
                      )}
                    >
                      <span
                        title={`${learner.displayName} · ${label}`}
                        className="inline-flex size-10 items-center justify-center"
                      >
                        <EvidenceMark state={state} />
                        <span className="sr-only">{label}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail drawer                                                              */
/* -------------------------------------------------------------------------- */

/**
 * One skill, opened.
 *
 * A drawer rather than an expanded row: the detail is four tables' worth of
 * material and a table row that grows to a screen and a half pushes every other
 * skill off the display, which is the opposite of what a teacher opened it for.
 * The view behind it stays put, so closing returns to exactly the same scroll
 * position in the same list.
 *
 * Modal semantics are real, not decorative — `role="dialog"`, `aria-modal`,
 * `aria-labelledby`, focus moved in on open and returned to the trigger on
 * close, Escape closes, and the page behind is scroll-locked so a trackpad
 * flick does not move the thing the teacher is not looking at.
 */
function SkillDrawer({
  classId,
  period,
  summary,
  onClose,
}: {
  classId: string;
  period: string;
  summary: SkillSummary;
  onClose: () => void;
}) {
  const { locale, t } = useLocale();
  /* Stamped with its own request, for the reason the page's own load is — see
     the comment there. The drawer is remounted per skill (`key` on the element),
     so this only ever has to survive a period change underneath it. */
  const [load, setLoad] = useState<{
    key: string;
    detail: SkillDetail | null;
    failure: TeacherLoadFailure | null;
  }>({ key: "", detail: null, failure: null });
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const headingId = useId();

  const requestKey = `${classId}|${period}|${summary.skillId}`;

  useEffect(() => {
    if (!classId) return;
    let live = true;
    fetch(
      `/api/teacher/class/${encodeURIComponent(classId)}/skills/${encodeURIComponent(
        summary.skillId,
      )}?period=${encodeURIComponent(period)}`,
    )
      .then(async (r) => {
        if (!r.ok) {
          const reason = await r
            .json()
            .then((d: { error?: unknown }) => d?.error)
            .catch(() => null);
          if (live) {
            setLoad({ key: requestKey, detail: null, failure: teacherLoadFailure(reason) });
          }
          return;
        }
        const data = (await r.json()) as SkillDetail;
        if (live) setLoad({ key: requestKey, detail: data, failure: null });
      })
      .catch(() => {
        if (live) setLoad({ key: requestKey, detail: null, failure: "unavailable" });
      });
    return () => {
      live = false;
    };
  }, [classId, period, requestKey, summary.skillId]);

  const answered = load.key === requestKey;
  const detail = answered ? load.detail : null;
  const failure = answered ? load.failure : null;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const roster = totalOf(summary.counts);
  const learners = detail?.learners ?? [];
  const strongest = learners
    .filter((l) => l.state === "independent_evidence")
    .sort((a, b) => b.soloSolved - a.soloSolved);
  const needHelp = learners.filter((l) => l.state === "needs_review");
  /* Counted, not inferred: how many learners have at least one solve that took
     help. It is not «зависит от подсказок» — that would be a judgement this
     payload cannot support — it is the number of learners the ledger shows
     solving this skill with assistance. */
  const assistedLearners = learners.filter((l) => l.assistedSolved > 0).length;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <button
        type="button"
        aria-label={t(EXTRA.close)}
        onClick={onClose}
        /* Black rather than an ink token: a scrim has to darken both themes, and
           `b-fg` inverts. Same construction as the first-run dialog. */
        className="absolute inset-0 cursor-default bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={cn(
          "sx-raised relative flex h-full w-full max-w-[680px] flex-col overflow-y-auto",
          "border-l-2 border-b-edge font-b-sans text-b-fg",
        )}
      >
        <div
          className={cn(
            "sticky top-0 z-10 flex items-start gap-4 border-b border-b-fg/12 px-6 py-5",
            SURFACE.raised,
          )}
        >
          <div className="min-w-0 flex-1">
            {/* Not `TYPE.page` — that rank belongs to the class name in the
                shell, once per route — and not `TYPE.section`, which `Section`
                renders at 18px, so an h2 at that size would be outranked by its
                own h3s three lines below it. */}
            <h2 id={headingId} className="text-[20px] leading-7 font-bold">
              {t(summary.title)}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip tone="neutral">{t(introducedInMonth(summary.introducedInMonth))}</Chip>
              {summary.attemptedBy === 0 ? (
                <Chip tone="lock">{t(EXTRA.nobodyStartedShort)}</Chip>
              ) : null}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className={cn(
              "shrink-0 cursor-pointer rounded-full border border-b-fg/15 px-3 py-1.5",
              "hover:bg-b-fg/5 hover:text-b-fg",
              TYPE.meta,
              INK.secondary,
              MOTION.base,
            )}
          >
            {t(EXTRA.close)}
          </button>
        </div>

        <div className="px-6 pb-12">
          {summary.attemptedBy === 0 ? (
            <p
              className={cn(
                "mt-5 border border-b-lock-edge bg-b-lock-fill px-4 py-3",
                RADIUS.control,
                TYPE.body,
                INK.secondary,
              )}
            >
              {t(TL.skillNobodyStarted)}
            </p>
          ) : null}

          <Section level={3} title={t(EXTRA.detailDistribution)}>
            <StatRow columns={2}>
              <StatTile
                label={t(TL.colAttemptedBy)}
                value={summary.attemptedBy}
                denominator={roster}
              />
              <StatTile
                label={t(EXTRA.detailIndependentLearners)}
                value={summary.counts.independent_evidence ?? 0}
                denominator={roster}
                tone="ok"
              />
              <StatTile
                label={t(EXTRA.detailAssistedLearners)}
                value={detail ? assistedLearners : null}
                denominator={detail ? roster : null}
                tone="info"
              />
              <StatTile
                label={t(EVIDENCE_LABEL.needs_review)}
                value={summary.counts.needs_review ?? 0}
                denominator={roster}
                tone="warn"
              />
            </StatRow>
            <div className="mt-5">
              <DistributionStrip counts={summary.counts} total={roster} />
            </div>
            <p
              className={cn(
                "mt-4 flex flex-wrap gap-x-4 gap-y-1",
                TYPE.meta,
                INK.muted,
              )}
            >
              <span>
                {t(TL.colMedianAttempts)}:{" "}
                <span className={INK.secondary}>
                  <Num value={summary.medianAttempts} />
                </span>
              </span>
              <span>
                {t(TL.colLastActive)}:{" "}
                <span className={cn("tabular-nums", INK.secondary)}>
                  {summary.lastActivityAt
                    ? numericDate(locale, new Date(summary.lastActivityAt))
                    : t(TL.never)}
                </span>
              </span>
            </p>
          </Section>

          {failure ? (
            <Section level={3} title={t(EXTRA.detailLearners)}>
              <EmptyState title={t(teacherLoadFailureLabel(failure))} />
            </Section>
          ) : !detail ? (
            <Section level={3} title={t(EXTRA.detailLearners)}>
              <div
                role="status"
                aria-live="polite"
                className={cn("h-40 animate-pulse border border-b-fg/12 bg-b-fg/5", RADIUS.panel)}
              >
                <span className="sr-only">{t(TL.loading)}</span>
              </div>
            </Section>
          ) : (
            <>
              <Section level={3} title={t(EXTRA.detailMistakes)}>
                <MistakesTable mistakes={detail.mistakes} />
              </Section>

              <Section
                level={3}
                title={t(EXTRA.detailBlocks)}
                description={t(EXTRA.detailBlocksNote)}
              >
                <BlocksTable blocks={detail.blocks} />
              </Section>

              <Section
                level={3}
                title={t(EXTRA.detailStrongest)}
                description={t(EXTRA.detailStrongestNote)}
              >
                {strongest.length === 0 ? (
                  <EmptyState title={t(EXTRA.detailNoStrongest)} />
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {strongest.map((l, index) => (
                      <li key={learnerKey(l, index)}>
                        <Chip tone="ok">
                          {l.displayName}
                          <span className="sr-only">. {t(TL.colIndependent)}:</span>
                          <span className="tabular-nums opacity-75">{l.soloSolved}</span>
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section
                level={3}
                title={t(EXTRA.detailNeedsHelp)}
                description={t(EXTRA.detailNeedsHelpNote)}
              >
                {needHelp.length === 0 ? (
                  <EmptyState title={t(EXTRA.detailNoNeedsHelp)} />
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {needHelp.map((l, index) => (
                      <li key={learnerKey(l, index)}>
                        <Chip tone="warn">
                          {l.displayName}
                          <span className="sr-only">. {t(TL.colAttempts)}:</span>
                          <span className="tabular-nums opacity-75">{l.attempts}</span>
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section level={3} title={t(EXTRA.detailLearners)}>
                <LearnersTable learners={detail.learners} />
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Drawer pieces                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The class split across the five states, as one strip with its counts beneath.
 *
 * The drawer's version of `SkillSpread`, and it spells the states out in full
 * rather than by glyph: there is exactly one of these on screen at a time, so
 * the width is available and a teacher reading a single skill should not have to
 * consult a legend.
 *
 * The strip is proportional and the numbers are absolute, which is the only
 * honest pairing: a segment is a shape, and the count under it is what a teacher
 * can check against a register. There is no percentage on it, and there is no
 * single number standing in for the whole skill.
 */
function DistributionStrip({
  counts,
  total,
}: {
  counts: Record<EvidenceState, number>;
  total: number;
}) {
  const { t } = useLocale();
  if (total <= 0) {
    return <EmptyState title={t(TL.emptyNoStudents)} />;
  }
  return (
    <div>
      <div
        aria-hidden="true"
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-b-fg/10"
      >
        {EVIDENCE_ORDER.map((state) => {
          const n = counts[state] ?? 0;
          if (n <= 0) return null;
          return (
            <div
              key={state}
              className={EVIDENCE_FILL[state]}
              style={{ width: `${(n / total) * 100}%` }}
            />
          );
        })}
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {EVIDENCE_ORDER.map((state) => {
          const n = counts[state] ?? 0;
          return (
            <li
              key={state}
              className={cn(
                "flex items-center gap-2 border-b border-b-fg/10 py-1 last:border-b-0",
                TYPE.meta,
              )}
            >
              <span
                aria-hidden="true"
                className={cn("size-3 shrink-0 rounded-sm", EVIDENCE_FILL[state])}
              />
              <span className={cn("min-w-0", INK.secondary)}>{t(EVIDENCE_LABEL[state])}</span>
              <span
                className={cn(
                  "ml-auto shrink-0 font-medium tabular-nums",
                  n === 0 ? INK.faint : INK.primary,
                )}
              >
                {n}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MistakesTable({ mistakes }: { mistakes: SkillDetail["mistakes"] }) {
  const { locale, t } = useLocale();
  type Row = SkillDetail["mistakes"][number];

  const columns: DataColumn<Row>[] = [
    {
      key: "label",
      header: TL.colTopMistake,
      width: "250px",
      /* `failureClass` never reaches the screen. It stays on the payload so a
         teacher who disputes the claim can be shown the episodes behind it. */
      render: (m) => <span className={cn(TYPE.body, INK.primary)}>{t(m.label)}</span>,
    },
    {
      key: "learners",
      header: TL.kpiStudents,
      align: "right",
      sortable: true,
      sortValue: (m) => m.learners,
      render: (m) => <Num value={m.learners} tone="warn" />,
    },
    {
      key: "occurrences",
      header: EXTRA.colOccurrences,
      align: "right",
      sortable: true,
      sortValue: (m) => m.occurrences,
      render: (m) => <Num value={m.occurrences} />,
    },
    {
      key: "lastAt",
      header: EXTRA.colLastSeen,
      align: "right",
      sortable: true,
      sortValue: (m) => Date.parse(m.lastAt),
      render: (m) => (
        <span className={cn("tabular-nums", INK.secondary)}>
          {numericDate(locale, new Date(m.lastAt))}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={mistakes}
      rowKey={(m) => m.failureClass}
      caption={t(EXTRA.mistakesCaption)}
      initialSort={{ key: "learners", direction: "desc" }}
      empty={<EmptyState title={t(EXTRA.detailNoMistakes)} />}
    />
  );
}

/**
 * The blocks that teach or test this skill, hardest first.
 *
 * `blockId` and `lessonId` are identifiers and are not rendered. The row is
 * named by its localised kind, and the ordinal in front of it is the position in
 * the hardest-first order the payload arrived in — a list index, which is what
 * the note above the table says it is.
 */
function BlocksTable({ blocks }: { blocks: readonly BlockSummary[] }) {
  const { t } = useLocale();

  const columns: DataColumn<{ block: BlockSummary; index: number }>[] = [
    {
      key: "kind",
      header: EXTRA.colBlockKind,
      width: "230px",
      render: ({ block, index }) => (
        <div className="min-w-0">
          <p className={cn("flex items-baseline gap-2", TYPE.body, INK.primary)}>
            <span className={cn("tabular-nums", INK.faint)}>{index + 1}</span>
            <span>{t(block.kindLabel)}</span>
          </p>
          {!block.machineGradable ? (
            <p className={cn("mt-1", TYPE.meta, INK.muted)}>{t(TL.blockNotMachineGraded)}</p>
          ) : null}
          {block.topFailure ? (
            <p className={cn("mt-1 text-b-warn-icon", TYPE.meta)}>{t(block.topFailure.label)}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "attempted",
      header: TL.colAttemptedBy,
      align: "right",
      sortable: true,
      sortValue: ({ block }) => block.attemptedBy,
      render: ({ block }) => <Num value={block.attemptedBy} />,
    },
    {
      key: "accepted",
      header: TL.colAcceptRate,
      align: "right",
      sortable: true,
      sortValue: ({ block }) => block.acceptedBy,
      render: ({ block }) => <Num value={block.acceptedBy} tone="ok" />,
    },
    {
      key: "revealed",
      header: TL.colRevealed,
      align: "right",
      sortable: true,
      sortValue: ({ block }) => block.revealedBy,
      render: ({ block }) => <Num value={block.revealedBy} />,
    },
    {
      key: "struggling",
      header: EXTRA.colStruggling,
      align: "right",
      sortable: true,
      sortValue: ({ block }) => block.strugglingEpisodes,
      render: ({ block }) => <Num value={block.strugglingEpisodes} tone="warn" />,
    },
    {
      key: "medianSubmissions",
      header: TL.colMedianAttempts,
      align: "right",
      sortable: true,
      sortValue: ({ block }) => block.medianSubmissions,
      render: ({ block }) => <Num value={block.medianSubmissions} />,
    },
  ];

  const rows = blocks.map((block, index) => ({ block, index }));

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={({ block }) => block.blockId}
      caption={t(EXTRA.blocksCaption)}
      empty={<EmptyState title={t(EXTRA.detailNoBlocks)} />}
    />
  );
}

/**
 * Every enrolled learner on this skill, including the ones who never opened it.
 *
 * Untouched learners are rows, not omissions. Filtering them out is the same
 * mistake as filtering out untouched skills, one level down.
 */
function LearnersTable({ learners }: { learners: SkillDetail["learners"] }) {
  const { t } = useLocale();
  type Row = SkillDetail["learners"][number];

  const columns: DataColumn<Row>[] = [
    {
      key: "name",
      header: TL.colStudent,
      width: "200px",
      sortable: true,
      sortValue: (l) => l.displayName,
      render: (l) => <span className={cn(TYPE.rowTitle, INK.primary)}>{l.displayName}</span>,
    },
    {
      key: "state",
      header: TL.colStatus,
      width: "160px",
      sortable: true,
      sortValue: (l) => EVIDENCE_ORDER.indexOf(l.state),
      render: (l) => <EvidenceDot state={l.state} />,
    },
    {
      key: "attempts",
      header: TL.colAttempts,
      align: "right",
      sortable: true,
      sortValue: (l) => l.attempts,
      render: (l) => <Num value={l.attempts} />,
    },
    {
      key: "solo",
      header: TL.colIndependent,
      align: "right",
      sortable: true,
      sortValue: (l) => l.soloSolved,
      render: (l) => <Num value={l.soloSolved} tone="ok" />,
    },
    {
      key: "assisted",
      header: TL.colAssisted,
      align: "right",
      sortable: true,
      sortValue: (l) => l.assistedSolved,
      render: (l) => <Num value={l.assistedSolved} tone="info" />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={learners}
      rowKey={(l) => l.subjectId ?? l.displayName}
      caption={t(EXTRA.detailLearnersCaption)}
      empty={<EmptyState title={t(TL.emptyNoStudents)} />}
      maxHeight={420}
    />
  );
}
