/**
 * Drive a whole class through the product, over HTTP, as real learners.
 *
 * ## Why this is not a fixture
 *
 * The temptation with a "class simulation" is to write teacher-projection rows
 * directly and admire them. That proves nothing: the projection is downstream
 * of grading, the reducer, the event ledger and the identity model, and every
 * one of those is where a pilot actually breaks. So this signs each learner in
 * with their own credentials and posts real answers to the real routes. What
 * the teacher console then shows is what the product computed, not what this
 * script decided.
 *
 * ## The cohort
 *
 * Deliberately not eighteen identical learners. A class has a learner who is
 * ahead, several who are typical, some who need support, one who leans on help,
 * one who has not started, and one who is stuck on the same thing repeatedly —
 * and each of those must be visible as a DIFFERENT thing in the console. A
 * simulation where everyone behaves the same cannot tell you whether the
 * console can distinguish them.
 *
 *   npx tsx scripts/simulate-pilot.ts --base http://localhost:3456 --class ta
 */

import { MONTH_01_SEPTEMBER } from "../schools/curriculum/months/month-01-september";
import { ATTEMPT_BLOCK_TYPES } from "../schools/curriculum/types";
import type { LessonBlock } from "../schools/curriculum/types";

type Profile = "strong" | "typical" | "support" | "high_assistance" | "inactive" | "repeating";

interface Learner {
  username: string;
  password: string;
  profile: Profile;
}

function arg(flag: string, fallback?: string): string {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(`--${flag}`);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  if (fallback !== undefined) return fallback;
  throw new Error(`missing --${flag}`);
}

/** A cookie jar per learner. Sessions must not bleed between them. */
class Session {
  private cookie = "";
  constructor(private base: string) {}

  async post(path: string, body: unknown): Promise<{ status: number; json: unknown }> {
    const res = await fetch(this.base + path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.cookie ? { cookie: this.cookie } : {}),
      },
      body: JSON.stringify(body),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";")[0];
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      /* Streaming endpoints and errors. The status is what matters here. */
    }
    return { status: res.status, json };
  }

  async get(path: string): Promise<{ status: number; json: unknown }> {
    const res = await fetch(this.base + path, {
      headers: this.cookie ? { cookie: this.cookie } : {},
    });
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      /* ditto */
    }
    return { status: res.status, json };
  }
}

/** Every attempt block in September, in teaching order. */
function septemberTasks(): { lessonId: string; block: LessonBlock }[] {
  const out: { lessonId: string; block: LessonBlock }[] = [];
  for (const unit of MONTH_01_SEPTEMBER.units) {
    for (const lesson of unit.lessons) {
      for (const block of lesson.blocks) {
        if (ATTEMPT_BLOCK_TYPES.has(block.type)) out.push({ lessonId: lesson.id, block });
      }
    }
  }
  return out;
}

/** The answer a learner of this profile gives. `null` means they skip it. */
function answerFor(block: LessonBlock, correct: boolean): unknown | null {
  switch (block.type) {
    case "prediction":
      return { kind: "option", id: correct ? block.answer : (block.options?.find((o) => o !== block.answer) ?? "x") };
    case "multiple_choice": {
      const wrong = block.options.find((o) => o.id !== block.correctOptionId)?.id ?? "x";
      return { kind: "option", id: correct ? block.correctOptionId : wrong };
    }
    case "fill_blank":
      return { kind: "blanks", values: block.blanks.map((b) => (correct ? b.answer : "нет")) };
    case "reorder_code":
      return {
        kind: "order",
        ids: correct ? [...block.correctOrder] : [...block.correctOrder].reverse(),
      };
    case "find_bug":
      return { kind: "line", line: correct ? block.buggyLine : block.buggyLine + 1 };
    case "trace_code": {
      const cells: Record<string, string> = {};
      block.steps.forEach((step, row) => {
        for (const [name, value] of Object.entries(step.vars)) {
          cells[`${row}:${name}`] = correct ? value : "0";
        }
      });
      return { kind: "grid", cells };
    }
    case "write_code":
    case "modify_code":
    case "challenge":
      return { kind: "text", value: correct ? block.referenceSolution : "print(0)" };
    case "verify":
      return { kind: "text", value: correct && block.referenceSolution ? block.referenceSolution : "print(0)" };
    case "explain":
    case "test_case":
      return { kind: "text", value: "Себебі шарт шекарасы дәл сол жерде." };
    default:
      return null;
  }
}

