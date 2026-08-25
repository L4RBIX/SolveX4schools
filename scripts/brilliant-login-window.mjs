#!/usr/bin/env node
/**
 * Opens ONE Chrome window on the dedicated profile and holds it open until
 * this process is terminated, flushing cookies to disk on the way out.
 *
 * No auto-detection. Three attempts at sniffing the auth state all produced
 * false positives (a "Continue" string on the marketing page; the presence of
 * an anonymous Django `sessionid`; a fetch() whose r.url stayed on /home/).
 * The only reliable signal is a real navigation, checked separately AFTER the
 * window closes — so the human says when they are done, not a heuristic.
 */
import { chromium } from "playwright";

const PROFILE = "/private/tmp/claude-501/-Users-kydyrbekbekarys-SolveX4schools/673fb55d-204d-4123-9fe3-9a31bd6e2ca2/scratchpad/pw-profile";

const ctx = await chromium.launchPersistentContext(PROFILE, {
  channel: "chrome",
  headless: false,
  viewport: { width: 1440, height: 900 },
});

const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto("https://brilliant.org/login/", { waitUntil: "domcontentloaded" });

console.log("WINDOW OPEN at /login/ — use EMAIL + PASSWORD, not Google.");
console.log("Google blocks OAuth from automated browsers by design.");

let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  try { await ctx.close(); } catch {}
  console.log("closed; cookies flushed");
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Hold the process open indefinitely.
await new Promise(() => {});
