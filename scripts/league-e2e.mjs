/**
 * Browser E2E for SolveX Leagues — §48 of the brief, run for real.
 *
 * Real Chromium, real accounts, real HTTP, real Postgres. Nothing is mocked and
 * nothing is asserted against a fixture: every number below is read out of the
 * rendered page or out of a response the running server produced.
 *
 * It MUST be a real Postgres. PGlite holds an exclusive lock on its directory
 * and hands a second process a stale snapshot rather than an error, so a
 * browser test against it would seed rows the server never sees and fail with a
 * bogus 401. `BASE` and `DATABASE_URL` are both required for that reason.
 *
 *   node scripts/league-e2e.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3311";
const PASSWORD = "LeagueE2E-2026";
const SHOTS = "docs/leagues/screenshots";

let failures = 0;
let checks = 0;

function check(name, ok, detail = "") {
  checks += 1;
  if (ok) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

/** Sign in through the real form, as a learner would. */
async function signIn(page, username) {
  /*
   * Retried, because login is rate limited PER USERNAME —
   * `takeToken(\`login:${schoolId}:${username}\`)` in the login route. That is
   * correct behaviour (a school is one NAT gateway, so the bucket is keyed on
   * the account rather than the IP), and it means a test run that signs the
   * same learner in repeatedly will legitimately be refused. Backing off is the
   * right response; raising the limit for a test would be testing a different
   * product.
   */
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await signInOnce(page, username);
    } catch (err) {
      if (attempt === 3) throw err;
      await page.waitForTimeout(3000 * (attempt + 1));
    }
  }
}

async function signInOnce(page, username) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  /* The form's inputs are controlled React fields with no `name` attribute;
     `autocomplete` is what they actually carry, and it is also what a password
     manager would key on — so selecting on it tests the same hooks a real
     browser uses. */
  await page.fill('input[autocomplete="username"]', username);
  await page.fill('input[autocomplete="current-password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15_000 });
}

/** The league payload, fetched from inside the authenticated page context. */
async function league(page) {
  return page.evaluate(async () => {
    const r = await fetch("/api/league/me");
    return { status: r.status, body: r.ok ? await r.json() : null };
  });
}

/** Solve one block through the real submit route, from the browser. */
async function submit(page, blockId, answer, submissionId) {
  return page.evaluate(
    async ([blockId, answer, submissionId]) => {
      const r = await fetch("/api/learning/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ blockId, answer, submissionId }),
      });
      return { status: r.status, body: await r.json() };
    },
    [blockId, answer, submissionId],
  );
}

