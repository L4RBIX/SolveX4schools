#!/usr/bin/env node
/**
 * Browser harness for the authenticated brilliant.org surfaces.
 *
 * Uses a DEDICATED Chrome profile (not the user's live one) so no existing
 * session or credential store is touched. You log in once in the visible
 * window; the profile persists, and every later run reuses it headlessly.
 *
 *   node scripts/brilliant-session.mjs login   # opens a window, waits for you
 *   node scripts/brilliant-session.mjs probe   # reports auth state per route
 */
import { chromium } from "playwright";
import path from "node:path";

const PROFILE = process.env.PW_PROFILE
  || "/private/tmp/claude-501/-Users-kydyrbekbekarys-SolveX4schools/673fb55d-204d-4123-9fe3-9a31bd6e2ca2/scratchpad/pw-profile";

const ROUTES = [
  ["home",    "https://brilliant.org/home/"],
  ["courses", "https://brilliant.org/courses/"],
  ["you",     "https://brilliant.org/you/"],
];

async function open({ headless }) {
  // Cloudflare binds cf_clearance to the UA; headless Chrome reports a
  // different one and gets bounced to the marketing page. Run headed.
  if (process.env.PW_FORCE_HEADED === "1") headless = false;
  return chromium.launchPersistentContext(PROFILE, {
    channel: "chrome",
    headless,
    viewport: { width: 1440, height: 900 },
  });
}

/**
 * Ground truth for auth: /home/ is gated. Logged out, brilliant.org bounces it
 * to /. Logged in, it stays. Text sniffing is NOT reliable here — an earlier
 * version matched the word "Continue" on the marketing page and reported a
 * false login. Django also sets `sessionid` for anonymous visitors, so the
 * presence of that cookie proves nothing either.
 */
async function isAuthed(ctx, page) {
  // Checked with fetch() INSIDE the page that is already open. An earlier
  // version opened and closed a fresh page on every poll, which made the
  // window flash open/closed every few seconds.
  try {
    return await page.evaluate(async () => {
      const r = await fetch("/home/", { redirect: "follow", credentials: "include" });
      return new URL(r.url).pathname.startsWith("/home");
    });
  } catch {
    return false;
  }
}

async function authState(page) {
  return page.evaluate(() => {
    const t = document.body.innerText || "";
    return {
      title: document.title.slice(0, 60),
      path: location.pathname,
      canvases: document.querySelectorAll("canvas").length,
      sample: t.replace(/\s+/g, " ").slice(0, 140),
    };
  });
}

const cmd = process.argv[2] || "probe";

if (cmd === "login") {
  const ctx = await open({ headless: false });
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto("https://brilliant.org/", { waitUntil: "domcontentloaded" });
  console.log("A Chrome window is open. Log into Brilliant in it.");
  console.log("Checking every 8s for up to 10 minutes. The window stays open");
  console.log("until a real logged-in session is confirmed.");
  const deadline = Date.now() + 10 * 60_000;
  let ok = false;
  while (Date.now() < deadline) {
    await page.waitForTimeout(8000);
    if (await isAuthed(ctx, page)) {
      ok = true;
      console.log("CONFIRMED: /home/ resolved without redirect.");
      break;
    }
    process.stdout.write(".");
  }
  console.log("");
  console.log(ok ? "SESSION SAVED -> " + PROFILE : "TIMED OUT - no login detected");
  await ctx.close();
  process.exit(ok ? 0 : 1);
}

if (cmd === "probe") {
  const ctx = await open({ headless: true });
  const page = await ctx.newPage();
  for (const [name, url] of ROUTES) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(3500);
      const s = await authState(page);
      const stayed = s.path !== "/" && !/sign-?in/i.test(s.path);
      console.log(`${name.padEnd(9)} ${stayed ? "AUTHED    " : "logged-out"} ${s.path.padEnd(14)} canvases=${s.canvases}  ${s.sample.slice(0, 66)}`);
    } catch (e) {
      console.log(`${name.padEnd(9)} ERROR ${String(e.message).slice(0, 70)}`);
    }
  }
  await ctx.close();
}
