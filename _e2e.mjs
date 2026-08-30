import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const DB = 'postgres://localhost/solvex_e2e';
const q = (sql) => execSync(`psql ${DB} -tAc ${JSON.stringify(sql.replace(/\s+/g, ' ').trim())}`).toString().trim();
let pass = 0, fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`); }
  else { fail++; console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

/* The login route is rate limited per username (capacity 8, +4/min). This
   script signs four sessions in; clearing the bucket first keeps a rate-limit
   refusal from being reported as a product failure. */
execSync(`psql ${DB} -tAc "delete from rate_limit_bucket where bucket_key like 'login:%'"`);
/* Re-provision the E2E learner so each run starts from a clean slate: no
   submissions, no reviews, no events. Otherwise counts accumulate across runs
   and a correct system reads as a duplicate-row defect. */
execSync(`DATABASE_URL=${DB} npx tsx scripts/_e2e-student.ts`, { stdio: 'ignore' });

const B = await chromium.launch();
async function open() {
  const p = await (await B.newContext({ viewport: { width: 1440, height: 1100 } })).newPage();
  p.login = async (u, pw = 'solvex-demo-2026') => {
    /* The login route is rate limited per username (capacity 8, +4/min) and
       this script signs four sessions in. Retry with a pause — and refill the
       form each time, because a refused attempt re-renders it empty and a bare
       re-click would submit nothing. */
    for (let attempt = 1; attempt <= 5; attempt++) {
      await p.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
      await p.waitForSelector('input[type="password"]', { timeout: 60000 });
      let status = 0;
      const seen = (r) => { if (r.url().includes('/api/auth/login')) status = r.status(); };
      p.on('response', seen);
      const i = await p.$$('input');
      await i[0].fill(u); await i[1].fill(pw);
      await p.getByRole('button', { name: /Кіру|Войти/ }).click();
      await p.waitForTimeout(7000);
      p.off('response', seen);
      if (!p.url().includes('/login')) return true;
      console.log(`      login attempt ${attempt} for ${u}: api=${status}`);
      execSync(`psql ${DB} -tAc "delete from rate_limit_bucket where bucket_key like 'login:%'"`);
/* Re-provision the E2E learner so each run starts from a clean slate: no
   submissions, no reviews, no events. Otherwise counts accumulate across runs
   and a correct system reads as a duplicate-row defect. */
execSync(`DATABASE_URL=${DB} npx tsx scripts/_e2e-student.ts`, { stdio: 'ignore' });
      await p.waitForTimeout(3000);
    }
    return false;
  };
  p.ru = async () => {
    await p.goto('http://localhost:3000/teacher?class=grade-9a', { waitUntil: 'networkidle' });
    await p.waitForTimeout(3000);
    await p.getByRole('button', { name: 'Русский' }).click().catch(() => {});
    await p.waitForTimeout(2000);
  };
  return p;
}

const TEXT = 'E2E: время считал в целых минутах, граница ровно на 1050, «//» даёт целую часть от деления.';

/* ── 1. STUDENT: real browser, real session, real submit route ───────────── */
const student = await open();
check('student logs in', await student.login('e2e-review-student'));

const submitRes = await student.evaluate(async ({ text, sid }) => {
  const r = await fetch('/api/learning/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      lessonId: 'm1.assessment', blockId: 'm1.as.b3', submissionId: sid,
      answer: { kind: 'text', value: text },
    }),
  });
  return { status: r.status, body: await r.text() };
}, { text: TEXT, sid: randomUUID() });
check('submit route accepted the written answer', submitRes.status === 200, `status ${submitRes.status}`);

const persisted = q(`select s.answer->>'value' from learning_submissions s
  join learning_subject_aliases al on al.subject_id=s.subject_id
  join school_accounts a on a.user_id::text=al.alias_value
  where a.username='e2e-review-student' and s.block_id='m1.as.b3' and s.answer is not null
  order by s.settled_at desc limit 1`);
check('answer persisted verbatim', persisted === TEXT, persisted.slice(0, 50) + '…');

/* A student must not be able to invoke the teacher review write. */
const studentWrite = await student.evaluate(async () => {
  const r = await fetch('/api/teacher/class/grade-9a/review/00000000-0000-0000-0000-000000000000', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ submissionId: '00000000-0000-0000-0000-000000000000', blockId: 'm1.as.b3', disposition: 'reviewed' }),
  });
  return r.status;
});
check('student cannot invoke the review write', studentWrite === 403, `got ${studentWrite}`);

/* ── 2. TEACHER: the whole flow through the UI ───────────────────────────── */
const teacher = await open();
check('teacher logs in', await teacher.login('aigul'));
await teacher.ru();

const pendingCount = async (page) => {
  await page.goto('http://localhost:3000/teacher/assessments?class=grade-9a', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const m = (await page.innerText('main')).match(/Ждут проверки — (\d+)/);
  return m ? Number(m[1]) : -1;
};

const before = await pendingCount(teacher);
check('pending count is visible and non-zero', before > 0, `N = ${before}`);

/* Open OUR learner's row specifically. */
const row = teacher.locator('tr', { hasText: 'Аружан Е2Е' }).first();
check('the new submission appears in the queue', await row.count() > 0);
console.log('   row text:', (await row.innerText()).replace(/\n+/g, ' | '));
console.log('   row buttons:', JSON.stringify(await row.locator('button').allInnerTexts()));
await row.getByRole('button', { name: /Читать|Открыть/ }).click();
await teacher.waitForTimeout(3000);

const panelText = await teacher.innerText('dialog');
check('panel shows the exact submitted text', panelText.includes(TEXT));
check('panel shows the learner name', panelText.includes('Аружан Е2Е'));
check('panel leaks no Nova conversation', !/Nova|переписк/i.test(panelText));
check('panel leaks no reference solution', !panelText.includes('print("yes")'));

/* Mark it read. */
await teacher.getByRole('button', { name: 'Прочитано', exact: true }).first().click();
await teacher.waitForTimeout(2500);
const afterMark = await teacher.innerText('dialog');
check('panel shows the persisted decision', /Прочитано/.test(afterMark));
check('panel states the learner does not see it', /Ученик этого не видит/.test(afterMark));

const storedRow = q(`select disposition from human_reviews h
  join learning_subject_aliases al on al.subject_id=h.subject_id
  join school_accounts a on a.user_id::text=al.alias_value
  where a.username='e2e-review-student'`);
check('review row written server-side', storedRow === 'reviewed', storedRow);

const after = await pendingCount(teacher);
check('pending count fell by exactly one', after === before - 1, `${before} → ${after}`);

/* Refresh — still reviewed. */
await teacher.reload({ waitUntil: 'networkidle' });
await teacher.waitForTimeout(2500);
const afterReload = await teacher.innerText('main');
check('survives a refresh', afterReload.includes('Прочитано') && !new RegExp(`Ждут проверки — ${before}\\b`).test(afterReload));

/* Logout / login — still reviewed. */
const teacher2 = await open();
await teacher2.login('aigul');
await teacher2.ru();
const fresh = await pendingCount(teacher2);
check('survives a fresh session', fresh === after, `${fresh} vs ${after}`);

/* ── 3. needs_followup stays visible, and is not pending ─────────────────── */
const row2 = teacher2.locator('tr', { hasText: 'Аружан Е2Е' }).first();
await row2.getByRole('button', { name: /Читать|Открыть/ }).click();
await teacher2.waitForTimeout(3000);
await teacher2.getByRole('button', { name: 'Нужно обсудить', exact: true }).first().click();
await teacher2.waitForTimeout(2500);
const storedRow2 = q(`select disposition from human_reviews h
  join learning_subject_aliases al on al.subject_id=h.subject_id
  join school_accounts a on a.user_id::text=al.alias_value
  where a.username='e2e-review-student'`);
check('follow-up persisted', storedRow2 === 'needs_followup', storedRow2);

const rowCount = q(`select count(*) from human_reviews h
  join learning_subject_aliases al on al.subject_id=h.subject_id
  join school_accounts a on a.user_id::text=al.alias_value
  where a.username='e2e-review-student'`);
check('changing the decision left ONE row, not a history', rowCount === '1', rowCount);

await teacher2.keyboard.press('Escape');
await teacher2.waitForTimeout(500);
const afterFollow = await pendingCount(teacher2);
const page2 = await teacher2.innerText('main');
check('follow-up is not counted as pending', afterFollow === after, `${afterFollow} vs ${after}`);
check('follow-up stays visible in its own group', /Нужно обсудить — 1/.test(page2));
check('follow-up row still names the learner', /Аружан Е2Е/.test(page2));

/* ── 4. A foreign teacher can neither read nor mutate ────────────────────── */
const subj = q(`select al.subject_id from learning_subject_aliases al
  join school_accounts a on a.user_id::text=al.alias_value
  where a.username='e2e-review-student'`);
const foreign = await teacher2.evaluate(async (s) => {
  const g = await fetch(`/api/teacher/class/rival-only/review/${s}`);
  const p = await fetch(`/api/teacher/class/rival-only/review/${s}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ submissionId: s, blockId: 'm1.as.b3', disposition: 'reviewed' }),
  });
  return { get: g.status, post: p.status };
}, subj);
check('a class in another school is unreadable', foreign.get === 404, `GET ${foreign.get}`);
check('a class in another school is unwritable', foreign.post === 404, `POST ${foreign.post}`);