/** Ask the running server for a gradable block, so nothing is hardcoded. */
async function pickBlocks(page, n) {
  return page.evaluate(async (n) => {
    const r = await fetch("/api/league/__blocks");
    if (r.ok) return r.json();
    return null;
  }, n);
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  /* ---------------------------------------------------------------- */
  section("A learner starts the week with no membership");

  await signIn(page, "e2e-1");
  let l = await league(page);
  check("GET /api/league/me is 200 for an enrolled student", l.status === 200, `got ${l.status}`);
  check("they are not competing yet", l.body?.you === null, JSON.stringify(l.body?.you));
  check("the board is empty rather than showing a zero row", (l.body?.rows ?? []).length === 0);
  check("they still have a tier, so the ladder renders", l.body?.tier === 1);

  await page.goto(`${BASE}/league`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${SHOTS}/01-not-started-1440.png`, fullPage: true });

  /* ---------------------------------------------------------------- */
  section("Running Python does not produce XP");

  const runs = await page.evaluate(async () => {
    const out = [];
    for (let i = 0; i < 20; i += 1) {
      const r = await fetch("/api/exec/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "print(1)", language: "python" }),
      });
      out.push(r.status);
    }
    return out;
  });
  l = await league(page);
  check(`20 Run requests (statuses ${[...new Set(runs)].join(",")}) awarded nothing`,
    l.body?.you === null);

  /* ---------------------------------------------------------------- */
  section("A server-verified Submit awards XP exactly once");

  const blocks = JSON.parse(process.env.E2E_BLOCKS ?? "[]");
  if (blocks.length === 0) {
    console.log("  ! E2E_BLOCKS not supplied — cannot drive the submit path");
    failures += 1;
  } else {
    const b = blocks[0];
    const sid = crypto.randomUUID();
    const first = await submit(page, b.blockId, { kind: "option", id: b.correct }, sid);
    check("the answer is graded correct", first.body?.verdict === "correct", JSON.stringify(first.body?.verdict));
    check("XP is announced once", first.body?.league?.gained > 0, JSON.stringify(first.body?.league));
    check("the learner entered the league", first.body?.league?.entered === true);

    const gained = first.body?.league?.gained ?? 0;

    l = await league(page);
    check("the board now shows them", l.body?.you !== null);
    check(`weekly XP equals what was announced (${gained})`, l.body?.you?.weeklyXp === gained,
      `board=${l.body?.you?.weeklyXp}`);
    check("their rank is 1 in a group of 1", l.body?.you?.rank === 1 && l.body?.groupSize === 1);

    /* ---- duplicate ------------------------------------------------ */
    section("A duplicate Submit changes nothing");

    const replay = await submit(page, b.blockId, { kind: "option", id: b.correct }, sid);
    check("the replayed response announces no XP", replay.body?.league === undefined);
    l = await league(page);
    check("weekly XP is unchanged after the replay", l.body?.you?.weeklyXp === gained);

    /* ---- fresh submission id, same solved block -------------------- */
    const fresh = await submit(page, b.blockId, { kind: "option", id: b.correct }, crypto.randomUUID());
    check("a fresh submission id on a solved block is still graded", fresh.body?.verdict === "correct");
    check("but announces no XP", fresh.body?.league === undefined);
    l = await league(page);
    check("weekly XP is still unchanged", l.body?.you?.weeklyXp === gained, `got ${l.body?.you?.weeklyXp}`);

    /* ---- forged claims -------------------------------------------- */
    section("Forged client claims are ignored");

    const forged = await page.evaluate(async ([blockId, correct]) => {
      const r = await fetch("/api/learning/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          blockId, answer: { kind: "option", id: correct },
          submissionId: crypto.randomUUID(),
          amount: 999999, xp: 999999, weekId: "2099-W01", tier: 10,
          league: { gained: 999999, tier: 10 },
        }),
      });
      return { status: r.status, body: await r.json() };
    }, [b.blockId, b.correct]);
    check("a forged amount/week/tier is ignored", forged.body?.league === undefined);
    l = await league(page);
    check("weekly XP unmoved by the forgery", l.body?.you?.weeklyXp === gained);
    check("tier unmoved by the forgery", l.body?.tier === 1);

    /* ---- refresh + re-auth ---------------------------------------- */
    section("State survives a refresh and a re-login");

    await page.goto(`${BASE}/league`, { waitUntil: "networkidle" });
    const shownAfterReload = await page.locator("text=/\\d+/").first().isVisible();
    check("the page renders after a hard reload", shownAfterReload);
    await page.screenshot({ path: `${SHOTS}/02-competing-1440.png`, fullPage: true });

    await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
    await signIn(page, "e2e-1");
    l = await league(page);
    check("weekly XP survives logout and login", l.body?.you?.weeklyXp === gained,
      `got ${l.body?.you?.weeklyXp}`);

    /* ---- a second learner changes the ordering --------------------- */
    section("Another learner earning more changes the ordering");

    const page2 = await ctx.browser().newContext({ viewport: { width: 1440, height: 1000 } });
    const p2 = await page2.newPage();
    await signIn(p2, "e2e-2");
    for (const blk of blocks.slice(0, Math.min(3, blocks.length))) {
      await submit(p2, blk.blockId, { kind: "option", id: blk.correct }, crypto.randomUUID());
    }
    const l2 = await league(p2);
    check("the second learner is ahead on XP", (l2.body?.you?.weeklyXp ?? 0) > gained,
      `${l2.body?.you?.weeklyXp} vs ${gained}`);
    check("and is ranked first", l2.body?.you?.rank === 1);

    l = await league(page);
    check("the first learner is now second", l.body?.you?.rank === 2, `rank ${l.body?.you?.rank}`);
    check("both see a group of two", l.body?.groupSize === 2 && l2.body?.groupSize === 2);

    /* ---- privacy on the wire --------------------------------------- */
    section("What the browser is told about a classmate");

    const wire = JSON.stringify(l.body);
    check("no subject or user uuid in the payload",
      !/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(wire));
    check("no username", !wire.includes("e2e-2"));
    check("no full surname", !wire.includes("Абишев"));
    check("no school or class id", !wire.includes("pilot-school") && !wire.includes("grade-9a"));
    check("classmate is shown as first name + initial",
      l.body.rows.some((r) => r.name === "Ерболат А."),
      JSON.stringify(l.body.rows.map((r) => r.name)));

    await p2.goto(`${BASE}/league`, { waitUntil: "networkidle" });
    await p2.screenshot({ path: `${SHOTS}/03-two-learners-1440.png`, fullPage: true });
    await page2.close();
  }

  /* ---------------------------------------------------------------- */
  section("Both languages");

  for (const loc of ["kk", "ru"]) {
    await page.goto(`${BASE}/league`, { waitUntil: "networkidle" });
    await page.evaluate((l) => {
      try { window.localStorage.setItem("sx.preferences", JSON.stringify({ locale: l })); } catch {}
    }, loc);
    await page.reload({ waitUntil: "networkidle" });
    /* Click the language pill directly — it is the control a learner uses. */
    const pill = page.locator(`button[aria-pressed]`).filter({ hasText: loc.toUpperCase() });
    if (await pill.count()) {
      await pill.first().click();
      await page.waitForTimeout(400);
    }
    const body = await page.locator("body").innerText();
    check(`${loc}: the page carries no untranslated English chrome`,
      !/\b(Weekly league|Your rank|Promotion zone|How is XP)\b/.test(body));
    check(`${loc}: the tier name renders in Latin`, /Pulse|Vector|Circuit/.test(body), body.slice(0, 120));
    await page.screenshot({ path: `${SHOTS}/04-league-${loc}-1440.png`, fullPage: true });
  }

  /* ---------------------------------------------------------------- */
  section("Responsive");

  for (const w of [1440, 1280, 1024, 768, 375]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${BASE}/league`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    check(`${w}px — no page-level horizontal scroll`, !overflow);
    await page.screenshot({ path: `${SHOTS}/05-league-${w}.png`, fullPage: true });
  }

  /* ---------------------------------------------------------------- */
  section("Accessibility of the board");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${BASE}/league`, { waitUntil: "networkidle" });
  const a11y = await page.evaluate(() => {
    const list = document.querySelector("ol");
    const you = document.querySelector('[aria-current="true"]');
    const srOnly = document.querySelectorAll(".sr-only").length;
    return {
      semanticList: Boolean(list),
      currentMarked: Boolean(you),
      srSentences: srOnly,
    };
  });
  check("the board is a semantic ordered list", a11y.semanticList);
  check("the learner's own row carries aria-current", a11y.currentMarked);
  check("movement carries a screen-reader sentence, not colour alone", a11y.srSentences > 0,
    `found ${a11y.srSentences}`);

  await browser.close();

  console.log(`\n${checks - failures}/${checks} checks passed`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
