/**
 * The QA override, proven in a browser, in both directions.
 *
 * A QA account must reach every month; an ordinary learner must still be
 * stopped at September. One run asserts both, because the override is only
 * worth having if the second half stays true.
 *
 *   BASE=… QA_USER=… QA_PW=… NORMAL_USER=… NORMAL_PW=… node scripts/qa-access-matrix.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:3311";
let failures = 0;
const check = (name, ok, detail = "") => {
  if (ok) console.log(`  ✓ ${name}`);
  else { failures += 1; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};

/** One lesson per month, taken from the curriculum's own first lesson ids. */
const LESSONS = ["m1.l0", "m2.l1", "m3.l1", "m4.l1", "m5.l1", "m6.l1", "m7.l1", "m8.l1", "m9.l1"];

async function signIn(page, user, pw, newPw) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[autocomplete="username"]', user);
  await page.fill('input[autocomplete="current-password"]', pw);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 });
  if (page.url().includes("/account/password") && newPw) {
    await page.fill('input[autocomplete="current-password"]', pw);
    for (const f of await page.$$('input[autocomplete="new-password"]')) await f.fill(newPw);
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => !u.pathname.startsWith("/account"), { timeout: 20000 });
  }
}

const status = async (page, path) => {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  return res?.status() ?? 0;
};

const browser = await chromium.launch();

/* ---- the QA account: every month opens ---------------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await signIn(page, process.env.QA_USER, process.env.QA_PW);
  console.log("\nQA account — every month must open");
  check("/home", (await status(page, "/home")) === 200);
  for (let m = 1; m <= 9; m += 1) {
    const s = await status(page, `/course/${m}`);
    check(`/course/${m}`, s === 200, `status ${s}`);
  }
  for (const l of LESSONS) {
    const s = await status(page, `/lesson/${l}`);
    check(`/lesson/${l}`, s === 200, `status ${s}`);
  }
  await ctx.close();
}

/* ---- an ordinary learner: September only -------------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await signIn(page, process.env.NORMAL_USER, process.env.NORMAL_PW, process.env.NORMAL_NEW_PW);
  console.log("\nOrdinary learner — progression is unchanged");
  check("/course/1 opens", (await status(page, "/course/1")) === 200);
  check("/lesson/m1.l0 opens", (await status(page, "/lesson/m1.l0")) === 200);
  for (const m of [2, 5, 9]) {
    /* A closed month renders the board's "not yours yet" panel rather than a
       404 — that is the product's own choice and it is what `MonthNotOpen`
       exists for. The assertion is that the LESSONS refuse. */
    const s = await status(page, `/lesson/m${m}.l1`);
    check(`/lesson/m${m}.l1 refuses`, s === 404, `status ${s}`);
  }
  const boardText = await (async () => {
    await page.goto(`${BASE}/course/2`, { waitUntil: "networkidle" });
    return page.evaluate(() => document.body.innerText);
  })();
  check(
    "/course/2 says the month is not this learner's yet",
    /жабық|закрыт|ашылмаған|не открыт/i.test(boardText),
    boardText.slice(0, 60).replace(/\n/g, " "),
  );
  await ctx.close();
}

await browser.close();
console.log(`\n${failures === 0 ? "QA access matrix: all green" : `${failures} failed`}`);
process.exit(failures > 0 ? 1 : 0);
