import { chromium } from 'playwright';
import { execSync } from 'node:child_process';

const BASE = process.env.BASE ?? 'http://localhost:3000';
const DB = process.env.DATABASE_URL ?? 'postgres://localhost/solvex_dev';
const SHOTS = process.env.SHOTS ?? new URL('./.shots/', import.meta.url).pathname;
let pass = 0, fail = 0;
const check = (n, c, d = '') => { c ? (pass++, console.log(`PASS  ${n}${d ? ` — ${d}` : ''}`)) : (fail++, console.log(`FAIL  ${n}${d ? ` — ${d}` : ''}`)); };
const clearLimit = () => execSync(`psql ${DB} -tAc "delete from rate_limit_bucket where bucket_key like 'login:%'"`);

const B = await chromium.launch();

async function session(locale) {
  clearLimit();
  /* A clean lesson for each case. Without this the second locale opens a lesson
     whose b2 is already settled, `resumePage` correctly starts it on the NEXT
     block, and the run then measures Nova on a block nobody has answered — which
     is a different test that happens to look like a failure of this one. */
  execSync('node scripts/_nova-e2e-reset.mjs', { stdio: 'ignore', env: { ...process.env, DATABASE_URL: DB } });
  const ctx = await B.newContext({ viewport: { width: 1440, height: 1000 } });
  const p = await ctx.newPage();
  const posts = [];
  p.on('request', r => {
    if (r.url().includes('/api/nova/hint') && r.method() === 'POST') {
      try { posts.push(JSON.parse(r.postData() ?? '{}')); } catch { posts.push({ unparsed: true }); }
    }
  });
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
  /* Locale through the preferences API, not `localStorage`.
     `localStorage` is only the source of truth for an ANONYMOUS reader; once
     there is a session the server's stored preference wins, so seeding the
     browser silently lost to a server default of `kk` and the run measured
     Kazakh while reporting it as Russian. */
  const prefStatus = await p.evaluate(async (loc) => {
    const r = await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ preferences: { locale: loc } }),
    });
    return r.status;
  }, locale);
  if (prefStatus !== 200) console.log(`  (preferences PUT -> ${prefStatus})`);
  await p.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  return { p, posts };
}

/** Which page the horizontal track is actually showing. */
const currentPage = async (p) => p.evaluate(() => {
  const t = document.querySelector('div[style*="translateX"]');
  const m = /translateX\(-(\d+)%\)/.exec(t?.getAttribute('style') ?? '');
  return m ? Number(m[1]) / 100 : -1;
});

/** The DOM subtree of the page on screen. Clicks anywhere else are ignored. */
const activePage = async (p) => {
  const idx = await currentPage(p);
  return p.locator('div[style*="translateX"] > *').nth(idx);
};

async function advanceTo(p, target) {
  for (let i = 0; i < 12 && (await currentPage(p)) < target; i++) {
    const adv = p.getByRole('button', { name: /Келесі|Далее|Жалғастыру|Продолжить|Түсіндім|Понятно/ }).first();
    if (!(await adv.count())) break;
    await adv.click().catch(() => {});
    await p.waitForTimeout(2200);
  }
  return currentPage(p);
}

async function askNova(p, question) {
  await p.getByRole('button', { name: /Nova/i }).first().click().catch(() => {});
  await p.waitForTimeout(2500);
  const box = p.locator('textarea').last();
  await box.fill(question);
  await box.press('Enter');
  await p.waitForTimeout(26000);
}

const replyTail = async (p, question) => {
  const t = await p.innerText('body');
  return (t.split(question).pop() ?? '').trim();
};

