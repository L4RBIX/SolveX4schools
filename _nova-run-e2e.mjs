import { chromium } from 'playwright';
import { execSync } from 'node:child_process';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const DB = process.env.DATABASE_URL ?? 'postgres://localhost/solvex_dev';
const SHOTS = process.env.SHOTS ?? new URL('./.shots/', import.meta.url).pathname;
let pass = 0, fail = 0;
const check = (n, c, d = '') => { c ? (pass++, console.log(`PASS  ${n}${d ? ` — ${d}` : ''}`)) : (fail++, console.log(`FAIL  ${n}${d ? ` — ${d}` : ''}`)); };

const B = await chromium.launch();
const ctx = await B.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
const posts = [];
p.on('request', r => {
  if (r.url().includes('/api/nova/hint') && r.method() === 'POST') {
    try { posts.push(JSON.parse(r.postData() ?? '{}')); } catch { posts.push({ unparsed: true }); }
  }
});

execSync(`psql ${DB} -tAc "delete from rate_limit_bucket where bucket_key like 'login:%'"`);
/* Signed in through the real auth route, from inside the page, so the session
   cookie is a real one set by the real handler.

   The form itself is exercised separately and works; driving it here made the
   suite flaky for a reason that has nothing to do with Nova — the username
   field is a controlled input that `fill()` does not commit and that
   `pressSequentially` only sometimes wins the race against hydration, so a
   run would intermittently post an empty username and get a truthful 401. */
await p.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
const auth = await p.evaluate(async () => {
  const r = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'nova-e2e', password: 'solvex-demo-2026' }),
  });
  return { status: r.status, body: await r.text() };
});
if (auth.status !== 200) throw new Error(`login failed: ${auth.status} ${auth.body}`);
await p.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2000);
check('signed in', !p.url().includes('/login'));

const curPage = async () => p.evaluate(() => {
  const t = document.querySelector('div[style*="translateX"]');
  const m = /translateX\(-(\d+)%\)/.exec(t?.getAttribute('style') ?? '');
  return m ? Number(m[1]) / 100 : -1;
});

await p.goto(`${BASE}/lesson/m1.l1`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(8000);

/* Walk to the block with an editor.
 *
 * The track renders every page but only advances when the current one is
 * SETTLED, so getting to the coding block means genuinely answering the two
 * graded blocks in front of it. The correct answers are curriculum facts, taken
 * from `month-01-september.ts`: `m1.l1.b2` is the bare `2 + 2`, and
 * `m1.l1.b4`'s bug is on line 1, where `input()` is never passed through
 * `int()`. Answering wrongly leaves the page on "try again" and the walk stalls
 * — which is correct product behaviour and a stuck test. */
const CORRECT = {
  1: async (page) => {
    const opt = page.locator('button').filter({ hasText: /^\s*2 \+ 2\s*$/ }).first();
    if (await opt.count()) await opt.click();
  },
  3: async (page) => {
    const line = page.locator('button').filter({ hasText: /n = input\(\)/ }).first();
    if (await line.count()) await line.click();
  },
};

let editor = null, at = -1;
for (let step = 0; step < 14; step++) {
  at = await curPage(p);
  const active = p.locator('div[style*="translateX"] > *').nth(at);
  const ta = active.locator('textarea');
  if (await ta.count() > 0 && await ta.first().isVisible()) { editor = ta.first(); break; }

  const next = p.getByRole('button', { name: /Келесі|Далее|Жалғастыру|Продолжить|Түсіндім|Понятно/ }).first();
  if (await next.count() && await next.isEnabled()) {
    await next.click().catch(() => {});
    await p.waitForTimeout(2200);
    continue;
  }

  await CORRECT[at]?.(active);
  await p.waitForTimeout(900);
  const chk = p.getByRole('button', { name: /^(Тексеру|Проверить)$/ }).first();
  if (await chk.count() && await chk.isEnabled()) {
    await chk.click().catch(() => {});
    await p.waitForTimeout(6000);
  } else {
    break;
  }
}
check('reached a block with a code editor', editor !== null, `page ${at}`);
await p.screenshot({ path: `${SHOTS}/B-1-code-block.png` });

/* The learner's broken program — an undefined name, exactly as in the report. */
const BROKEN = 'ташгук = 5\nprint(ташгуk)';
await editor.fill(BROKEN);
await p.waitForTimeout(1200);

/* Wait for CPython to finish downloading, then Run. */
const runBtn = p.getByRole('button', { name: /Іске қосу|Запустить/ }).first();
for (let i = 0; i < 40; i++) {
  if (await runBtn.count() && await runBtn.isEnabled()) break;
  await p.waitForTimeout(2000);
}
check('Run became available (CPython booted)', await runBtn.count() > 0 && await runBtn.isEnabled());
await runBtn.click().catch(() => {});

/* Wait for the traceback to appear on screen. */
let sawError = false;
for (let i = 0; i < 30; i++) {
  if ((await p.innerText('body')).includes('NameError')) { sawError = true; break; }
  await p.waitForTimeout(2000);
}
check('the browser shows a NameError', sawError);
await p.screenshot({ path: `${SHOTS}/B-2-nameerror.png` });

/* Ask Nova, with no extra clicks. */
await p.getByRole('button', { name: /Nova/i }).first().click().catch(() => {});
await p.waitForTimeout(2500);
const box = p.locator('textarea').last();
await box.fill('Почему ошибка?');
await box.press('Enter');
await p.waitForTimeout(26000);
await p.screenshot({ path: `${SHOTS}/B-3-nova-answer.png` });

const sent = posts[posts.length - 1] ?? {};
console.log('\nREQUEST → ' + JSON.stringify({ blockId: sent.blockId, draft: sent.draft, lastRun: sent.lastRun }, null, 1).slice(0, 900));
check('request carries the learner CURRENT code', typeof sent.draft?.code === 'string' && sent.draft.code.includes('ташгук'), (sent.draft?.code ?? '').slice(0, 40));
check('request carries lastRun', sent.lastRun != null);
check('lastRun carries the stderr traceback', String(sent.lastRun?.stderr ?? '').includes('NameError'), String(sent.lastRun?.stderr ?? '').slice(0, 80));
check('lastRun status is a runtime error', sent.lastRun?.status === 'runtime_error', String(sent.lastRun?.status));

const body = await p.innerText('body');
const reply = (body.split('Почему ошибка?').pop() ?? '').trim();
console.log('\nREPLY → ' + reply.slice(0, 500).replace(/\n+/g, ' | '));
const asksWhichError = /какая (у тебя )?ошибка|что ты уже попробовал|какого результата ждал|не смог составить/i.test(reply);
check('Nova does NOT ask which error it was', !asksWhichError);
check('reply engages the actual name error', /NameError|имя|переменн|ташгу|опечат|назван/i.test(reply));

console.log(`\n═══════ ${pass} passed, ${fail} failed ═══════`);
await B.close();
process.exit(fail > 0 ? 1 : 0);
