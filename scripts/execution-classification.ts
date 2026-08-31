#!/usr/bin/env tsx
/**
 * What SHOULD happen to every graded task when a learner presses Check.
 *
 * `surfaceForBlock` in `schools/execution/trust-policy.ts` already answers a
 * version of this, and this script deliberately does NOT read it. The brief was
 * to derive the classification from curriculum intent — block type, assessment
 * role, independence role, bank membership — and then compare, so that the
 * implementation can be found disagreeing with the pedagogy rather than
 * defining it.
 *
 * Four classes:
 *
 *   A LOCAL_PRACTICE_ONLY        Pyodide may give immediate feedback. The
 *                                result must not create trusted mastery or
 *                                independence evidence.
 *   B SERVER_VERIFIED_PROGRESS   Must reach the trusted server judge before it
 *                                can create trusted Learning Intelligence
 *                                evidence.
 *   C SERVER_VERIFIED_ASSESSMENT Always the trusted judge. A browser-local pass
 *                                is never assessment evidence.
 *   D NO_JUDGE                   Not a runnable program-verdict task. Never
 *                                sent to a judge — which is NOT the same as
 *                                "read by a human": 263 of these are graded
 *                                automatically by string comparison and only 62
 *                                reach a teacher. Calling the whole class
 *                                HUMAN_REVIEW, as the first version of this
 *                                script did, put four out of five
 *                                machine-graded tasks under a human's name.
 *
 *   npx tsx scripts/execution-classification.ts             # summary
 *   npx tsx scripts/execution-classification.ts --markdown  # the full table
 */
import { MONTHS } from "../schools/curriculum/months";
import { isIndependent, isTask } from "../schools/curriculum/inventory";
import { surfaceForBlock } from "../schools/execution/trust-policy";
import type { LessonBlock } from "../schools/curriculum/types";

export type Klass =
  | "1 DETERMINISTIC_AUTO_GRADED"
  | "2 SERVER_CODE_JUDGED"
  | "3 HUMAN_REVIEW_REQUIRED"
  | "4 OPTIONAL_HUMAN_INTERACTION"
  | "5 SPECIAL_UNMEASURED";

/**
 * A task the SERVER executes.
 *
 * This asks exactly the question `src/app/api/learning/submit/route.ts:278`
 * asks, rather than listing the `verify` modes that were expected to have
 * cases. Listing them was wrong by one: `m1.as.b2` is `verify:find_bug` with
 * six cases, and the submit route runs any `verify` that has them. The route's
 * own comment says so — "the modes that no machine should score have no
 * `cases` and fall through this branch untouched". A predicate that names modes
 * instead of asking about cases will drift the moment an author writes a
 * seventh mode or attaches cases to a sixth.
 */
export function isProgramTask(b: LessonBlock): boolean {
  if (b.type === "write_code" || b.type === "modify_code" || b.type === "challenge") return true;
  const cases = (b as unknown as { cases?: unknown[] }).cases;
  if (b.type === "verify") return Array.isArray(cases) && cases.length > 0;
  return false;
}

/**
 * A task `checkBlock` settles by itself, with no sandbox and no teacher.
 *
 * Read off `schools/learning/checking.ts`: these six arms compare the learner's
 * answer against a declared one and return `correct` or `wrong`. Nothing is
 * executed and no provider is involved, so they are unaffected by anything
 * about a judge.
 */
const DETERMINISTIC: ReadonlySet<LessonBlock["type"]> = new Set([
  "prediction",
  "multiple_choice",
  "fill_blank",
  "reorder_code",
  "find_bug",
  "trace_code",
]);

const CONTEST_LESSON = /^m\d+\.c\d+$/;

export function classify(
  b: LessonBlock,
  lessonId: string,
  inAssessment: boolean,
): { klass: Klass; reason: string } {
  /* Traced, not inferred. Each arm names the code that settles this type. */

  if (isProgramTask(b)) {
    return {
      klass: "2 SERVER_CODE_JUDGED",
      reason:
        `submit/route.ts:278 treats it as a code block and runs its ` +
        `${(b as unknown as { cases: unknown[] }).cases.length} cases through the trusted provider; ` +
        `checking.ts settles it \`unknown\` when no sandbox result arrives, never \`wrong\``,
    };
  }

  if (DETERMINISTIC.has(b.type)) {
    return {
      klass: "1 DETERMINISTIC_AUTO_GRADED",
      reason:
        "checking.ts compares the answer against a declared one and returns correct or wrong — " +
        "no execution, no provider, no teacher",
    };
  }

  if (b.type === "test_case") {
    return {
      klass: "5 SPECIAL_UNMEASURED",
      reason:
        "settles `correct` when the input is one the author listed and `unknown` otherwise — " +
        "never `wrong`, because the learner may have found a real breaking case nobody enumerated. " +
        "A teacher can adjudicate an `unknown`; the lesson completes either way",
    };
  }

  if (b.type === "arena_problem") {
    return { klass: "5 SPECIAL_UNMEASURED", reason: "human-marked by design; none authored" };
  }

  if (b.type === "explain" || (b.type === "verify" && b.mode === "oral_explanation")) {
    return {
      klass: "3 HUMAN_REVIEW_REQUIRED",
      reason:
        "checking.ts returns `unknown` unconditionally. The block carries expectedPoints for a " +
        "teacher to mark against, and nothing else can turn it into evidence — the answer is prose " +
        "or speech",
    };
  }

  if (b.type === "verify" && b.mode === "manual_trace") {
    return {
      klass: "3 HUMAN_REVIEW_REQUIRED",
      reason:
        "the learner is the computer here — the trace is written on paper and read by a teacher. " +
        "Running it would answer the question for them, which is why it carries no cases",
    };
  }

  return {
    klass: "5 SPECIAL_UNMEASURED",
    reason: "settles `unknown`; no declared answer and no program",
  };
}

