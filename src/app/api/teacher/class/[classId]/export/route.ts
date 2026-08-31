import { assembleClass } from "@schools/teacher/build-class";
import { buildAssessmentSummary } from "@schools/teacher/build-assessment";
import { deny } from "@schools/auth/guard";
import { openTeacherRequest } from "@schools/teacher/route";
import { TL } from "@schools/teacher/labels";
import type { Locale } from "@schools/curriculum/types";

/**
 * CSV export for a teacher's own class.
 *
 * ## What may leave, and what may not
 *
 * Three exports, all of them things a teacher already sees on screen: the class
 * roster with its windowed counts, the per-learner status and findings, and the
 * assessment table. Nothing else.
 *
 * Explicitly NOT exportable, and enumerated here so a future `kind` cannot be
 * added without reading this list:
 *
 * - Nova conversations. They are not stored anywhere, so there is nothing to
 *   leak — but the absence is a property, not an oversight, and a future
 *   "export everything" must not become the reason someone stores them.
 * - Hidden test cases, expected outputs and reference solutions. `blockIndexOf()`
 *   holds full authored blocks; nothing in this file touches `.cases` or
 *   `.referenceSolution`.
 * - Learner free text. The error dictionary and post-help explanations are the
 *   only two free-text stores in the product and neither is here.
 * - Any other class, any other school. The population comes from
 *   `openTeacherRequest` -> `class_enrolments`, keyed on `(school_id, class_id)`.
 * - Usernames and account identifiers. A school report identifies a child by
 *   the name their teacher uses.
 *
 * ## Why the header row is localised
 *
 * A CSV opened in Excel by a Kazakh teacher with `solvedIndependent` as a column
 * heading is the same defect as `hintDependency` on screen: machine vocabulary
 * on a teaching surface. `?locale=` picks the language; there is no server-side
 * locale in this product, so the client passes its own.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set(["overview", "students", "assessment"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classId: string }> },
) {
  const { classId } = await params;
  const opened = await openTeacherRequest(request, classId);
  if (!opened.ok) return opened.response;
  const { sql, bundle, period, now } = opened.value;

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") ?? "students";
  if (!KINDS.has(kind)) return deny(400, "unknown_export");
  const locale: Locale = url.searchParams.get("locale") === "ru" ? "ru" : "kk";

  const assessment = await buildAssessmentSummary(sql, bundle, now);

  let rows: string[][];
  if (kind === "assessment") {
    rows = [
      [
        TL.colStudent[locale],
        TL.colStatus[locale],
        TL.assessmentsTitle[locale],
        TL.colMedianTime[locale],
      ],
      ...assessment.learners.map((l) => [
        l.displayName,
        assessmentStateLabel(l.state, locale),
        l.unmeasuredCoding ? TL.assessmentUnmeasured[locale] : "",
        l.minutes === null ? TL.emptyNotMeasured[locale] : String(l.minutes),
      ]),
    ];
  } else {
    const assembled = await assembleClass(sql, bundle, period, now, assessment);
    rows = [
      [
        TL.colStudent[locale],
        TL.colStatus[locale],
        TL.colLastActive[locale],
        TL.colRequired[locale],
        TL.colIndependent[locale],
        TL.colAssisted[locale],
        TL.colAttempts[locale],
        TL.colPractice[locale],
        TL.colDays[locale],
        TL.colHelp[locale],
      ],
      ...assembled.rows.map((r) => [
        r.displayName,
        statusLabel(r.status, locale),
        r.lastActiveAt ?? TL.never[locale],
        `${r.requiredWork.completed}/${r.requiredWork.total}`,
        String(r.solvedIndependent),
        String(r.solvedAssisted),
        String(r.episodes),
        String(r.practiceMinutes),
        String(r.activeDays),
        String(r.interventions),
      ]),
    ];
  }

  const filename = `${bundle.context.classId}-${kind}-${period.period}.csv`;
  return new Response(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store",
    },
  });
}

/**
 * RFC 4180 quoting, plus a BOM.
 *
 * The BOM is not decoration: Excel on Windows opens a UTF-8 CSV without one as
 * cp1251, and every Kazakh name in the file becomes mojibake. A school opening
 * the export and seeing «Ð°Ð¹Ð³Ò¯Ð»» is a support ticket and a lost afternoon.
 *
 * The leading-character guard is a formula-injection defence: a display name
 * beginning `=`, `+`, `-` or `@` is executed as a formula by Excel and Sheets
 * when the file is opened. Names are teacher-entered, so this is not
 * hypothetical, and prefixing a single quote is the standard mitigation that
 * still displays correctly.
 */
function toCsv(rows: readonly (readonly string[])[]): string {
  const body = rows
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
  return "﻿" + body + "\r\n";
}

function cell(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function statusLabel(status: string, locale: Locale): string {
  switch (status) {
    case "not_started":
      return TL.statusNotStarted[locale];
    case "dormant":
      return TL.statusDormant[locale];
    case "needs_attention":
      return TL.statusNeedsAttention[locale];
    case "ready_to_stretch":
      return TL.statusReadyToStretch[locale];
    default:
      return TL.statusOnTrack[locale];
  }
}

function assessmentStateLabel(state: string, locale: Locale): string {
  switch (state) {
    case "not_open":
      return TL.assessmentNotOpen[locale];
    case "not_started":
      return TL.assessmentStateNotStarted[locale];
    case "in_progress":
      return TL.assessmentStateInProgress[locale];
    case "awaiting_review":
      return TL.assessmentStateAwaitingReview[locale];
    default:
      return TL.assessmentStateComplete[locale];
  }
}
