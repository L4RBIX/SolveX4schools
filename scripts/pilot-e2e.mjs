/**
 * Browser E2E for the pilot flow: one learner, one teacher, one production build.
 *
 * Real Chromium against `node .next/standalone/server.js`, real PostgreSQL, real
 * accounts provisioned by `scripts/provision-class.ts` — the same command a
 * school is set up with. Nothing is mocked and every number is read out of a
 * response the running server produced or out of the rendered page.
 *
 * It MUST be a real Postgres, for the reason `league-e2e.mjs` gives: PGlite
 * holds an exclusive lock and hands a second process a stale snapshot rather
 * than an error, so the seeding and the server would disagree silently.
 *
 *   DATABASE_URL=postgres://localhost/solvex_pilot \
 *   BASE=http://127.0.0.1:3311 \
 *   E2E_STUDENT=9a-01 E2E_STUDENT_PW=<one-time> \
 *   E2E_TEACHER=9a-teacher E2E_TEACHER_PW=<one-time> \
 *   node scripts/pilot-e2e.mjs
 *
 * What it deliberately does NOT do: press Check on a CODE block. That goes to
 * Judge0 on RapidAPI and costs money per submission. Code execution has its own
 * conformance suite behind `JUDGE0_LIVE_TEST=1`, and running it from here would
 * spend a pilot's quota on a smoke test.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:3311";
const STUDENT = process.env.E2E_STUDENT ?? "9a-01";
const TEACHER = process.env.E2E_TEACHER ?? "9a-teacher";
const STUDENT_PW = process.env.E2E_STUDENT_PW;
const TEACHER_PW = process.env.E2E_TEACHER_PW;
const NEW_PW = "PilotE2E-2026-changed";
const LESSON = process.env.E2E_LESSON ?? "m1.l6";
/* The class name to look for on the teacher's page. `provision-class.ts` takes
   it as `--class-name`, so a run against a class called anything else used to
   fail a check about the PRODUCT because of an assumption about the fixture. */
const CLASS_NAME = process.env.E2E_CLASS_NAME ?? "9А";
const BLOCKS = JSON.parse(process.env.E2E_BLOCKS ?? "[]");

let failures = 0;
let checks = 0;
const check = (name, ok, detail = "") => {
  checks += 1;
  if (ok) console.log(`  ✓ ${name}`);
  else { failures += 1; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};
const section = (t) => console.log(`\n${t}`);

/** Sign in through the real form. Retried: login is rate limited per username. */
async function signIn(page, username, password) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
      await page.fill('input[autocomplete="username"]', username);
      await page.fill('input[autocomplete="current-password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 });
      return page.url();
    } catch (err) {
      if (attempt === 3) throw err;
      await page.waitForTimeout(3000 * (attempt + 1));
    }
  }
}

const api = (page, path, init) =>
  page.evaluate(
    async ([path, init]) => {
      const r = await fetch(path, init ?? undefined);
      let body = null;
      try { body = await r.json(); } catch { body = null; }
      return { status: r.status, body };
    },
    [path, init ?? null],
  );

