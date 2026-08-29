#!/usr/bin/env tsx
/**
 * Every required task in a month, described well enough to argue about.
 *
 * The core-vs-bank question — "if this task vanished from the required path,
 * what unique evidence would be lost?" — cannot be answered from a task in
 * isolation, and it cannot be answered by reading nine thousand-line files
 * either. What it needs is every task in the month side by side, each reduced
 * to the things that decide redundancy: what the learner is asked to produce,
 * which skills it claims, and which Python constructs its answer actually uses.
 *
 * The last of those is the one worth extracting mechanically. Two tasks with
 * different prose and the same construct set are usually the same task; two
 * with the same prose and different constructs usually are not. `skillRefs` is
 * declared by an author and drifts; the constructs are read out of the code.
 *
 * `--pairs` additionally ranks same-month task pairs by construct overlap. That
 * ranking is a PROMPT for the question, never an answer to it: a high score is
 * a pair worth looking at, and plenty of high-scoring pairs are two genuinely
 * different problems that happen to need a loop and an if.
 *
 *   npx tsx scripts/task-digest.ts 3           # month 3, every core task
 *   npx tsx scripts/task-digest.ts 3 --pairs   # + the overlap ranking
 *   npx tsx scripts/task-digest.ts 3 --all     # include bank and assessment
 */
import { MONTHS } from "../schools/curriculum/months";
import { isTask, roleOf } from "../schools/curriculum/inventory";
import { extractConstructs } from "../schools/curriculum/capability";
import type { LessonBlock, Month } from "../schools/curriculum/types";

const args = process.argv.slice(2);
const wantPairs = args.includes("--pairs");
const wantAll = args.includes("--all");
const monthArg = Number(args.find((a) => /^\d+$/.test(a)));

interface Task {
  id: string;
  lesson: string;
  lessonTitle: string;
  type: string;
  role: string;
  tracks: string;
  skills: string[];
  prompt: string;
  /** Constructs in whatever code the ANSWER is — not the code the learner is shown. */
  constructs: string[];
  answerShape: string;
}

/** The code that represents a correct answer, which is what redundancy is about. */
function answerCode(b: LessonBlock): string {
  const any = b as unknown as Record<string, unknown>;
  const parts: string[] = [];
  for (const k of ["referenceSolution", "fixedCode", "code"]) {
    const v = any[k];
    if (typeof v === "string" && v.trim()) { parts.push(v); break; }
  }
  if (b.type === "reorder_code") parts.push(b.lines.map((l) => l.code).join("\n"));
  if (b.type === "fill_blank") {
    /* Fill the nth blank with the nth blank's first accepted answer, so the
       constructs extracted are the ones a correct answer contains rather than
       the ones the surrounding scaffold happens to show. */
    let n = 0;
    parts.push(b.template.replace(/___/g, () => b.blanks?.[n++]?.accept?.[0] ?? "x"));
  }
  return parts.join("\n");
}

function shapeOf(b: LessonBlock): string {
  const any = b as unknown as Record<string, unknown>;
  switch (b.type) {
    case "write_code":
      return (any.starter as string)?.trim() ? "guided (has starter)" : "FROM NOTHING";
    case "challenge":
      return "FROM NOTHING";
    case "verify":
      return `check: ${String(any.mode)}`;
    case "modify_code":
      return "edits given code";
    case "find_bug":
      return "repairs given code";
    case "fill_blank":
      return `${(b.blanks ?? []).length} blank(s)`;
    case "reorder_code":
      return `${b.lines.length} lines to order`;
    default:
      return b.type;
  }
}

function tasksOf(month: Month): Task[] {
  const out: Task[] = [];
  const add = (b: LessonBlock, lesson: string, lessonTitle: string, inAssessment: boolean) => {
    if (!isTask(b)) return;
    const role = roleOf(b, lesson, inAssessment);
    if (!wantAll && role !== "core") return;
    const prompt = ((b as unknown as { prompt?: { kk: string } }).prompt?.kk ?? "")
      .replace(/\s+/g, " ")
      .trim();
    out.push({
      id: b.id,
      lesson,
      lessonTitle,
      type: b.type,
      role,
      tracks: b.tracks ? [...b.tracks].join("/") : "all",
      skills: [...b.skillRefs],
      prompt: prompt.length > 260 ? `${prompt.slice(0, 260)}…` : prompt,
      constructs: [...extractConstructs(answerCode(b))].sort(),
      answerShape: shapeOf(b),
    });
  };
  for (const unit of month.units) {
    for (const lesson of unit.lessons) {
      for (const b of lesson.blocks) add(b, lesson.id, lesson.title.kk, false);
    }
  }
  for (const b of month.assessment?.blocks ?? []) {
    add(b, month.assessment!.id, "монтылық сынақ", true);
  }
  return out;
}

const months = Number.isFinite(monthArg) ? MONTHS.filter((m) => m.index === monthArg) : MONTHS;

for (const month of months) {
  const tasks = tasksOf(month);
  if (!tasks.length) continue;
  console.log(`\n=== Month ${month.index} — ${month.monthName.kk} — ${tasks.length} task(s) ===`);
  console.log(`Month theme: ${month.title.kk}`);
  let lesson = "";
  for (const t of tasks) {
    if (t.lesson !== lesson) {
      lesson = t.lesson;
      console.log(`\n-- ${t.lesson}: ${t.lessonTitle}`);
    }
    console.log(
      `  ${t.id}  [${t.type}] ${t.answerShape}` +
        (t.role === "core" ? "" : `  <${t.role}>`) +
        (t.tracks === "all" ? "" : `  tracks=${t.tracks}`),
    );
    console.log(`     skills: ${t.skills.join(", ") || "—"}`);
    if (t.constructs.length) console.log(`     uses:   ${t.constructs.join(" ")}`);
    console.log(`     ask:    ${t.prompt}`);
  }

  if (!wantPairs) continue;
  /* A support twin is the same task made reachable, by convention `<id>s`.
     It scores ~100% against its base every time and means nothing when it does,
     so it is excluded rather than left to bury the pairs worth reading. */
  const twinned = (x: string, y: string) => `${x}s` === y || `${y}s` === x;

  const scored: { a: Task; b: Task; jaccard: number; shared: string[] }[] = [];
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      if (twinned(tasks[i].id, tasks[j].id)) continue;
      const A = new Set(tasks[i].constructs);
      const B = new Set(tasks[j].constructs);
      if (!A.size || !B.size) continue;
      const shared = [...A].filter((c) => B.has(c));
      const union = new Set([...A, ...B]).size;
      const jaccard = shared.length / union;
      if (jaccard >= 0.6) scored.push({ a: tasks[i], b: tasks[j], jaccard, shared });
    }
  }
  scored.sort((x, y) => y.jaccard - x.jaccard);
  console.log(`\n-- pairs sharing ≥60% of their constructs (a prompt to look, not a verdict) --`);
  for (const s of scored.slice(0, 40)) {
    const routes =
      s.a.tracks === s.b.tracks ? "" : `  (${s.a.tracks} vs ${s.b.tracks} — different learners)`;
    console.log(
      `  ${(s.jaccard * 100).toFixed(0)}%  ${s.a.id} [${s.a.type}] ~ ${s.b.id} [${s.b.type}]${routes}`,
    );
  }
  if (!scored.length) console.log("  none");
}