/* Bad input on a class the teacher DOES own. */
const bad = await teacher2.evaluate(async (s) => {
  const one = await fetch(`/api/teacher/class/grade-9a/review/${s}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ submissionId: s, blockId: 'm1.as.b3', disposition: 'excellent' }),
  });
  const two = await fetch(`/api/teacher/class/grade-9a/review/${s}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ submissionId: s, blockId: 'm1.as.b1', disposition: 'reviewed' }),
  });
  return { badDisposition: one.status, codingBlock: two.status };
}, subj);
check('a disposition outside the vocabulary is refused', bad.badDisposition === 400, `${bad.badDisposition}`);
check('a coding block cannot be marked reviewed', bad.codingBlock === 404, `${bad.codingBlock}`);

/* ── 5. The defects the adversarial pass found, verified fixed ──────────── */
const sub = q(`select s.submission_id from learning_submissions s
  join learning_subject_aliases al on al.subject_id=s.subject_id
  join school_accounts a on a.user_id::text=al.alias_value
  where a.username='e2e-review-student' and s.block_id='m1.as.b3' order by s.settled_at desc limit 1`);

/* A non-UUID submission id must be a 400, never a 500. */
const shape = await teacher2.evaluate(async (s) => {
  const r = await fetch(`/api/teacher/class/grade-9a/review/${s}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ submissionId: 'not-a-uuid', blockId: 'm1.as.b3', disposition: 'reviewed' }),
  });
  return r.status;
}, subj);
check('a malformed submission id is a 400, not a 500', shape === 400, `got ${shape}`);

/* Re-pressing the same disposition must not move the reviewer or the clock. */
const beforeRow = q(`select reviewed_by || '|' || reviewed_at from human_reviews h
  join learning_subject_aliases al on al.subject_id=h.subject_id
  join school_accounts a on a.user_id::text=al.alias_value
  where a.username='e2e-review-student'`);
await teacher2.evaluate(async ({ s, sub }) => {
  await fetch(`/api/teacher/class/grade-9a/review/${s}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ submissionId: sub, blockId: 'm1.as.b3', disposition: 'needs_followup' }),
  });
}, { s: subj, sub });
const afterRow = q(`select reviewed_by || '|' || reviewed_at from human_reviews h
  join learning_subject_aliases al on al.subject_id=h.subject_id
  join school_accounts a on a.user_id::text=al.alias_value
  where a.username='e2e-review-student'`);
