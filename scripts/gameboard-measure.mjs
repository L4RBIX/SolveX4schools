/**
 * Gameboard geometry harness.
 *
 * Measures the live /course/N board at each required viewport and diffs it
 * against the values measured on brilliant.org's own course gameboard, then
 * writes screenshots for the visual comparison.
 *
 *   node scripts/gameboard-measure.mjs [baseUrl] [outDir]
 *
 * The reference column is not a guess: every number in REFERENCE below was read
 * out of the live brilliant.org runtime with getComputedStyle/getBoundingClientRect
 * at innerWidth 1470. See docs/design/BRILLIANT_GAMEBOARD_FORENSICS.md.
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3] ?? "docs/design/reference/solvex";
const VIEWPORTS = [1440, 1280, 1024, 768, 375];

/** Measured on brilliant.org/courses/pixel-pusher at innerWidth 1470. */
const REFERENCE = {
  scrollerTop: 65,
  scrollerGap: 32,
  scrollerPadTop: 20,
  headerStickyTop: 41,
  headerH: 64,
  headerBtnH: 64,
  headerRadius: 18,
  slabRadius: 20,
  slabOverhangTop: 2,
  slabOverhangBottom: 6,
  slabOverhangSide: 2,
  headerMarginBottom: 200,
  stackMarginTopFirst: -120,
  stackMarginTopRest: -200,
  stackMarginBottom: 60,
  stackGap: 30,
  sectionGap: 30,
  rowH: 134,
  rowPitch: 164,
  firstRowMarginTop: 45,
  pedestalW: 128,
  pedestalH: 134,
  pedestalLabelGap: 8,
  labelH: 55,
  labelPadBottom: 29.5,
  cardRadius: 40,
  cardBorder: 2,
  cardBottom: 40,
  ctaH: 48,
  ctaRadius: 60,
};

/** Runs in the page. Returns the same shape as REFERENCE where measurable. */
function probe() {
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;
  const cs = (el) => getComputedStyle(el);
  const out = { notes: [] };

  const scroller = [...document.querySelectorAll("*")].find(
    (e) => cs(e).position === "fixed" && e.scrollHeight > e.clientHeight + 100 && e.clientHeight > 200,
  );
  if (!scroller) return { error: "no scroller found" };
  const s = cs(scroller);
  out.scrollerTop = px(s.top);
  out.scrollerGap = px(s.gap);
  out.scrollerPadTop = px(s.paddingTop);

  const headers = [...document.querySelectorAll("h3")]
    .map((h) => h.closest("button"))
    .filter(Boolean);
  if (!headers.length) return { error: "no level headers found" };

  const btn = headers[0];
  const wrap = btn.parentElement;
  const sticky = wrap.parentElement;
  const slab = [...wrap.children].find((c) => c !== btn);
  const section = sticky.parentElement;
  const column = section.parentElement;

  out.headerStickyTop = px(cs(sticky).top);
  out.headerH = px(cs(sticky).height);
  out.headerBtnH = px(cs(btn).height);
  out.headerRadius = px(cs(btn).borderRadius);
  out.headerMarginBottom = px(cs(sticky).marginBottom);
  out.sectionGap = px(cs(column).gap);

  if (slab) {
    const b = btn.getBoundingClientRect();
    const sb = slab.getBoundingClientRect();
    out.slabRadius = px(cs(slab).borderRadius);
    out.slabOverhangTop = Math.round((b.top - sb.top) * 100) / 100;
    out.slabOverhangBottom = Math.round((sb.bottom - b.bottom) * 100) / 100;
    out.slabOverhangSide = Math.round((b.left - sb.left) * 100) / 100;
    out.slabColor = cs(slab).backgroundColor;
  }

  // node stacks, one per section
  const sections = [...column.children].filter((c) => c.tagName === "SECTION");
  const stacks = sections.map((sec) => sec.children[1]).filter(Boolean);
  if (stacks.length) {
    out.stackMarginTopFirst = px(cs(stacks[0]).marginTop);
    out.stackMarginTopRest = stacks[1] ? px(cs(stacks[1]).marginTop) : null;
    out.stackMarginBottom = px(cs(stacks[0]).marginBottom);
    out.stackGap = px(cs(stacks[0]).gap);

    const rows = [...stacks[0].children];
    out.rowCount = rows.length;
    const boxes = rows.map((r) => r.getBoundingClientRect());
    out.rowH = Math.round(boxes[0].height);
    out.rowHeights = boxes.map((b) => Math.round(b.height)).join(",");
    if (boxes.length > 1) out.rowPitch = Math.round(boxes[1].top - boxes[0].top);
    out.firstRowMarginTop = px(cs(rows[0]).marginTop);

    // the milestone itself
    const svg = rows[0].querySelector("svg");
    if (svg) {
      const sb = svg.getBoundingClientRect();
      out.pedestalW = Math.round(sb.width);
      out.pedestalH = Math.round(sb.height);
    }
    const labelBox = rows[0].querySelector("[data-label]");
    if (labelBox) {
      out.labelH = px(cs(labelBox).height);
      out.labelPadBottom = px(cs(labelBox).paddingBottom);
      if (svg) {
        out.pedestalLabelGap = Math.round(
          labelBox.getBoundingClientRect().left - svg.getBoundingClientRect().right,
        );
      }
    }

    // zig-zag amplitude: how far the button's centre swings off the row centre
    const amps = rows.map((r) => {
      const inner = r.querySelector("button") ?? r.firstElementChild;
      if (!inner) return 0;
      const rb = r.getBoundingClientRect();
      const ib = inner.getBoundingClientRect();
      return Math.round(ib.left + ib.width / 2 - (rb.left + rb.width / 2));
    });
    out.zigzag = amps.join(",");
    out.zigzagAmplitude = Math.max(...amps.map(Math.abs));
  }

  // horizontal overflow — the thing that must never happen
  out.docScrollW = document.documentElement.scrollWidth;
  out.innerW = window.innerWidth;
  out.horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;

  return out;
}

