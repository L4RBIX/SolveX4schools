import { chromium } from "playwright";

const OUT = process.argv[2] ?? "/tmp/shot";
const WIDTHS = [1440, 1280, 1024, 768, 375];

const browser = await chromium.launch();
const report = [];

for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  await page.goto(`${process.env.BASE ?? "http://localhost:3000"}/lesson/m1.l1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const closed = await measure(page);
  await page.screenshot({ path: `${OUT}-${width}-closed.png` });

  // Whichever trigger this breakpoint actually shows. The pill is hidden below
  // `sm`, where the mascot itself is the control.
  const candidates = page.locator('button:has-text("Спросить Nova"), button[aria-label*="Nova"], button[aria-label*="Нова"]');
  const n = await candidates.count();
  let clicked = false;
  for (let i = 0; i < n; i += 1) {
    const c = candidates.nth(i);
    if (await c.isVisible()) { await c.evaluate((el) => el.click()); clicked = true; break; }
  }
  if (!clicked) {
    const all = page.locator("button");
    const total = await all.count();
    for (let i = 0; i < total; i += 1) {
      const c = all.nth(i);
      if (await c.isVisible()) {
        const label = ((await c.getAttribute("aria-label")) ?? "") + (await c.innerText().catch(() => ""));
        if (/nova|нова/i.test(label)) { await c.evaluate((el) => el.click()); clicked = true; break; }
      }
    }
  }
  if (!clicked) throw new Error(`no visible Nova trigger at ${width}`);

  await page.waitForTimeout(900);
  const open = await measure(page);
  await page.screenshot({ path: `${OUT}-${width}-open.png` });

  report.push({ width, closed, open });
  await ctx.close();
}

console.log(JSON.stringify(report, null, 1));
await browser.close();

async function measure(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-panel="true"]');
    const dialog = document.querySelector('[role="dialog"]');
    const r = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.x), w: Math.round(b.width), right: Math.round(b.right) };
    };
    return {
      card: r(card),
      nova: r(dialog),
      docWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}
