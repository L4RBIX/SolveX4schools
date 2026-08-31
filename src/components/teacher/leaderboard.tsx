"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Localized } from "@schools/curriculum/types";
import {
  isLeaderboardLens,
  LEADERBOARD_LENSES,
  type Leaderboard,
  type LeaderboardEntry,
  type LeaderboardLens,
  type TeacherPeriod,
} from "@schools/teacher/contracts";
import {
  teacherLoadFailure,
  teacherLoadFailureLabel,
  type TeacherLoadFailure,
} from "@schools/presentation/teacher-outcome";
import { TL } from "@schools/teacher/labels";
import { EXTRA, rankedOfClass, unrankedCount } from "@schools/teacher/labels-extra/leaderboard";
import { useLocale } from "@/components/sx/i18n";
import { cn } from "@/lib/utils";
import { useTeacherView } from "./shell";
import { signed, toneChip } from "./format";
import { GAP, INK, LINE, MOTION, NUM, RADIUS, SURFACE, TYPE } from "./tokens";
import { Chip, DataTable, EmptyState, Hint, Section, type DataColumn } from "./ui";

/**
 * The class ranking.
 *
 * ## Why this page is allowed to exist at all
 *
 * The project has written, twice, that it does not rank children: "the class
 * list is not sorted by score, because there is no score"
 * (`PRIVACY_DATA_FLOWS.md:318`) and "ranking children by one is the thing this
 * whole model exists to avoid" (`classroom.ts:262-265`). Both refusals stand,
 * and both are refusals of a COMPOSITE INVENTED SCORE — the `mastery: 0-100`
 * that got a whole file quarantined.
 *
 * Every number on this screen is instead a count of distinct tasks or distinct
 * days, each one traceable to an accepted episode a teacher can open. The
 * distinction is not a technicality, and this component is built so that a
 * teacher can see it rather than take it on trust:
 *
 * 1. **The formula is one click away, on this screen, in the teacher's own
 *    language.** `Leaderboard.explanation` lives in a `Hint` — a `<details>`
 *    disclosure sitting directly above the table. See the note on the meta line
 *    below for why it moved out of the panel it used to be.
 * 2. **The arithmetic is in the row.** `components` is rendered as real
 *    columns, so «4» is visibly «4 unaided, 2 assisted, 7 attempted» and can be
 *    recounted by hand against the learner's own page.
 * 3. **Nothing is called a score.** The value column's header is the counted
 *    quantity for the lens — заданий, дней, изменение — and the word «балл»
 *    appears nowhere in this file or its catalogue.
 * 4. **Unranked learners are not last.** They are a separate list with the
 *    payload's own reason beside each name, styled exactly as neutrally as the
 *    ranked table. A learner with three episodes is not the weakest child in the
 *    class; they are a child nobody has enough evidence about.
 * 5. **It says out loud that it is class-only.** `TL.leaderboardClassOnly` sits
 *    under the heading in every state this page can be in — loading, failed,
 *    empty and populated — because the sentence is most needed exactly when
 *    there is nothing else to read. That sentence is a PRIVACY property, not
 *    methodology, which is why it stays in the layout while the formula does
 *    not.
 *
 * ## What is deliberately absent
 *
 * No medal, no trophy, no gold/silver/bronze, no confetti, no emoji. The top
 * three are a step in weight and one step on the numeral ramp — `NUM.figure`
 * against `NUM.cell` — and nothing else. This is a surface a teacher opens in
 * front of a director, and the moment it looks like a game the number stops
 * being evidence and starts being a prize.
 *
 * There is also no bar or sparkline beside the values. A bar implies a
 * denominator, and three of the four lenses do not have one — the counts stand
 * on their own or they do not stand at all.
 */

/** How many places get typographic emphasis. Weight and size only. */
const LEAD_RANKS = 3;

/* -------------------------------------------------------------------------- */
/* Lens vocabulary                                                            */
/* -------------------------------------------------------------------------- */

const LENS_LABEL: Record<LeaderboardLens, Localized> = {
  independent: TL.lensIndependent,
  improvement: TL.lensImprovement,
  consistency: TL.lensConsistency,
  challenge: TL.lensChallenge,
};