interface Row {
  month: number;
  blockId: string;
  blockType: string;
  lesson: string;
  klass: Klass;
  surface: string;
  localRun: boolean;
  serverRequired: boolean;
  trustedEvidence: boolean;
  assessment: boolean;
  cases: number;
  reference: boolean;
  bank: boolean;
  reason: string;
}

export function rows(): Row[] {
  const out: Row[] = [];
  for (const m of MONTHS) {
    const seen: { b: LessonBlock; lesson: string; inAssessment: boolean }[] = [
      ...m.units.flatMap((u) =>
        u.lessons.flatMap((l) => l.blocks.map((b) => ({ b, lesson: l.id, inAssessment: false }))),
      ),
      ...(m.assessment?.blocks ?? []).map((b) => ({ b, lesson: m.assessment!.id, inAssessment: true })),
    ];
    for (const { b, lesson, inAssessment } of seen) {
      if (!isTask(b)) continue;
      const { klass, reason } = classify(b, lesson, inAssessment);
      const any = b as unknown as Record<string, unknown>;
      out.push({
        month: m.index,
        blockId: b.id,
        blockType: b.type + (b.type === "verify" ? `:${(any.mode as string) ?? "?"}` : ""),
        lesson,
        klass,
        surface: surfaceForBlock({ blockType: b.type, blockId: b.id, lessonId: lesson }),
        localRun: klass === "2 SERVER_CODE_JUDGED",
        serverRequired: klass === "2 SERVER_CODE_JUDGED",
        trustedEvidence: klass === "1 DETERMINISTIC_AUTO_GRADED" || klass === "2 SERVER_CODE_JUDGED",
        assessment: inAssessment || CONTEST_LESSON.test(lesson),
        cases: Array.isArray(any.cases) ? (any.cases as unknown[]).length : 0,
        reference: Boolean(any.referenceSolution ?? any.fixedCode),
        bank: Boolean(b.bank),
        reason,
      });
    }
  }
  return out;
}

const R = rows();
const md = process.argv.includes("--markdown");

if (md) {
  console.log(
    "| Month | Block | Type | Lesson | Class | Surface | Local run | Server required | Trusted LI evidence | Assessment | Cases | Reference | Reason |",
  );
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of R) {
    console.log(
      `| ${r.month} | \`${r.blockId}\` | ${r.blockType} | ${r.lesson} | **${r.klass[0]}** | ${r.surface} | ${r.localRun ? "yes" : "no"} | ` +
        `${r.serverRequired ? "yes" : "no"} | ${r.trustedEvidence ? "yes" : "**no**"} | ${r.assessment ? "yes" : "—"} | ` +
        `${r.cases || "—"} | ${r.reference ? "yes" : "—"} | ${r.reason} |`,
    );
  }
} else {
  const by = new Map<string, number>();
  for (const r of R) by.set(r.klass, (by.get(r.klass) ?? 0) + 1);
  console.log("");
  for (const k of ["1 DETERMINISTIC_AUTO_GRADED", "2 SERVER_CODE_JUDGED", "3 HUMAN_REVIEW_REQUIRED", "4 OPTIONAL_HUMAN_INTERACTION", "5 SPECIAL_UNMEASURED"]) {
    console.log(`  ${k.padEnd(30)}${by.get(k) ?? 0}`);
  }
  const program = R.filter((r) => r.klass === "2 SERVER_CODE_JUDGED");
  console.log(`\n  program tasks: ${program.length}`);
  console.log(`  with cases:    ${program.filter((r) => r.cases > 0).length}`);
  console.log(`  with a reference solution: ${program.filter((r) => r.reference).length}`);

  /* Where the pedagogy and the shipped surface disagree. */
  const shouldBeServer = new Set(["2 SERVER_CODE_JUDGED"]);
  const clash = program.filter(
    (r) => shouldBeServer.has(r.klass) && r.surface === "lesson_guided",
  );
  console.log(`\n  classified as needing the server, shipped on lesson_guided: ${clash.length}`);
  const bankOnEvidence = R.filter((r) => r.surface === "independent_evidence" && r.bank);
  console.log(`  optional tasks on an evidence surface: ${bankOnEvidence.length}`);
  console.log("");
}
