import { chromium } from 'playwright';
import { execSync } from 'node:child_process';

const BASE = 'http://localhost:3200';
const DB = 'postgres://localhost/solvex_dev';
const SHOTS = '/private/tmp/claude-501/-Users-kydyrbekbekarys-SolveX4schools/81a13827-c38c-4047-b082-952d6af117aa/scratchpad/shots';
let pass = 0, fail = 0;
const check = (n, c, d = '') => { c ? (pass++, console.log(`PASS  ${n}${d ? ` — ${d}` : ''}`)) : (fail++, console.log(`FAIL  ${n}${d ? ` — ${d}` : ''}`)); };

const B = await chromium.launch();

async function session(locale) {
  execSync(`node scripts/_nova-e2e-reset.mjs`, { stdio: 'ignore', env: { ...process.env, DATABASE_URL: DB } });
  const p = await (await B.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const posts = [];
  p.on('request', r => {
    if (r.url().includes('/api/nova/hint') && r.method() === 'POST') {
      try { posts.push(JSON.parse(r.postData() ?? '{}')); } catch { /* ignore */ }
    }
  });
  await p.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  const auth = await p.evaluate(async () => (await fetch('/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'nova-e2e', password: 'solvex-demo-2026' }) })).status);
  if (auth !== 200) throw new Error(`login ${auth}`);
  await p.evaluate(async (loc) => { await fetch('/api/preferences', { method: 'PUT',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ preferences: { locale: loc } }) }); }, locale);
  await p.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2000);
  return { p, posts };
}

const curPage = async (p) => p.evaluate(() => {
  const t = document.querySelector('div[style*="translateX"]');
  const m = /translateX\(-(\d+)%\)/.exec(t?.getAttribute('style') ?? '');
  return m ? Number(m[1]) / 100 : -1;
});

/** Every Nova turn currently in the transcript, in order. */
const novaTurns = (p) => p.evaluate(() => {
  const panel = document.querySelector('aside,[role=dialog]');
  if (!panel) return [];
  /* Transcript only. The policy status line is on screen ON PURPOSE — that is
     the whole design — so a scraper that takes every paragraph in the panel
     cannot answer the question being asked, which is whether the ladder is
     talking IN the conversation. */
  return [...panel.querySelectorAll('p')]
    .filter(e => !e.closest('[data-nova-status]') && !e.hasAttribute('data-nova-status'))
    .map(e => ({ text: (e.textContent ?? '').trim(), cls: e.className }))
    .filter(x => x.text.length > 12);
});

for (const [locale, ask1, ask2, ask3, ask4] of [
  ['kk', 'Неге қате?', 'тырнақша ішінде 2 + 2', 'иә, солай', 'түсіндім, енді ше?'],
  ['ru', 'Почему ошибка?', 'внутри кавычек 2 + 2', 'да, наверное', 'понял, а дальше?'],
]) {
  console.log(`\n════════ VOICE · ${locale.toUpperCase()} ════════`);
  const { p, posts } = await session(locale);

  await p.goto(`${BASE}/lesson/m1.l1`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(7000);
  for (let i = 0; i < 6 && (await curPage(p)) < 1; i++) {
    await p.getByRole('button', { name: /Келесі|Далее|Жалғастыру|Продолжить/ }).first().click().catch(() => {});
    await p.waitForTimeout(2200);
  }
  const page = p.locator('div[style*="translateX"] > *').nth(await curPage(p));
  await page.locator('button').filter({ hasText: /^\s*"2 \+ 2"\s*$/ }).first().click();
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: /^(Тексеру|Проверить)$/ }).first().click();
  await p.waitForTimeout(8000);

  /* ---- P1: no floating speaker anywhere on the lesson ---- */
  const speakers = await p.evaluate(() => {
    const svgs = [...document.querySelectorAll('svg')];
    const suspect = svgs.filter(s => {
      const b = s.closest('button');
      const label = (b?.getAttribute('aria-label') ?? '').toLowerCase();
      return /дыбыс|оқы|прочит|озвуч|speak|aloud|звук/.test(label);
    });
    return { count: suspect.length, toolbars: document.querySelectorAll('[data-tutor-toolbar]').length };
  });
  check(`[${locale}] no read-aloud control on the lesson`, speakers.count === 0 && speakers.toolbars === 0, JSON.stringify(speakers));

  await p.getByRole('button', { name: /Nova/i }).first().click().catch(() => {});
  await p.waitForTimeout(2200);

  const replies = [];
  for (const [i, q] of [ask1, ask2, ask3, ask4].entries()) {
    const box = p.locator('textarea').last();
    await box.fill(q);
    await box.press('Enter');
    await p.waitForTimeout(24000);
    const turns = await novaTurns(p);
    replies.push(turns.map(t => t.text).join(' ⏎ '));
    if (i === 0) await p.screenshot({ path: `${SHOTS}/V-${locale}-1-first-reply.png` });
  }
  await p.screenshot({ path: `${SHOTS}/V-${locale}-2-four-turns.png` });

  /* ---- P0: no amber policy bubble in the transcript ---- */
  const amber = await p.evaluate(() => {
    const panel = document.querySelector('aside,[role=dialog]');
    return [...(panel?.querySelectorAll('p') ?? [])]
      .filter(e => /b-warn/.test(e.className))
      .map(e => (e.textContent ?? '').trim().slice(0, 60));
  });
  check(`[${locale}] no amber policy bubble in the transcript`, amber.length === 0, JSON.stringify(amber));

  const POLICY_COPY = locale === 'kk'
    ? /Сұрақтан бастайық|Алдыңғы ішарамен бір нәрсе жасап көрші|Бір қадам жеткілікті/
    : /Начнём с вопроса|Попробуй что-нибудь с прошлой подсказкой|Пока хватит одного шага/;
  const transcript = (await novaTurns(p)).map(t => t.text).join('\n');
  check(`[${locale}] no ladder narration in the transcript`, !POLICY_COPY.test(transcript));

  /* And when it IS shown, it is the quiet line by the composer and nothing
     else. Its presence is not required — it depends which rung the ladder
     landed on — but if it exists it must live here. */
  const statusEls = await p.evaluate(() =>
    [...document.querySelectorAll('[data-nova-status]')].map(e => (e.textContent ?? '').trim()));
  check(`[${locale}] at most one status line, outside the transcript`, statusEls.length <= 1,
    JSON.stringify(statusEls).slice(0, 120));

  /* ---- P2: voice ---- */
  const last = replies[replies.length - 1];
  console.log(`TURN 1 → ${replies[0].slice(0, 260).replace(/\n/g, ' ')}`);
  console.log(`TURN 4 → ${last.slice(-260).replace(/\n/g, ' ')}`);

  const OPENERS = locale === 'kk'
    ? /^(Сұрақтан бастайық|Кел, қарайық|Жақсы сұрақ|Тамаша|Жарайсың)/
    : /^(Начнём с|Давай разберёмся|Давай посмотрим|Хороший вопрос|Отлично|Молодец)/;
  check(`[${locale}] first reply does not open with a template`, !OPENERS.test(replies[0].trim()));

  /* Forward movement: the four turns must not be the same sentence four times. */
  const uniq = new Set(replies.map(r => r.slice(-120)));
  check(`[${locale}] the dialogue moved across 4 turns`, uniq.size >= 3, `${uniq.size}/4 distinct tails`);

  check(`[${locale}] made 4 Nova requests`, posts.length >= 4, `${posts.length}`);
  check(`[${locale}] every request carried the draft`, posts.every(x => x.draft != null));

  await p.context().close();
}

console.log(`\n═══════ ${pass} passed, ${fail} failed ═══════`);
await B.close();
process.exit(fail > 0 ? 1 : 0);