/**
 * The value column's header, per lens.
 *
 * The counted quantity, never «результат» and never «балл». `improvement` is the
 * one that is not a count of things but a difference between two counts, and it
 * says so: «Изменение, заданий».
 */
const LENS_VALUE_HEADER: Record<LeaderboardLens, Localized> = {
  independent: EXTRA.valueIndependent,
  improvement: EXTRA.valueImprovement,
  consistency: EXTRA.valueConsistency,
  challenge: EXTRA.valueChallenge,
};

const PERIOD_WINDOW: Record<TeacherPeriod, Localized> = {
  week: TL.windowWeek,
  month: TL.windowMonth,
  programme: TL.windowProgramme,
};

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function TeacherLeaderboard() {
  const { t } = useLocale();
  const { classId, period, report, query } = useTeacherView();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /* The lens lives in the URL beside `?class=` and `?period=`, for the same
     reason those do: «посмотри 9А по регулярности за месяц» has to be a link
     rather than a set of instructions. An unrecognised value falls back to the
     primary board instead of rendering nothing. */
  const requested = searchParams.get("lens");
  const lens: LeaderboardLens = isLeaderboardLens(requested) ? requested : "independent";

  const setLens = useCallback(
    (next: LeaderboardLens) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("lens", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  /**
   * One state cell for the whole load, stamped with the request it answers.
   *
   * The obvious shape — a `setBoard(null)` at the top of the effect to clear the
   * previous lens — is a synchronous setState in an effect body and cascades a
   * render every time a teacher touches the picker. Stamping the payload with
   * its request key gets the same guarantee for free: a result whose key is not
   * the key on screen is a stale answer, and render treats it as "still
   * loading". It matters more here than elsewhere, because switching lens is the
   * one thing a teacher does on this page repeatedly, and a board that flashed
   * the previous lens's ranking under the new lens's formula would be showing a
   * sentence that does not describe the numbers under it.
   *
   * `failure` is a CLOSED union, never a caught message: there is nothing in a
   * network error or an HTML error page that a teacher standing in front of a
   * class can act on, and reading it is how it ends up on the projector.
   */
  const [load, setLoad] = useState<{
    key: string;
    board: Leaderboard | null;
    failure: TeacherLoadFailure | null;
  }>({ key: "", board: null, failure: null });

  const requestKey = `${classId}|${period}|${lens}`;

  useEffect(() => {
    if (!classId) return;
    let live = true;
    fetch(
      `/api/teacher/class/${encodeURIComponent(classId)}/leaderboard` +
        `?period=${encodeURIComponent(period)}&lens=${encodeURIComponent(lens)}`,
    )
      .then(async (r) => {
        if (!r.ok) {
          const reason = await r
            .json()
            .then((d: { error?: unknown }) => d?.error)
            .catch(() => null);
          if (live) {
            setLoad({ key: requestKey, board: null, failure: teacherLoadFailure(reason) });
          }
          return;
        }
        const data = (await r.json()) as Leaderboard;
        if (!live) return;
        setLoad({ key: requestKey, board: data, failure: null });
        /* The chrome does not fetch a seventh time — the page holding the
           context and the freshness stamp reports them up. */
        report({ context: data.context, freshness: data.freshness });
      })
      /* No parameter, deliberately. */
      .catch(() => {
        if (live) setLoad({ key: requestKey, board: null, failure: "unavailable" });
      });
    return () => {
      live = false;
    };
  }, [classId, period, lens, requestKey, report]);

  const answered = load.key === requestKey;
  const board = answered ? load.board : null;
  const failure = answered ? load.failure : null;

  const entries = useMemo(() => board?.entries ?? [], [board]);
  const unranked = board?.unranked ?? [];

  /** Ranks two or more learners share. Rendered, not hidden — 1, 1, 3 is honest. */
  const tiedRanks = useMemo(() => {
    const seen = new Map<number, number>();
    for (const e of entries) seen.set(e.rank, (seen.get(e.rank) ?? 0) + 1);
    return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([r]) => r));
  }, [entries]);

  const columns = useMemo(
    () => leaderboardColumns({ lens, entries, tiedRanks, query }),
    [lens, entries, tiedRanks, query],
  );

  return (
    <>
      <Section title={t(TL.leaderboardTitle)} description={t(TL.leaderboardClassOnly)}>
        {/* The picker is inside the band rather than in `Section`'s action slot,
            which is `shrink-0`: a shrink-0 flex item is laid out at its
            max-content width, so the four lens labels would push the page into a
            horizontal scroll at 375 instead of wrapping. In here it has the full
            column and wraps on its own. */}
        <div className={GAP.block}>
          <LensPicker lens={lens} onChange={setLens} />

          {failure ? (
            <EmptyState title={t(teacherLoadFailureLabel(failure))} />
          ) : !board ? (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "h-64 animate-pulse border motion-reduce:animate-none",
                RADIUS.panel,
                LINE.edge,
                SURFACE.inset,
              )}
            >
              <span className="sr-only">{t(TL.loading)}</span>
            </div>
          ) : (
            <>
              <BoardNote board={board} ranked={entries.length} hasTies={tiedRanks.size > 0} />
              <DataTable
                columns={columns}
                rows={entries}
                rowKey={(row) => row.subjectId ?? row.displayName}
                caption={t(EXTRA.tableCaption)}
                rowHref={(row) => studentHref(row.subjectId, query)}
                empty={
                  <EmptyState
                    title={t(EXTRA.noOneRanked)}
                    hint={t(
                      board.context.enrolled === 0
                        ? TL.emptyNoStudents
                        : TL.emptyInsufficientEvidence,
                    )}
                  />
                }
              />
            </>
          )}
        </div>
      </Section>

      {unranked.length > 0 ? (
        <Section
          title={t(TL.leaderboardUnranked)}
          description={t(EXTRA.unrankedNote)}
          action={<Chip tone="lock">{t(unrankedCount(unranked.length))}</Chip>}
        >
          {/* A plain ruled list, not a bordered box. These learners are not an
              object a teacher acts on as a group, and a frame around them is the
              second thing — after placement below the table — that would read as
              a bottom of the ranking. */}
          <ul>
            {unranked.map((learner, i) => {
              const href = studentHref(learner.subjectId, query);
              return (
                <li
                  key={`${learner.subjectId ?? "no-subject"}-${i}`}
                  className={cn(
                    "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5",
                    "border-t py-3 first:border-t-0 first:pt-0",
                    LINE.hair,
                  )}
                >
                  <span className={cn("min-w-0", TYPE.rowTitle, INK.primary)}>
                    {href ? (
                      <Link
                        href={href}
                        className={cn(
                          "rounded-sm underline decoration-b-fg/25 underline-offset-[3px]",
                          "hover:decoration-b-fg/60",
                          MOTION.base,
                        )}
                      >
                        {learner.displayName}
                      </Link>
                    ) : (
                      learner.displayName
                    )}
                  </span>
                  {/* The payload's own reason, in words. Never a count, never a
                      dash — the learner is unranked FOR something. */}
                  <span className={cn(TYPE.meta, INK.muted)}>{t(learner.reason)}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Lens picker                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Four lenses, one selected. The shell's segmented idiom.
 *
 * `radiogroup` + `aria-checked` rather than a tab pattern: the four options do
 * not swap panels, they re-ask the same question of the same table, and the
 * browser gives arrow-key movement for free once the roles are right.
 *
 * Two differences from `Segmented` in the shell, both deliberate. The selected
 * option takes the purple accent rather than the filled `b-fg` pill, because the
 * period selector directly above it is a filled pill and two identical controls
 * a row apart are one control a teacher hits by mistake. And the group is
 * `flex-wrap` inside a `RADIUS.control` frame rather than a stadium: «Күрделі
 * тапсырмалар» beside three more labels does not fit 375px on one line, and a
 * group that wraps to two rows inside a 9px frame still reads as one control
 * where a wrapped stadium does not.
 */
function LensPicker({
  lens,
  onChange,
}: {
  lens: LeaderboardLens;
  onChange: (next: LeaderboardLens) => void;
}) {
  const { t } = useLocale();
  return (
    <div
      role="radiogroup"
      aria-label={t(EXTRA.lensLabel)}
      className={cn("flex w-fit max-w-full flex-wrap gap-0.5 border p-0.5", RADIUS.control, LINE.edge)}
    >
      {LEADERBOARD_LENSES.map((option) => {
        const active = option === lens;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option)}
            className={cn(
              "cursor-pointer whitespace-nowrap px-3 py-1.5",
              RADIUS.pill,
              TYPE.body,
              MOTION.base,
              active
                ? cn(toneChip("accent"), "font-semibold")
                : cn(INK.secondary, "hover:bg-b-fg/[0.06] hover:text-b-fg"),
            )}
          >
            {t(LENS_LABEL[option])}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* What is being read, and how it was built                                   */
/* -------------------------------------------------------------------------- */

/**
 * One metadata line above the table, and the formula behind a disclosure.
 *
 * ## Why the formula stopped being a panel
 *
 * It was a tinted box four lines tall, above the table, on every visit forever —
 * the audit's finding for this route. A teacher who has read «считается число
 * заданий, решённых без подсказок» does not need to read it again tomorrow to
 * find out who is doing well, and pushing the names below the fold to re-state
 * the method is what makes a page a report rather than a briefing.
 *
 * It is a `<details>`, not a tooltip: keyboard-operable, announced, printable,
 * and open on any input. The formula is still complete and still on this screen.
 *
 * ## What stayed visible, and why
 *
 * Three facts that change how the ranking is READ rather than how it was BUILT:
 *
 * - **The window.** «1 орын» over seven days and over the whole course are
 *   different claims.
 * - **How much of the class was placed.** A lens that ranked four of twenty-one
 *   learners is describing four learners, and the counts are printed rather than
 *   a share, because a ratio without its denominator is the shape this project
 *   refuses everywhere else.
 * - **That places are shared** — but only when they actually are. A repeated
 *   number in the rank column is otherwise read as a rendering fault.
 */
function BoardNote({
  board,
  ranked,
  hasTies,
}: {
  board: Leaderboard;
  ranked: number;
  hasTies: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
      <p className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1", TYPE.meta, INK.muted)}>
        <span>{t(PERIOD_WINDOW[board.period.period])}</span>
        <Separator />
        <span className="tabular-nums">{t(rankedOfClass(ranked, board.context.enrolled))}</span>
        {hasTies ? (
          <>
            <Separator />
            <span>{t(EXTRA.tiesNote)}</span>
          </>
        ) : null}
      </p>
      <Hint label={t(EXTRA.rankingHint)}>
        <p>{t(board.explanation)}</p>
        <p className="mt-2">{t(EXTRA.componentsNote)}</p>
      </Hint>
    </div>
  );
}

function Separator() {
  return (
    <span aria-hidden="true" className={INK.faint}>
      ·
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Columns                                                                    */
/* -------------------------------------------------------------------------- */

/** Where a learner's detail page is, or `null` when there is nothing behind it. */
function studentHref(subjectId: string | null, query: string): string | null {
  if (!subjectId) return null;
  const path = `/teacher/students/${encodeURIComponent(subjectId)}`;
  return query ? `${path}?${query}` : path;
}

/**
 * Rank, learner, the counted quantity, and then the parts it is made of.
 *
 * The component columns are derived from the entries rather than hard-coded per
 * lens: the server owns which parts a lens publishes and each part arrives with
 * its own `Localized` label, so a lens that grows a fourth component grows a
 * fourth column without a change here. Headers come from the widest entry,
 * which is every entry — `scoreFor` builds the array positionally — and a row
 * that somehow lacks a part renders nothing rather than a `0` that would claim a
 * count nobody made.
 */
function leaderboardColumns({
  lens,
  entries,
  tiedRanks,
  query,
}: {
  lens: LeaderboardLens;
  entries: readonly LeaderboardEntry[];
  tiedRanks: ReadonlySet<number>;
  query: string;
}): readonly DataColumn<LeaderboardEntry>[] {
  const widest = entries.reduce<LeaderboardEntry | null>(
    (best, e) => (best === null || e.components.length > best.components.length ? e : best),
    null,
  );
  const parts = widest?.components ?? [];

  const componentColumns: DataColumn<LeaderboardEntry>[] = parts.map((part, index) => ({
    key: `component-${index}`,
    header: part.label,
    align: "right",
    sortable: true,
    sortValue: (row) => row.components[index]?.value ?? null,
    render: (row) => {
      const value = row.components[index];
      if (!value) return null;
      /* A zero is dimmed so the breakdown is scanned for what is NOT zero. It is
         never the only carrier of anything: the column header names it and the
         value column beside it is the fact. */
      return (
        <span className={cn(NUM.cell, value.value === 0 ? INK.faint : INK.secondary)}>
          {value.value}
        </span>
      );
    },
  }));

  return [
    {
      key: "rank",
      header: EXTRA.colRank,
      width: "104px",
      sortable: true,
      sortValue: (row) => row.rank,
      render: (row) => <RankCell entry={row} tied={tiedRanks.has(row.rank)} />,
    },
    {
      key: "student",
      header: TL.colStudent,
      width: "240px",
      sortable: true,
      sortValue: (row) => row.displayName,
      render: (row) => <StudentCell entry={row} query={query} />,
    },
    {
      /* The ranked quantity. Named after what it counts — there is no column
         called «результат» here and there never will be. */
      key: "value",
      header: LENS_VALUE_HEADER[lens],
      align: "right",
      sortable: true,
      sortValue: (row) => row.value,
      render: (row) => (
        <span className={cn(row.rank <= LEAD_RANKS ? NUM.figure : NUM.cell, INK.primary)}>
          {/* A delta is signed with a real minus sign so the column stays
              aligned; a count is printed as itself. */}
          {lens === "improvement" ? signed(row.value) : row.value}
        </span>
      ),
    },
    ...componentColumns,
  ];
}

/**
 * The place, and whether it is shared.
 *
 * Tied learners get the same number — 1, 1, 3 — and the annotation beside it
 * says so in words. Breaking the tie on who finished first would smuggle a
 * second, unstated criterion into a board whose only claim is that its criterion
 * is on screen. The annotation is deliberately lower-case and unfilled: it is a
 * note about the number, not a status badge about the learner.
 *
 * The top three step up one rank on the numeral ramp and one step in weight.
 * That is the entire celebration this page performs.
 */
function RankCell({ entry, tied }: { entry: LeaderboardEntry; tied: boolean }) {
  const { t } = useLocale();
  const lead = entry.rank <= LEAD_RANKS;
  return (
    <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <span
        className={cn(
          lead ? cn(NUM.figure, "font-semibold", INK.primary) : cn(NUM.cell, INK.secondary),
        )}
      >
        {entry.rank}
      </span>
      {tied ? (
        <span className={cn("whitespace-nowrap", TYPE.meta, INK.muted)}>{t(EXTRA.tiedRank)}</span>
      ) : null}
    </span>
  );
}

/**
 * The learner's name, and the keyboard path to their page.
 *
 * `DataTable`'s `rowHref` is a mouse convenience only — a `<tr>` cannot be
 * focused — so the real `<a>` lives here, which is what a teacher tabbing
 * through the board actually lands on.
 */
function StudentCell({ entry, query }: { entry: LeaderboardEntry; query: string }) {
  const href = studentHref(entry.subjectId, query);
  const weight = entry.rank <= LEAD_RANKS ? "font-semibold" : undefined;
  if (!href) {
    return <span className={cn(TYPE.rowTitle, INK.primary, weight)}>{entry.displayName}</span>;
  }
  return (
    <Link
      href={href}
      className={cn(
        "rounded-sm underline decoration-b-fg/25 underline-offset-[3px] hover:decoration-b-fg/60",
        TYPE.rowTitle,
        INK.primary,
        MOTION.base,
        weight,
      )}
    >
      {entry.displayName}
    </Link>
  );
}
