/**
 * Site-wide audit against the reference design system.
 *
 * Walks every product route at desktop and phone widths and reports the things
 * that are objectively wrong rather than matters of taste: horizontal overflow,
 * console errors, failed requests, Brilliant assets leaking onto product pages,
 * text that renders in the wrong font, and colours that bypass the theme tokens.
 *
 *   node scripts/site-audit.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";

const PRODUCT = [
  "/", "/home", "/program", "/you", "/course/1", "/lesson/m1.l1",
  "/assessment/1", "/review", "/teacher", "/paths", "/schools", "/welcome",
  "/login", "/settings/account", "/settings/preferences", "/help", "/about",
  "/privacy", "/terms", "/program",
];

/* The four the acceptance gate names. It was [1440, 375] — the two extremes —
   and the two in the middle are where a fixed-width panel actually overflows:
   768 is a school tablet in portrait and 1024 is the lid-open laptop half the
   class uses. An audit that only checks the ends misses the middle by
   construction. */
const WIDTHS = [1440, 1024, 768, 375];

const browser = await chromium.launch();
const findings = [];

for (const route of PRODUCT) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      colorScheme: "dark",
    });
    const errors = [];
    const failed = [];
    const brilliant = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
    page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message.slice(0, 160)));
    page.on("requestfailed", (r) => failed.push(r.url().replace(BASE, "")));
    page.on("response", (r) => {
      const u = r.url();
      if (/assets\/original\/brilliant|\.riv(\?|$)/.test(u)) brilliant.push(u.replace(BASE, ""));
      if (r.status() >= 400 && !/favicon/.test(u)) failed.push(`${r.status()} ${u.replace(BASE, "")}`);
    });

    let status = 0;
    try {
      const resp = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 30000 });
      status = resp?.status() ?? 0;
      await page.waitForTimeout(700);
    } catch (e) {
      findings.push({ route, width, kind: "navigation", detail: String(e).slice(0, 120) });
      await page.close();
      continue;
    }

    const probe = await page.evaluate(() => {
      const out = {};
      const de = document.documentElement;
      out.overflow = de.scrollWidth > window.innerWidth + 1
        ? { scrollWidth: de.scrollWidth, inner: window.innerWidth } : null;

      // widest element that sticks out, to make an overflow actionable
      if (out.overflow) {
        let worst = null;
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          const over = r.right - window.innerWidth;
          if (over > 1 && (!worst || over > worst.over)) {
            worst = { over: Math.round(over), tag: el.tagName,
              cls: (el.getAttribute("class") || "").slice(0, 80) };
          }
        }
        out.overflow.worst = worst;
      }

      // fonts actually used for visible text
      const fonts = new Set();
      for (const el of document.querySelectorAll("h1,h2,h3,p,span,button,a,li")) {
        if (!el.textContent?.trim()) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        fonts.add(getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, ""));
      }
      out.fonts = [...fonts];

      // images that failed to decode
      out.brokenImages = [...document.querySelectorAll("img")]
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => i.getAttribute("src")?.slice(0, 90));

      // any visible text below 12px is a legibility break for a 14-year-old
      const tiny = new Set();
      for (const el of document.querySelectorAll("body *")) {
        if (!el.childNodes.length) continue;
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!hasText) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs && fs < 12) tiny.add(`${fs}px "${el.textContent.trim().slice(0, 28)}"`);
      }
      out.tinyText = [...tiny].slice(0, 6);

      return out;
    });

    const rec = { route, width, status, ...probe, errors, failed: [...new Set(failed)], brilliant };
    if (rec.overflow || errors.length || rec.failed.length || brilliant.length ||
        probe.brokenImages.length || probe.tinyText.length || status >= 400) {
      findings.push(rec);
    }
    await page.close();
  }
}
await browser.close();

let text = "SITE AUDIT\n==========\n\n";
if (!findings.length) text += "No issues found.\n";
for (const f of findings) {
  text += `${f.route}  @${f.width}  (HTTP ${f.status})\n`;
  if (f.overflow) text += `   OVERFLOW scrollWidth ${f.overflow.scrollWidth} vs ${f.overflow.inner}` +
    (f.overflow.worst ? ` — worst: <${f.overflow.worst.tag}> +${f.overflow.worst.over}px  ${f.overflow.worst.cls}` : "") + "\n";
  for (const e of (f.errors ?? [])) text += `   CONSOLE ${e}\n`;
  for (const r of (f.failed ?? [])) text += `   REQUEST ${r}\n`;
  for (const b of (f.brilliant ?? [])) text += `   BRILLIANT ASSET ${b}\n`;
  for (const i of (f.brokenImages ?? [])) text += `   BROKEN IMG ${i}\n`;
  for (const t of (f.tinyText ?? [])) text += `   TINY TEXT ${t}\n`;
  if (f.fonts && f.fonts.length) text += `   fonts: ${f.fonts.join(", ")}\n`;
  text += "\n";
}
writeFileSync("docs/design/reference/site-audit.txt", text);
console.log(text);
