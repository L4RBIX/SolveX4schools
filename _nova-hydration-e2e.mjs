import { chromium } from 'playwright';
import { execSync } from 'node:child_process';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const SHOTS = process.env.SHOTS ?? new URL('./.shots/', import.meta.url).pathname;
let pass = 0, fail = 0;
const check = (n, c, d = '') => { c ? (pass++, console.log(`PASS  ${n}${d ? ` — ${d}` : ''}`)) : (fail++, console.log(`FAIL  ${n}${d ? ` — ${d}` : ''}`)); };

const B = await chromium.launch();
const p = await (await B.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const posts = [];
p.on('request', r => {
  if (r.url().includes('/api/nova/hint') && r.method() === 'POST') {
    try { posts.push(JSON.parse(r.postData() ?? '{}')); } catch { posts.push({ unparsed: true }); }
  }
});

execSync(`psql postgres://localhost/solvex_dev -tAc "delete from rate_limit_bucket"`);
await p.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
const auth = await p.evaluate(async () => {
  const r = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'nova-e2e', password: 'solvex-demo-2026' }) });
  return r.status;
});
check('signed in', auth === 200, `HTTP ${auth}`);

const curPage = async () => p.evaluate(() => {
  const t = document.querySelector('div[style*="translateX"]');
  const m = /translateX\(-(\d+)%\)/.exec(t?.getAttribute('style') ?? '');
  return m ? Number(m[1]) / 100 : -1;
});

/* A COLD load: the learner comes back to a lesson they already answered in.
   Nothing in this session put the answer on screen — the server did. */
await p.goto(`${BASE}/lesson/m1.l1`, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(9000);
const resumed = await curPage();
check('resumed past the block already settled', resumed === 2, `page ${resumed}`);

/* Walk BACK to the settled block, the way a learner reviewing their work does. */
const back = p.locator('button:has(svg)').first();
for (let i = 0; i < 4 && (await curPage()) > 1; i++) {
  await p.getByRole('button', { name: /Артқа|Назад|Back/ }).first().click().catch(async () => {
    await back.click().catch(() => {});
  });
  await p.waitForTimeout(2000);
}
const at = await curPage();
check('navigated back to the settled block', at === 1, `page ${at}`);
await p.screenshot({ path: `${SHOTS}/C-1-hydrated.png` });

const restoredPick = await p.evaluate(() => {
  const t = document.querySelector('div[style*="translateX"]');
  const page = t?.children?.[1];
  const checked = page?.querySelector('[aria-checked="true"],input:checked');
  return checked ? (checked.closest('button,label')?.innerText ?? '').trim() : null;
});
console.log('RESTORED SELECTION →', JSON.stringify(restoredPick));

await p.getByRole('button', { name: /Nova/i }).first().click().catch(() => {});
await p.waitForTimeout(2500);
const box = p.locator('textarea').last();
await box.fill('Неге қате?');
await box.press('Enter');
await p.waitForTimeout(26000);
await p.screenshot({ path: `${SHOTS}/C-2-hydrated-answer.png` });

const sent = posts[posts.length - 1] ?? {};
console.log('REQUEST →', JSON.stringify({ blockId: sent.blockId, draft: sent.draft }));
check('hydrated request targets the settled block', sent.blockId === 'm1.l1.b2', sent.blockId);
check('hydrated request carries the RESTORED selection', sent.draft?.selectedOptionId === '"2 + 2"', String(sent.draft?.selectedOptionId));

const reply = ((await p.innerText('body')).split('Неге қате?').pop() ?? '').trim();
console.log('REPLY →', reply.slice(0, 350).replace(/\n+/g, ' | '));
check('still grounded after a cold load', /тырнақша|print|жол|"2 \+ 2"/i.test(reply));

console.log(`\n═══ ${pass} passed, ${fail} failed ═══`);
await B.close();
process.exit(fail > 0 ? 1 : 0);
