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
  | "A LOCAL_PRACTICE_ONLY"
  | "B SERVER_VERIFIED_PROGRESS"
  | "C SERVER_VERIFIED_ASSESSMENT"
  | "D NO_JUDGE";

/** A task whose answer is a program a judge must run. */
export function isProgramTask(b: LessonBlock): boolean {
  if (b.type === "write_code" || b.type === "modify_code" || b.type === "challenge") return true;
  if (b.type === "verify") return b.mode === "unseen_problem" || b.mode === "delayed_resolve";
  return false;
}

const CONTEST_LESSON = /^m\d+\.c\d+$/;

export function classify(
  b: LessonBlock,
  lessonId: string,
  inAssessment: boolean,
): { klass: Klass; reason: string } {
  if (!isProgramTask(b)) {
    return {
      klass: "D NO_JUDGE",
      reason:
        b.type === "explain" || (b.type === "verify" && b.mode === "oral_explanation")
          ? "the answer is prose or speech; there is no program to run"
          : b.type === "verify" && b.mode === "manual_trace"
            ? "the learner is the computer here; running it would answer the question for them"
            : b.type === "test_case"
              ? "the answer is an INPUT the learner invented; it settles correct or unknown and never wrong"
              : b.type === "arena_problem"
                ? "marked by a human by design"
                : "string-compared against a declared answer; no program is executed",
    };
  }

  if (inAssessment) {
    return {
      klass: "C SERVER_VERIFIED_ASSESSMENT",
      reason: "a monthly check or the final tournament — a browser-local pass is never assessment evidence",
    };
  }
  if (CONTEST_LESSON.test(lessonId)) {
    return {
      klass: "C SERVER_VERIFIED_ASSESSMENT",
      reason: "a contest problem; the whole point is a verdict the learner did not produce",
    };
  }
  if (b.bank) {
    return {
      klass: "A LOCAL_PRACTICE_ONLY",
      reason:
        "optional. A learner may skip it, so crediting it toward required-path mastery would " +
        "let work nobody has to do stand in for work everybody does",
    };
  }
  return {
    klass: "B SERVER_VERIFIED_PROGRESS",
    reason: isIndependent(b)
      ? "a whole program written from nothing on the required path — this is what backs the programme's «толық дербес шешім»"
      : "graded work on the required path; evidence of the skill, though not of independence",
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
        localRun: klass !== "D NO_JUDGE",
        serverRequired: klass === "B SERVER_VERIFIED_PROGRESS" || klass === "C SERVER_VERIFIED_ASSESSMENT",
        trustedEvidence: klass === "B SERVER_VERIFIED_PROGRESS" || klass === "C SERVER_VERIFIED_ASSESSMENT",
        assessment: inAssessment || CONTEST_LESSON.test(lesson),
        cases: Array.isArray(any.cases) ? (any.cases as unknown[]).length : 0,
        reference: Boolean(any.referenceSolution ?? any.fixedCode),
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
  for (const k of ["A LOCAL_PRACTICE_ONLY", "B SERVER_VERIFIED_PROGRESS", "C SERVER_VERIFIED_ASSESSMENT", "D NO_JUDGE"]) {
    console.log(`  ${k.padEnd(30)}${by.get(k) ?? 0}`);
  }
  const program = R.filter((r) => r.klass !== "D NO_JUDGE");
  console.log(`\n  program tasks: ${program.length}`);
  console.log(`  with cases:    ${program.filter((r) => r.cases > 0).length}`);
  console.log(`  with a reference solution: ${program.filter((r) => r.reference).length}`);

  /* Where the pedagogy and the shipped surface disagree. */
  const shouldBeServer = new Set(["B SERVER_VERIFIED_PROGRESS", "C SERVER_VERIFIED_ASSESSMENT"]);
  const clash = program.filter(
    (r) => shouldBeServer.has(r.klass) && r.surface === "lesson_guided",
  );
  console.log(`\n  classified as needing the server, shipped on lesson_guided: ${clash.length}`);
  const bankOnEvidence = R.filter((r) => r.klass === "A LOCAL_PRACTICE_ONLY" && r.surface !== "lesson_guided");
  console.log(`  optional tasks on an evidence surface: ${bankOnEvidence.length}`);
  console.log("");
}