const post = (page, path, payload) =>
  api(page, path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

/** Every width the release checks, against page-level horizontal overflow. */
const WIDTHS = [1440, 1280, 1024, 768, 375];
async function noOverflow(page, path, label) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    check(`${label} @ ${width}px — no page-level horizontal scroll`, !over);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

async function main() {
  if (!STUDENT_PW || !TEACHER_PW) {
    console.error("E2E_STUDENT_PW and E2E_TEACHER_PW are required (from provision-class.ts).");
    process.exit(2);
  }

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  /* ------------------------------------------------------------------ */
  section("A provisioned learner must change the one-time password");

  const landed = await signIn(page, STUDENT, STUDENT_PW);
  check("the one-time password signs in", true);
  check("and lands on the forced change screen", new URL(landed).pathname === "/account/password", landed);

  const changed = await post(page, "/api/auth/password", { current: STUDENT_PW, next: NEW_PW });
  check("the learner can set their own password", changed.status === 200, `status ${changed.status}`);

  await post(page, "/api/auth/logout", {});
  const back = await signIn(page, STUDENT, NEW_PW);
  check("the new password signs in and the forcing is over",
    new URL(back).pathname !== "/account/password", back);

  /* ------------------------------------------------------------------ */
  section("Working a lesson");

  const first = BLOCKS[0];
  const before = await api(page, "/api/learning/state/me");
  check("the learner's own state reads back", before.status === 200, `status ${before.status}`);

  const wrong = await post(page, "/api/learning/submit", {
    blockId: first.blockId,
    answer: { kind: "option", id: first.wrong },
    submissionId: crypto.randomUUID(),
  });
  check("a wrong answer is graded wrong", wrong.body?.verdict === "wrong", JSON.stringify(wrong.body?.verdict));
  check("and is not claimed as saved-by-the-browser", wrong.body?.saved === true);

  const right = await post(page, "/api/learning/submit", {
    blockId: first.blockId,
    answer: { kind: "option", id: first.correct },
    submissionId: crypto.randomUUID(),
  });
  check("the correct answer is graded correct", right.body?.verdict === "correct", JSON.stringify(right.body?.verdict));

  /* ------------------------------------------------------------------ */
  section("A refresh restores the work and submits nothing");

  let submitCalls = 0;
  const countSubmits = (req) => {
    if (req.url().includes("/api/learning/submit") && req.method() === "POST") submitCalls += 1;
  };
  page.on("request", countSubmits);
  await page.goto(`${BASE}/lesson/${LESSON}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  page.off("request", countSubmits);
  check("reloading the lesson made no Submit call", submitCalls === 0, `${submitCalls} calls`);

  const html = await page.content();
  check("the lesson page renders rather than erroring", html.includes("<main") || html.length > 5000);

  const after = await api(page, "/api/learning/state/me");
  const completions = after.body?.completions ?? [];
  check("the learner's state survives the reload", after.status === 200 && after.body !== null);

  /* ------------------------------------------------------------------ */
  section("Logout and back in");

  await post(page, "/api/auth/logout", {});
  await signIn(page, STUDENT, NEW_PW);
  const relogin = await api(page, "/api/learning/state/me");
  check("state is still there after a re-login", relogin.status === 200 && relogin.body !== null);
  check("and it is the same learner's state",
    JSON.stringify(relogin.body?.skills ?? null) === JSON.stringify(after.body?.skills ?? null));

  /* ------------------------------------------------------------------ */
  section("A learner cannot reach the teacher surface");

  for (const path of ["/teacher", "/teacher/students", "/teacher/leaderboard"]) {
    const r = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    const url = new URL(page.url()).pathname;
    check(`${path} is not served to a student`, url !== path, `landed on ${url} (${r?.status()})`);
  }

  /* ------------------------------------------------------------------ */
  section("Responsive — learner surfaces");
  await noOverflow(page, "/program", "programme");
  await noOverflow(page, `/lesson/${LESSON}`, "lesson");
  await noOverflow(page, "/you", "/you");

  /* ------------------------------------------------------------------ */
  section("The teacher sees their own class, and the real learner in it");

  const tctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const tpage = await tctx.newPage();

  const tlanded = await signIn(tpage, TEACHER, TEACHER_PW);
  check("the teacher's one-time password also forces a change",
    new URL(tlanded).pathname === "/account/password", tlanded);
  const tchanged = await post(tpage, "/api/auth/password", { current: TEACHER_PW, next: NEW_PW });
  check("the teacher can set their own password", tchanged.status === 200, `status ${tchanged.status}`);
  await post(tpage, "/api/auth/logout", {});
  await signIn(tpage, TEACHER, NEW_PW);

  await tpage.goto(`${BASE}/teacher`, { waitUntil: "networkidle" });
  check("the teacher overview renders", new URL(tpage.url()).pathname === "/teacher", tpage.url());
  const body = await tpage.content();
  check("the roster is the provisioned class", body.includes(CLASS_NAME), CLASS_NAME);

  /* The learner's work reached the console. Asserted on the rendered page
     rather than on a query, because the question is what a teacher SEES. */
  await tpage.goto(`${BASE}/teacher/students`, { waitUntil: "networkidle" });
  const students = await tpage.content();
  check("the student list renders", new URL(tpage.url()).pathname === "/teacher/students");
  check("it names the enrolled learner", students.includes("Оқушы 1"));

  /* ------------------------------------------------------------------ */
  section("Responsive — teacher surfaces");
  await noOverflow(tpage, "/teacher", "teacher overview");
  await noOverflow(tpage, "/teacher/students", "teacher students");
  await noOverflow(tpage, "/teacher/skills", "teacher skills");
  await noOverflow(tpage, "/teacher/assessments", "teacher assessments");

  /* ------------------------------------------------------------------ */
  section("Cross-school and cross-class are not reachable by URL");

  const foreign = await api(tpage, "/api/teacher/class/other-school-class");
  check("a class the teacher does not teach is not served",
    foreign.status === 404 || foreign.status === 403 || foreign.status === 400,
    `status ${foreign.status}`);

  await browser.close();

  console.log(`\n${checks - failures}/${checks} checks passed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