/** How far through the month, and how well, each kind of learner gets. */
const PLAN: Record<Profile, { share: number; accuracy: number; hints: number }> = {
  strong: { share: 1.0, accuracy: 0.95, hints: 0 },
  typical: { share: 0.6, accuracy: 0.75, hints: 1 },
  support: { share: 0.35, accuracy: 0.55, hints: 2 },
  high_assistance: { share: 0.5, accuracy: 0.6, hints: 6 },
  inactive: { share: 0, accuracy: 0, hints: 0 },
  repeating: { share: 0.3, accuracy: 0.3, hints: 1 },
};

async function runLearner(base: string, learner: Learner, tasks: ReturnType<typeof septemberTasks>) {
  const s = new Session(base);
  const login = await s.post("/api/auth/login", {
    username: learner.username,
    password: learner.password,
  });
  if (login.status !== 200) return { ...learner, ok: false, attempted: 0, correct: 0, hints: 0 };

  const plan = PLAN[learner.profile];
  const take = Math.floor(tasks.length * plan.share);
  let attempted = 0;
  let correct = 0;
  let hints = 0;

  for (let i = 0; i < take; i += 1) {
    const { block } = tasks[i];
    const episodeId = crypto.randomUUID();

    /* A learner who leans on help asks BEFORE answering, which is exactly what
       the hint ladder now refuses until they have tried something — so the
       first request comes back at rung 0 and the console should record the
       assistance without recording a solve. */
    if (hints < plan.hints && i % 3 === 0) {
      await s.post("/api/nova/hint", {
        blockId: block.id,
        episodeId,
        requestedLevel: 2,
        message: "Түсінбедім",
      });
      hints += 1;
    }

    /* Deterministic rather than random: a simulation that differs between runs
       cannot be used to check whether a change altered the class picture. */
    const wantCorrect = (i * 7919) % 100 < plan.accuracy * 100;
    const answer = answerFor(block, wantCorrect);
    if (!answer) continue;

    await s.post("/api/learning/submit", { blockId: block.id, episodeId, answer });
    attempted += 1;
    if (wantCorrect) correct += 1;

    /* The learner who is stuck: same block, three more wrong attempts, which is
       what should surface as a repeated actionable misconception rather than as
       eighteen unrelated failures. */
    if (learner.profile === "repeating" && i % 5 === 0) {
      for (let k = 0; k < 3; k += 1) {
        await s.post("/api/learning/submit", {
          blockId: block.id,
          episodeId,
          answer: answerFor(block, false),
        });
        attempted += 1;
      }
    }
  }

  return { ...learner, ok: true, attempted, correct, hints };
}

async function main() {
  const base = arg("base", "http://localhost:3456");
  const classId = arg("class", "grade-9a");
  const credsPath = arg("creds", "");

  /* Credentials come from the provisioning output, on stdin or a file — never
     from this script, which must not be able to invent an account. */
  let text = "";
  if (credsPath) {
    text = await (await import("node:fs/promises")).readFile(credsPath, "utf8");
  } else {
    text = await new Promise<string>((resolve) => {
      let buf = "";
      process.stdin.on("data", (c) => (buf += c));
      process.stdin.on("end", () => resolve(buf));
    });
  }

  const students = [...text.matchAll(/^\s*student\s+(\S+)\s+(\S+)\s+/gm)].map((m) => ({
    username: m[1],
    password: m[2],
  }));
  if (students.length === 0) throw new Error("no student credentials found on stdin");

  const profiles: Profile[] = students.map((_, i) => {
    if (i === 0) return "strong";
    if (i === 1) return "high_assistance";
    if (i === 2) return "inactive";
    if (i === 3) return "repeating";
    if (i % 3 === 0) return "support";
    return "typical";
  });

  const learners: Learner[] = students.map((s, i) => ({ ...s, profile: profiles[i] }));
  const tasks = septemberTasks();

  console.log(`\n  Simulating ${learners.length} learners over ${tasks.length} September tasks`);
  console.log(`  against ${base}, class ${classId}\n`);

  const results = [];
  for (const learner of learners) {
    const r = await runLearner(base, learner, tasks);
    results.push(r);
    console.log(
      `  ${r.username.padEnd(12)} ${r.profile.padEnd(16)} ` +
        `${r.ok ? "" : "LOGIN FAILED "}attempted=${r.attempted} correct=${r.correct} hints=${r.hints}`,
    );
  }

  console.log("\n  Done. Read the class through the teacher console, not through this output.\n");
}

main().catch((err) => {
  console.error(`\n  simulation failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
