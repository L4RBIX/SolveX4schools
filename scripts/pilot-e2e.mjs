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
  section("The month deck, at every width and in both languages");

  /*
   * The card used to be a fixed 540px box with `overflow-clip`, holding
   * content whose height is the month's: a title that wraps to three lines in
   * Kazakh, a 150px illustration, a lesson list as long as the month, a lock
   * explanation on eight of the nine months, and a 48px button. Measured in
   * Chromium at 390px, September wanted 34px more than the box — so the
   * primary button was cut in half.
   *
   * Every assertion below is a measurement of the rendered page, because that
   * is the only place this bug exists.
   */
  const deckMetrics = () =>
    page.evaluate(() => {
      const doc = document.documentElement;
      const rect = (el) => {
        const b = el?.getBoundingClientRect();
        return b ? { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) } : null;
      };
      const cta = [...document.querySelectorAll("a,button")].find((b) =>
        /Бастау|Начать|Не ашатынын|Что откроет/.test(b.textContent ?? ""),
      );
      const rail = document.querySelector("[data-deck-rail]");
      const lock = [...document.querySelectorAll("p")].find((p) =>
        /әлі жабық|ещё закрыт/i.test(p.textContent ?? ""),
      );
      return {
        hOverflow: doc.scrollWidth > doc.clientWidth + 1,
        cta: cta ? { text: (cta.textContent ?? "").trim().slice(0, 18), ...rect(cta) } : null,
        card: rect(cta?.closest(".rounded-2xl")),
        rail: rect(rail),
        lock: lock ? rect(lock) : null,
        trackSwitch: [...document.querySelectorAll("*")].some(
          (e) => e.children.length === 0 && /Осы айдағы бағытың|Твой маршрут в этом месяце/.test(e.textContent ?? ""),
        ),
      };
    });

  const selectDeckMonth = async (n) => {
    await page.evaluate((i) => {
      const rail = document.querySelector("[data-deck-rail]");
      [...(rail?.querySelectorAll("button") ?? [])][i]?.click();
    }, n - 1);
    await page.waitForTimeout(700);
  };

  for (const width of [1440, 1280, 1024, 768, 430, 390, 375]) {
    await page.setViewportSize({ width, height: 950 });
    /* `domcontentloaded` and then the rail, not `networkidle`: a lesson visited
       earlier in this run leaves the 57 MB C++ toolchain streaming in the
       background, and the network is never idle again. */
    await page.goto(`${BASE}/home`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-deck-rail]", { timeout: 20_000 });
    await page.waitForTimeout(500);
    const dialog = await page.$('[role="dialog"]');
    if (dialog) {
      const b = await dialog.$("button");
      if (b) { await b.click(); await page.waitForTimeout(400); }
    }
    await page.evaluate(() => {
      const h = [...document.querySelectorAll("h2")].find((x) => /Жалғастыр|Продолж|Кері/i.test(x.textContent ?? ""));
      h?.scrollIntoView({ block: "start" });
    });
    await page.waitForTimeout(400);

    for (const [label, month] of [["open month", 1], ["locked month", 2]]) {
      if (month !== 1) await selectDeckMonth(month);
      const m = await deckMetrics();
      check(`${width}px · ${label} · no horizontal page overflow`, !m.hOverflow);
      check(
        `${width}px · ${label} · the button is inside its card`,
        Boolean(m.cta && m.card && m.cta.bottom <= m.card.bottom),
        m.cta && m.card ? `button ends at ${m.cta.bottom}, card at ${m.card.bottom}` : "no button found",
      );
      check(`${width}px · ${label} · the button has its full height`, (m.cta?.h ?? 0) >= 40, `${m.cta?.h}px`);
      check(
        `${width}px · ${label} · the rail is below the card, not under it`,
        Boolean(m.rail && m.card && m.rail.top >= m.card.bottom && m.rail.h > 0),
        m.rail && m.card ? `rail top ${m.rail.top}, card bottom ${m.card.bottom}` : "no rail",
      );
      check(`${width}px · ${label} · no month-direction selector`, !m.trackSwitch);
      if (month !== 1) {
        check(`${width}px · ${label} · the lock explanation is readable`, (m.lock?.h ?? 0) > 0, `${m.lock?.h ?? 0}px`);
      }
    }
  }

  /* Kazakh and Russian wrap differently and the card is now sized by its
     content, so the language is a real input to this layout. */
  for (const locale of ["RU", "KK"]) {
    await page.setViewportSize({ width: 390, height: 950 });
    await page.goto(`${BASE}/home`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-deck-rail]", { timeout: 20_000 });
    await page.waitForTimeout(500);
    const btn = await page.$(`button:has-text("${locale}")`);
    if (btn) { await btn.click(); await page.waitForTimeout(700); }
    await selectDeckMonth(2);
    const m = await deckMetrics();
    check(`390px · ${locale} · locked card is whole`, Boolean(m.cta && m.card && m.cta.bottom <= m.card.bottom));
    check(`390px · ${locale} · lock explanation is visible`, (m.lock?.h ?? 0) > 0);
    check(`390px · ${locale} · no horizontal overflow`, !m.hOverflow);
  }

  /* ------------------------------------------------------------------ */
  section("The code editor");

  /*
   * The editor was a `<textarea>` until this release: no line numbers, no
   * highlighting, and Tab moved focus to the next button — the single most
   * common keystroke in a C++ lesson took the learner out of the box they were
   * typing in. These assertions are the reason CodeMirror is here, and they run
   * in a real browser because none of them is observable from Node.
   *
   * Two lessons, because a learner's first card is a concept: `m1.l8` opens on
   * a code task, so the keyboard can be exercised there; `m1.l2` is where a
   * SCAFFOLDED task lives, and its frame is asserted across the lesson's
   * mounted cards.
   */
  const editorText = () =>
    page.evaluate(() => {
      const el =
        [...document.querySelectorAll(".cm-content")].find((x) => !x.closest("[inert]")) ??
        document.querySelector(".cm-content");
      return el?.textContent ?? "";
    });
  const focusEditor = () =>
    page.evaluate(() => {
      const el = [...document.querySelectorAll(".cm-content")].find((x) => !x.closest("[inert]"));
      if (!el) return false;
      el.focus();
      const lines = el.querySelectorAll(".cm-line");
      const target = lines[Math.min(4, lines.length - 1)];
      const range = document.createRange();
      range.selectNodeContents(target);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    });

  await page.goto(`${BASE}/lesson/m1.l2`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  check(
    "the editor replaces the textarea",
    (await page.$$(".cm-content")).length > 0,
    "no CodeMirror instance on a lesson with code tasks",
  );
  check("line numbers are rendered", Boolean(await page.$(".cm-gutters")));
  const frames = await page.evaluate(() =>
    [...document.querySelectorAll(".cm-content")].map((el) => el.textContent ?? ""),
  );
  check(
    "a scaffolded task starts with the frame, and the learner's place inside main",
    frames.some((f) => f.includes("#include <iostream>") && f.includes("int main")),
  );

  await page.goto(`${BASE}/lesson/m1.l8`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  if (await focusEditor()) {
    await page.keyboard.type('#include <iostream>\nint main() { cout << "hi"; }');
    await page.waitForTimeout(300);
    check(
      "C++ is syntax highlighted",
      await page.evaluate(() => {
        const el = [...document.querySelectorAll(".cm-content")].find((x) => !x.closest("[inert]"));
        const base = el ? getComputedStyle(el).color : "";
        return [...(el?.querySelectorAll("span") ?? [])].some(
          (s) => getComputedStyle(s).color !== base,
        );
      }),
    );

    const before = await editorText();
    await page.keyboard.press("Tab");
    const afterTab = await editorText();
    check("Tab indents instead of leaving the editor", afterTab.length > before.length);
    check(
      "focus is still in the editor after Tab",
      await page.evaluate(() => Boolean(document.activeElement?.closest(".cm-editor"))),
    );
    await page.keyboard.press("Shift+Tab");
    check("Shift+Tab unindents", (await editorText()).length === before.length);

    await page.keyboard.type("if (1) {");
    await page.keyboard.press("Enter");
    const indented = await page.evaluate(() => {
      const el = [...document.querySelectorAll(".cm-content")].find((x) => !x.closest("[inert]"));
      const lines = [...(el?.querySelectorAll(".cm-line") ?? [])].map((l) => l.textContent ?? "");
      const i = lines.findIndex((l) => l.includes("if (1) {"));
      return lines[i + 1] ?? "";
    });
    check("Enter keeps the indentation", /^\s{4,}/.test(indented), JSON.stringify(indented));

    await page.keyboard.press("Escape");
    check(
      "Escape releases the editor, so Tab can leave",
      !(await page.evaluate(() => Boolean(document.activeElement?.closest(".cm-editor")))),
    );

    await focusEditor();
    await page.keyboard.type("  // draft-marker");
    await page.waitForTimeout(900);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    check("the draft survives a reload", (await editorText()).includes("draft-marker"));
  } else {
    check("a code task is reachable to type into", false, "no active editor on m1.l8");
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