check('re-pressing the same decision is a total no-op', beforeRow === afterRow, `${beforeRow.slice(0,20)}… vs ${afterRow.slice(0,20)}…`);

/* Six concurrent identical writes settle to one row. */
await teacher2.evaluate(async ({ s, sub }) => {
  await Promise.all(Array.from({ length: 6 }, () => fetch(`/api/teacher/class/grade-9a/review/${s}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ submissionId: sub, blockId: 'm1.as.b3', disposition: 'reviewed' }),
  })));
}, { s: subj, sub });
const n = q(`select count(*) from human_reviews where submission_id = '${sub}'`);
check('six concurrent writes leave one row', n === '1', n);

/* An unreadable submission must be openable, or the counter sticks. */
await teacher2.goto('http://localhost:3000/teacher/assessments?class=grade-9a', { waitUntil: 'networkidle' });
await teacher2.waitForTimeout(2500);
const legacyRow = teacher2.locator('tr', { hasText: 'Мадина Сейітова' }).first();
const openable = await legacyRow.getByRole('button', { name: /Открыть|Читать/ }).count();
check('a row with no stored text can still be opened', openable > 0);

/* The grade word is gone from the RU copy. */
const page3 = await teacher2.innerText('main');
check('no register-grade word heads the status column', !/Отметка/.test(page3));
check('the boundary sentence still denies a grade', /нет ни балла, ни оценки/.test(page3));

await B.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