const TOL = 4;

const browser = await chromium.launch();
mkdirSync(OUT, { recursive: true });
const report = {};

for (const width of VIEWPORTS) {
  /* The board's tokens are `light-dark()` pairs and the product ships dark, so
     the harness must ask for dark — otherwise every colour it captures is the
     light half and the comparison is against the wrong page. */
  const page = await browser.newPage({
    viewport: { width, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  /* Licensing gate: the product route must not fetch anything from the
     Brilliant clone's asset tree. The listener has to be attached BEFORE the
     navigation — attached after, it records nothing from the initial load and
     reports a reassuring "none" that proves absolutely nothing. */
  const requested = [];
  page.on("request", (r) => requested.push(r.url()));

  await page.goto(`${BASE}/course/1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const m = await page.evaluate(probe);
  m.brilliantAssets = requested
    .filter((u) => /assets\/original\/brilliant|\.riv(\?|$)/.test(u))
    .map((u) => u.replace(BASE, ""));
  report[width] = m;

  await page.screenshot({ path: `${OUT}/board-${width}.png` });

  // the selected state, at desktop only — and the card, which only exists then
  if (width === 1440 && !m.error) {
    const second = page.locator("[data-node] button").nth(1);
    if (await second.count()) {
      await second.click();
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${OUT}/board-${width}-selected.png` });
      Object.assign(
        m,
        await page.evaluate(() => {
          const px = (v) => Math.round(parseFloat(v) * 100) / 100;
          const cs = (el) => getComputedStyle(el);
          const cta = document.querySelector('[data-slot="button3d-face"]');
          if (!cta) return { notes: ["no cta"] };
          const card = cta.closest("div[class*='rounded-']");
          const out = { ctaH: px(cs(cta).height), ctaRadius: px(cs(cta).borderRadius) };
          if (card) {
            out.cardRadius = px(cs(card).borderRadius);
            out.cardBorder = px(cs(card).borderTopWidth);
            out.cardBg = cs(card).backgroundColor;
            const sticky = card.closest("div[class*='sticky']");
            if (sticky) out.cardBottom = px(cs(sticky).bottom);
          }
          return out;
        }),
      );
    }
  }
  await page.close();
}

await browser.close();

// ---- report ------------------------------------------------------------
const desktop = report[1440] ?? {};
const rows = [];
let fails = 0;
for (const [k, ref] of Object.entries(REFERENCE)) {
  const got = desktop[k];
  if (got === undefined || got === null) {
    rows.push([k, ref, "—", "not measured"]);
    continue;
  }
  const delta = Math.round((got - ref) * 100) / 100;
  const ok = Math.abs(delta) <= TOL;
  if (!ok) fails++;
  rows.push([k, ref, got, ok ? "ok" : `DELTA ${delta > 0 ? "+" : ""}${delta}`]);
}

const w = (s, n) => String(s).padEnd(n);
let text = `Gameboard geometry vs brilliant.org reference (tolerance ${TOL}px)\n\n`;
text += `${w("measurement", 24)}${w("reference", 12)}${w("solvex", 12)}verdict\n`;
text += "-".repeat(64) + "\n";
for (const [k, ref, got, verdict] of rows) {
  text += `${w(k, 24)}${w(ref, 12)}${w(got, 12)}${verdict}\n`;
}
text += `\nzig-zag: ${desktop.zigzag ?? "?"}  (amplitude ${desktop.zigzagAmplitude ?? "?"}, reference 59)\n`;
text += `row heights: ${desktop.rowHeights ?? "?"}\n\n`;
text += "Horizontal overflow by viewport (must all be false):\n";
for (const vw of VIEWPORTS) {
  const r = report[vw] ?? {};
  text += `  ${w(vw + "px", 8)}scrollWidth ${w(r.docScrollW ?? "?", 8)}inner ${w(r.innerW ?? "?", 8)}overflow=${r.horizontalOverflow}\n`;
}
text += "\nBrilliant assets requested by /course/1 (must all be none):\n";
let leaked = 0;
for (const vw of VIEWPORTS) {
  const hits = report[vw]?.brilliantAssets ?? [];
  leaked += hits.length;
  text += `  ${w(vw + "px", 8)}${hits.length ? hits.join(", ") : "none"}\n`;
}

text += `\n${fails} measurement(s) outside tolerance. ${leaked} Brilliant asset request(s).\n`;

writeFileSync(`${OUT}/geometry-report.txt`, text);
writeFileSync(`${OUT}/geometry-report.json`, JSON.stringify(report, null, 2));
console.log(text);
process.exit(fails > 0 || leaked > 0 ? 1 : 0);