/* ═══════════ CASE A — print("2 + 2"), wrong option, «why?» ═══════════════ */
for (const [locale, question] of [['kk', 'Неге қате?'], ['ru', 'Почему ошибка?']]) {
  console.log(`\n════════════ CASE A · ${locale.toUpperCase()} ════════════`);
  const { p, posts } = await session(locale);
  check(`[${locale}] signed in`, !p.url().includes('/login'));

  await p.goto(`${BASE}/lesson/m1.l1`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(7000);
  const at = await advanceTo(p, 1);
  check(`[${locale}] on the prediction page`, at === 1, `page ${at}`);
  await p.screenshot({ path: `${SHOTS}/A-${locale}-1-block.png` });

  /* The distractor WITH quote marks. `2 + 2` is the correct answer. */
  const page = await activePage(p);
  const opt = page.locator('button').filter({ hasText: /^\s*"2 \+ 2"\s*$/ }).first();
  const picked = await opt.count() > 0;
  if (picked) { await opt.click(); await p.waitForTimeout(1500); }
  check(`[${locale}] selected the quoted (wrong) option`, picked);

  const btn = p.getByRole('button', { name: /^(Тексеру|Проверить)$/ }).first();
  const hasBtn = await btn.count() > 0;
  if (hasBtn) { await btn.click(); await p.waitForTimeout(9000); }
  check(`[${locale}] Check was clickable`, hasBtn);
  await p.screenshot({ path: `${SHOTS}/A-${locale}-2-wrong.png` });

  await askNova(p, question);
  await p.screenshot({ path: `${SHOTS}/A-${locale}-3-answer.png` });

  const sent = posts[posts.length - 1] ?? {};
  console.log(`REQUEST → ${JSON.stringify({ blockId: sent.blockId, draft: sent.draft, lastRun: sent.lastRun })}`);
  check(`[${locale}] block is m1.l1.b2`, sent.blockId === 'm1.l1.b2', sent.blockId);
  check(`[${locale}] request carries the right locale`, sent.locale === locale, String(sent.locale));
  check(`[${locale}] request carries the draft`, sent.draft != null);
  check(`[${locale}] draft names the selected option`, sent.draft?.selectedOptionId === '"2 + 2"', String(sent.draft?.selectedOptionId));

  /* The settled half: the server's own record of the graded attempt. Read from
     the database rather than from the page, because the whole point of the
     trust split is that this number is not the browser's to claim. */
  const settled = execSync(`psql ${DB} -tAc "select count(*) from learning_events where event_name='verdict_received'"`).toString().trim();
  check(`[${locale}] the wrong answer was graded and recorded`, Number(settled) > 0, `${settled} verdict_received row(s)`);

  const reply = await replyTail(p, question);
  console.log(`REPLY → ${reply.slice(0, 400).replace(/\n+/g, ' | ')}`);
  const asksForScreen = /қандай қате|не көрдің|не күткен|не деп ойладың|қандай нәтиже күт|что ты уже попробовал|какого результата ждал|что ты ожидал|чего ты ждал|не смог составить|толық жауап құрастыра алмадым|пока не понимаю, почему|не понимаю, почему|әлі көріп тұрған жоқпын|не вижу|көріп тұрған жоқпын/i.test(reply);
  check(`[${locale}] does NOT ask the learner to describe the screen`, !asksForScreen);
  check(`[${locale}] reply is grounded in this task`, /тырнақша|кавыч|"2 \+ 2"|print|жол|строк/i.test(reply));

  if (locale === 'kk') {
    const geom = await p.evaluate(() => {
      const root = document.querySelector('[style*="--sx-nova-w"]');
      const panels = [...document.querySelectorAll('aside,[role=dialog],[data-nova-panel]')]
        .map(e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) }; })
        .filter(r => r.w > 200 && r.h > 300);
      const card = document.querySelector('div[style*="translateX"]')?.parentElement?.parentElement;
      const cr = card?.getBoundingClientRect();
      return {
        novaW: root ? getComputedStyle(root).getPropertyValue('--sx-nova-w').trim() : '',
        panels, vw: innerWidth,
        card: cr ? { x: Math.round(cr.x), w: Math.round(cr.width) } : null,
      };
    });
    console.log('LAYOUT → ' + JSON.stringify(geom));
    check('Nova pane has a real width', geom.novaW !== '0px' && geom.novaW !== '', geom.novaW);
    check('Nova sits on the LEFT', geom.panels.some(r => r.x < geom.vw / 3));
    check('lesson card starts to the RIGHT of the Nova pane', (geom.card?.x ?? 0) > 300, JSON.stringify(geom.card));

  }
  await p.context().close();
}

console.log(`\n═══════════ ${pass} passed, ${fail} failed ═══════════`);
await B.close();
process.exit(fail > 0 ? 1 : 0);
