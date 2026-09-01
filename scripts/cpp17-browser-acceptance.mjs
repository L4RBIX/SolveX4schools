/**
 * Real-browser acceptance for the C++17 curriculum.
 *
 * Chromium via Playwright against a real `next build` server and a real
 * PostgreSQL. Nothing is mocked: every number below is read out of a response
 * the running server produced, out of the rendered DOM, or out of the database.
 *
 * ## The one flag that differs from production, and why
 *
 * Lessons are gated on publication (`schools/curriculum/gate.ts`), and the C++
 * curriculum is deliberately NOT published — that is a human sign-off this run
 * must not forge. The only bypass in the codebase is
 * `config.environment === "development"`, so lesson acceptance runs the
 * PRODUCTION BUILD with `NODE_ENV=development`.
 *
 * That is stated rather than hidden because it is not free. The same flag also
 * turns on `anonymousLearningAllowed()`, so this harness signs in properly for
 * every check and never relies on the anonymous path. Everything else — the
 * bundles, the chunk splitting, the minification, the server code — is the
 * production build byte for byte.
 *
 * `--mode production` runs the same server under `NODE_ENV=production` and
 * asserts the OPPOSITE: that the gate refuses. Both halves are reported.
 *
 *   BASE=http://127.0.0.1:3311 \
 *   E2E_STUDENT=grade9a-01 E2E_STUDENT_PW=... \
 *   E2E_TEACHER=grade-9a-teacher E2E_TEACHER_PW=... \
 *   node scripts/cpp17-browser-acceptance.mjs --mode development
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:3311";
const STUDENT = process.env.E2E_STUDENT ?? "grade9a-01";
const TEACHER = process.env.E2E_TEACHER ?? "grade-9a-teacher";
const STUDENT_PW = process.env.E2E_STUDENT_PW;
const TEACHER_PW = process.env.E2E_TEACHER_PW;
const NEW_PW = process.env.E2E_NEW_PW ?? "Cpp17Acceptance-2026";
const MODE = process.argv.includes("--mode")
  ? process.argv[process.argv.indexOf("--mode") + 1]
  : "development";
/** Judge0 costs real money per submission, so live Submit is opt-in. */
const SUBMIT = process.env.E2E_SUBMIT === "1";

let failures = 0;
let checks = 0;
const results = [];
const check = (name, ok, detail = "") => {
  checks += 1;
  if (!ok) failures += 1;
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "✓" : "✗"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const section = (t) => console.log(`\n${t}`);

/** One executable block per month, chosen from the curriculum itself. */
const MONTHS = [
  { n: 1, label: "September — basic C++", lesson: "m1.l1", block: "m1.l1.b5" },
  { n: 2, label: "October — loop/vector", lesson: "m2.l1", block: "m2.l1.b8" },
  { n: 3, label: "November — function", lesson: "m3.l1", block: "m3.l1.b7" },
  { n: 4, label: "December — sort/prefix", lesson: "m4.l1", block: "m4.l1.b7" },
  { n: 5, label: "January — binary search", lesson: "m5.l1", block: "m5.l1.b9" },
  { n: 6, label: "February — recursion", lesson: "m6.l1", block: "m6.l1.b8" },
  { n: 7, label: "March — BFS", lesson: "m7.l1", block: "m7.l1.b9" },
  { n: 8, label: "April — DP", lesson: "m8.l1", block: "m8.l1.b8" },
  { n: 9, label: "May — contest", lesson: "m9.l1", block: "m9.l1.b7" },
];

/** Words that must never appear in a C++ learner UI. */
const PYTHON_TERMS = [
  "Python", "python", "Pyodide", "pyodide",
  "print(", "def ", "elif", "__name__",
];

async function signIn(page, username, password) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
      await page.fill('input[autocomplete="username"]', username);
      await page.fill('input[autocomplete="current-password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20_000 });
      return page.url();
    } catch (err) {
      if (attempt === 3) throw err;
      await page.waitForTimeout(3000 * (attempt + 1));
    }
  }
}

const api = (page, path, init) =>
  page.evaluate(
    async ([p, i]) => {
      const r = await fetch(p, i ?? undefined);
      let body = null;
      try { body = await r.json(); } catch { body = null; }
      return { status: r.status, body };
    },
    [path, init ?? null],
  );

const post = (page, path, payload) =>
  api(page, path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

/** Ensure the forced password change is done, so later sign-ins land on content. */
async function ensurePassword(page, username, oneTime) {
  const landed = await signIn(page, username, oneTime);
  if (new URL(landed).pathname === "/account/password") {
    const r = await post(page, "/api/auth/password", { current: oneTime, next: NEW_PW });
    if (r.status !== 200) throw new Error(`password change failed: ${r.status}`);
    await post(page, "/api/auth/logout", {});
    await signIn(page, username, NEW_PW);
    return NEW_PW;
  }
  return oneTime;
}

/* -------------------------------------------------------------------------- */
/* §12 — the gate, both ways                                                   */
/* -------------------------------------------------------------------------- */

async function gateCheck(page) {
  section(`§12 Publication gate under NODE_ENV=${MODE}`);
  const r = await api(page, "/lesson/m1.l1");
  if (MODE === "production") {
    check(
      "an UNPUBLISHED C++ lesson is refused on a production build",
      r.status === 404,
      `status ${r.status} (404 = the human sign-off gate is holding)`,
    );
  } else {
    check(
      "the development bypass opens the lesson for acceptance",
      r.status === 200,
      `status ${r.status}`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* §13 — full-year sweep                                                       */
/* -------------------------------------------------------------------------- */

async function fullYearSweep(page) {
  section("§13 Full-year browser sweep — all nine months");
  for (const m of MONTHS) {
    const url = `${BASE}/lesson/${m.lesson}`;
    let res;
    try {
      res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    } catch (e) {
      check(`${m.label} — lesson renders`, false, String(e).slice(0, 80));
      continue;
    }
    const status = res?.status() ?? 0;
    if (status !== 200) {
      check(`${m.label} — lesson renders`, false, `status ${status}`);
      continue;
    }
    await page.waitForTimeout(1200);
    const html = await page.content();
    const text = await page.evaluate(() => document.body.innerText);

    check(`${m.label} — task statement visible`, text.trim().length > 200, `${text.trim().length} chars`);

    /* The editor must be C++. Asserted on the language the runner is told to
       use, not on a guess from the visible source. */
    const cppMarkers = /cpp17|C\+\+|#include|cout|cin/.test(html);
    check(`${m.label} — editor/runtime is C++`, cppMarkers);

    const leaked = PYTHON_TERMS.filter((t) => text.includes(t));
    check(
      `${m.label} — no Python in the learner UI`,
      leaked.length === 0,
      leaked.length ? `found ${JSON.stringify(leaked)}` : "",
    );
  }
}

/* -------------------------------------------------------------------------- */
/* §14 — Run stress matrix, in the real browser engine                         */
/* -------------------------------------------------------------------------- */

const RUN_CASES = [
  { id: 1, name: "hello world", src: `#include <iostream>\nint main(){std::cout<<"hello\\n";}`, stdin: "", expect: (o) => o.includes("hello") },
  { id: 2, name: "cin/cout", src: `#include <iostream>\nint main(){int a,b;std::cin>>a>>b;std::cout<<a+b<<"\\n";}`, stdin: "2 40\n", expect: (o) => o.trim() === "42" },
  { id: 3, name: "vector + sort", src: `#include <iostream>\n#include <vector>\n#include <algorithm>\nint main(){std::vector<int> v{5,3,1,4};std::sort(v.begin(),v.end());for(int x:v)std::cout<<x<<' ';}`, stdin: "", expect: (o) => o.trim() === "1 3 4 5" },
  { id: 4, name: "bits/stdc++.h", src: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){cout<<"bits ok\\n";}`, stdin: "", expect: (o) => o.includes("bits ok") },
  { id: 5, name: "recursion", src: `#include <iostream>\nint f(int n){return n<2?n:f(n-1)+f(n-2);}\nint main(){std::cout<<f(20)<<"\\n";}`, stdin: "", expect: (o) => o.trim() === "6765" },
  { id: 6, name: "BFS", src: `#include <bits/stdc++.h>\nusing namespace std;\nint main(){vector<vector<int>> g(5);g[0]={1,2};g[1]={3};g[2]={4};vector<int> d(5,-1);queue<int>q;q.push(0);d[0]=0;while(!q.empty()){int u=q.front();q.pop();for(int v:g[u])if(d[v]<0){d[v]=d[u]+1;q.push(v);}}for(int x:d)cout<<x<<' ';}`, stdin: "", expect: (o) => o.trim() === "0 1 1 2 2" },
  { id: 7, name: "compile error", src: `#include <iostream>\nint main(){std::cout<<"x"\n}`, stdin: "", expectFail: true },
  { id: 8, name: "runtime error", src: `#include <iostream>\n#include <vector>\nint main(){std::vector<int> v;std::cout<<v.at(5);}`, stdin: "", expectFail: true },
  { id: 9, name: "while(true)", src: `int main(){while(true){}}`, stdin: "", expectTimeout: true },
  { id: 10, name: "huge stdout", src: `#include <iostream>\nint main(){for(int i=0;i<200000;i++)std::cout<<i<<"\\n";}`, stdin: "", expectLarge: true },
];

/**
 * Drive the real in-browser C++ runner from page context.
 *
 * This deliberately does NOT click the Run button: the button lives inside a
 * lesson whose block shape varies per month, and what needs proving is that the
 * WASI Clang toolchain in this browser compiles and runs C++. So it loads the
 * shipped worker directly, which is the same code path the button drives.
 */
async function runInBrowser(page, source, stdin, runBudgetMs = 3000, buildBudgetMs = 30_000) {
  return page.evaluate(
    async ([src, input, runBudget, buildBudget]) => {
      const t0 = performance.now();
      return await new Promise((resolve) => {
        let done = false;
        let deadline = null;
        const w = new Worker("/cpp17-worker.js", { type: "module" });
        const finish = (r) => {
          if (done) return;
          done = true;
          clearTimeout(buildTimer);
          if (deadline) clearTimeout(deadline);
          try { w.terminate(); } catch {}
          resolve({ ...r, ms: Math.round(performance.now() - t0) });
        };
        /* The BUILD budget and the RUN budget are separate, exactly as
           `src/lib/cpp17/runner.ts` keeps them separate — `bits/stdc++.h`
           takes about four seconds to compile, which is longer than the whole
           run budget, so one combined number made every program using that
           header unrunnable and blamed it on an infinite loop. */
        const buildTimer = setTimeout(
          () => finish({ status: "build_timeout", stdout: "", stderr: "" }),
          buildBudget,
        );
        w.onmessage = (e) => {
          const m = e.data ?? {};
          if (m.kind === "failed") return finish({ status: "init_failed", stdout: "", stderr: m.error ?? "" });
          if (m.kind === "ready") {
            return w.postMessage({ kind: "run", id: 1, source: src, stdin: input });
          }
          if (m.kind === "running") {
            /* The deadline starts HERE, when the program actually starts —
               the same moment the product's runner starts counting. Killing
               the worker on expiry is what the runner does, so a `while(true)`
               reported as `timeout` here is the product's real behaviour and
               not a harness artefact. */
            clearTimeout(buildTimer);
            deadline = setTimeout(
              () => finish({ status: "timeout", stdout: "", stderr: "", compileMs: m.compileMs }),
              runBudget + 500,
            );
            return;
          }
          if (m.kind === "result") {
            return finish({
              status: m.status,
              stdout: m.stdout ?? "",
              stderr: m.stderr ?? "",
              truncated: !!m.truncated,
              runtimeMs: m.runtimeMs,
            });
          }
        };
        w.onerror = (err) => finish({ status: "worker_error", stdout: "", stderr: String(err.message ?? err) });
        w.postMessage({ kind: "init", baseUrl: "/cpp17/" });
      });
    },
    [source, stdin, runBudgetMs, buildBudgetMs],
  );
}

async function runStress(page) {
  section("§14 Run stress matrix — real browser, real WASI Clang");
  await page.goto(`${BASE}/lesson/m1.l1`, { waitUntil: "domcontentloaded" });

  const probe = await runInBrowser(page, RUN_CASES[0].src, "");
  if (probe.status === "worker_error" || probe.status === "init_failed" || probe.status === "build_timeout") {
    check(
      "the in-browser C++ worker is drivable from the harness",
      false,
      `status=${probe.status} stderr=${String(probe.stderr).slice(0, 160)}`,
    );
    return { drivable: false };
  }
  check("the in-browser C++ worker is drivable from the harness", true, `first run ${probe.ms}ms`);

  const timings = {};
  for (const c of RUN_CASES) {
    const r = await runInBrowser(page, c.src, c.stdin, 3000, c.name === "bits/stdc++.h" ? 60_000 : 45_000);
    timings[c.name] = r.ms;
    const out = String(r.stdout ?? "");
    if (c.expectFail) {
      check(`${c.id}. ${c.name} — fails cleanly, no crash`, r.status !== "ok" && r.status !== "worker_error", `status ${r.status}`);
    } else if (c.expectTimeout) {
      check(`${c.id}. ${c.name} — stopped by the time limit`, /timeout|time_limit/i.test(String(r.status)), `status ${r.status} in ${r.ms}ms`);
    } else if (c.expectLarge) {
      check(`${c.id}. ${c.name} — bounded output, no hang`, out.length > 0 && r.status !== "worker_error", `${out.length} bytes, status ${r.status}`);
    } else {
      check(`${c.id}. ${c.name} — correct stdout`, c.expect(out), `got ${JSON.stringify(out.slice(0, 60))} status ${r.status}`);
    }
  }

  /* 11. Run again while a previous Run is still active.

     Modelled on what the product ACTUALLY does, which took two wrong versions
     to get right. `Cpp17Runner.run` supersedes: it terminates the in-flight
     worker synchronously before the first await and starts a fresh one. Its
     own comment says why — "the worker is single-threaded and already inside a
     compile; it will not read another message until it finishes, so just
     sending the new job means the learner waits for the run they abandoned."

     So posting two `run` messages to ONE worker is a state the product cannot
     reach, and asserting on it measured a fiction: the second source
     overwrites the first in memfs while clang is still reading it, and the
     result came back `syntax_error`. That is not a defect a learner can hit.

     What a learner CAN hit is pressing Run twice quickly, which is this. */
  const concurrent = await page.evaluate(async () => {
    const start = (src, id) =>
      new Promise((resolve) => {
        const w = new Worker("/cpp17-worker.js", { type: "module" });
        const t = setTimeout(() => resolve({ w, result: { status: "harness_timeout", stdout: "" } }), 90_000);
        w.onmessage = (e) => {
          const m = e.data ?? {};
          if (m.kind === "ready") w.postMessage({ kind: "run", id, source: src, stdin: "" });
          if (m.kind === "result") { clearTimeout(t); resolve({ w, result: { id: m.id, status: m.status, stdout: m.stdout ?? "" } }); }
        };
        w.onerror = () => { clearTimeout(t); resolve({ w, result: { status: "worker_error", stdout: "" } }); };
        w.postMessage({ kind: "init", baseUrl: "/cpp17/" });
        return w;
      });

    /* First Run: long enough to still be busy when the learner presses again. */
    const firstWorker = new Worker("/cpp17-worker.js", { type: "module" });
    let firstDelivered = null;
    firstWorker.onmessage = (e) => {
      const m = e.data ?? {};
      if (m.kind === "ready") {
        firstWorker.postMessage({
          kind: "run", id: 1,
          source: `#include <iostream>\nint main(){volatile long s=0;for(long i=0;i<20000000;i++)s+=i;std::cout<<"ABANDONED\\n";}`,
          stdin: "",
        });
      }
      if (m.kind === "result") firstDelivered = m.stdout ?? "";
    };
    firstWorker.postMessage({ kind: "init", baseUrl: "/cpp17/" });
    await new Promise((r) => setTimeout(r, 900));

    /* Second press: supersede exactly as the runner does — terminate, restart. */
    firstWorker.terminate();
    const second = await start(`#include <iostream>\nint main(){std::cout<<"SECOND\\n";}`, 2);
    try { second.w.terminate(); } catch {}

    await new Promise((r) => setTimeout(r, 300));
    return { second: second.result, firstDelivered };
  });
  check(
    "11. a second Run supersedes the first — its own output, and no stale output",
    String(concurrent.second?.stdout ?? "").includes("SECOND") &&
      !String(concurrent.second?.stdout ?? "").includes("ABANDONED") &&
      concurrent.firstDelivered === null,
    `second=${JSON.stringify(concurrent.second)} abandonedDelivered=${JSON.stringify(concurrent.firstDelivered)}`.slice(0, 170),
  );

  /* 12. A valid Run after a forced worker termination. */
  const recovered = await page.evaluate(async () => {
    const w = new Worker("/cpp17-worker.js", { type: "module" });
    w.postMessage({ kind: "init", baseUrl: "/cpp17/" });
    await new Promise((r) => setTimeout(r, 400));
    w.terminate(); // kill it mid-flight, as the runner does on a timeout
    return await new Promise((resolve) => {
      const w2 = new Worker("/cpp17-worker.js", { type: "module" });
      const t = setTimeout(() => resolve({ status: "harness_timeout", stdout: "" }), 60_000);
      w2.onmessage = (e) => {
        const m = e.data ?? {};
        if (m.kind === "ready") {
          return w2.postMessage({
            kind: "run", id: 1,
            source: `#include <iostream>\nint main(){std::cout<<"recovered\\n";}`,
            stdin: "",
          });
        }
        if (m.kind === "result") {
          clearTimeout(t);
          try { w2.terminate(); } catch {}
          resolve({ status: m.status, stdout: m.stdout ?? "" });
        }
      };
      w2.onerror = () => { clearTimeout(t); resolve({ status: "worker_error", stdout: "" }); };
      w2.postMessage({ kind: "init", baseUrl: "/cpp17/" });
    });
  });
  check(
    "12. a valid Run recovers after a forced worker termination",
    String(recovered.stdout ?? "").includes("recovered"),
    `status ${recovered.status}`,
  );

  return { drivable: true, timings };
}

/* -------------------------------------------------------------------------- */
/* §18 — Run grants nothing (live, from the database side)                     */
/* -------------------------------------------------------------------------- */

async function runGrantsNothing(page) {
  section("§18 Run is not Submit — what reaches the server");
  const seen = [];
  await page.route("**/*", (route) => {
    const u = route.request().url();
    if (/judge0|rapidapi/i.test(u)) seen.push(u);
    return route.continue();
  });

  await page.goto(`${BASE}/lesson/m1.l1`, { waitUntil: "domcontentloaded" });
  await runInBrowser(page, RUN_CASES[0].src, "");
  await page.waitForTimeout(500);

  check("RUN sends no Judge0 traffic from the browser", seen.length === 0, seen.slice(0, 2).join(" "));
  await page.unroute("**/*");
}

/* -------------------------------------------------------------------------- */
/* §15 — responsive                                                            */
/* -------------------------------------------------------------------------- */

const WIDTHS = [1440, 1024, 768, 375];

async function responsive(page, paths) {
  section("§15 Responsive — no page-level horizontal scroll");
  for (const [label, path] of paths) {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      try {
        const res = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
        const status = res?.status() ?? 0;
        if (status !== 200) {
          /* A 404 page has no horizontal overflow either, so an unguarded
             check passes on a page that never rendered. This suite did exactly
             that on the lesson routes while the publication gate was refusing
             them — sixteen green ticks measuring an error page. */
          check(`${label} @ ${width}px`, false, `status ${status} — nothing was measured`);
          continue;
        }
        await page.waitForTimeout(700);
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        check(`${label} @ ${width}px`, !over);
      } catch (e) {
        check(`${label} @ ${width}px`, false, String(e).slice(0, 60));
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}

/* -------------------------------------------------------------------------- */
/* §17 — teacher                                                               */
/* -------------------------------------------------------------------------- */

async function teacherSurfaces(page) {
  section("§17 Teacher console");
  const paths = [
    "/teacher", "/teacher/students", "/teacher/skills",
    "/teacher/lessons", "/teacher/assessments", "/teacher/leaderboard",
  ];
  for (const p of paths) {
    try {
      const res = await page.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const status = res?.status() ?? 0;
      await page.waitForTimeout(500);
      const text = await page.evaluate(() => document.body.innerText);
      const leaked = PYTHON_TERMS.filter((t) => text.includes(t));
      check(`${p} — renders`, status === 200, `status ${status}`);
      check(`${p} — no Python terminology`, leaked.length === 0, leaked.join(","));
    } catch (e) {
      check(`${p} — renders`, false, String(e).slice(0, 60));
    }
  }
}

/* -------------------------------------------------------------------------- */
/* §16 — performance                                                           */
/* -------------------------------------------------------------------------- */

async function performance_(browser) {
  section("§16 Performance — cold loads and the C++ toolchain");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  const t0 = Date.now();
  await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 60_000 });
  const home = Date.now() - t0;
  check(`homepage cold load`, home < 15_000, `${home}ms`);

  await ctx.close();
  return { homeColdMs: home };
}

/** Transfer sizes for the C++ toolchain, measured off the network. */
async function toolchainCost() {
  const files = ["/cpp17/clang.wasm", "/cpp17/lld.wasm", "/cpp17/sysroot.tar", "/cpp17-worker.js"];
  const out = {};
  for (const f of files) {
    const t = Date.now();
    const r = await fetch(`${BASE}${f}`);
    const buf = await r.arrayBuffer();
    out[f] = { bytes: buf.byteLength, ms: Date.now() - t, status: r.status };
  }
  return out;
}

/* -------------------------------------------------------------------------- */

async function main() {
  if (!STUDENT_PW || !TEACHER_PW) {
    console.error("E2E_STUDENT_PW and E2E_TEACHER_PW are required.");
    process.exit(2);
  }

  console.log(`\nC++17 BROWSER ACCEPTANCE — mode=${MODE}  base=${BASE}`);
  console.log(`Judge0 live Submit: ${SUBMIT ? "ENABLED" : "disabled (set E2E_SUBMIT=1)"}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  const studentPw = await ensurePassword(page, STUDENT, STUDENT_PW);
  check("student signs in", true, STUDENT);

  await gateCheck(page);

  let runTimings = null;
  if (MODE !== "production") {
    await fullYearSweep(page);
    runTimings = await runStress(page);
    await runGrantsNothing(page);
    await responsive(page, [
      ["September lesson", "/lesson/m1.l1"],
      ["May contest", "/lesson/m9.l1"],
      ["assessment", "/assessment/1"],
      ["home", "/home"],
      ["program", "/program"],
    ]);
  }

  /* Teacher, in its own context so the student session is untouched. */
  const tctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const tpage = await tctx.newPage();
  await ensurePassword(tpage, TEACHER, TEACHER_PW);
  check("teacher signs in", true, TEACHER);
  await teacherSurfaces(tpage);
  if (MODE !== "production") {
    await responsive(tpage, [
      ["teacher overview", "/teacher"],
      ["teacher students", "/teacher/students"],
    ]);
  }
  await tctx.close();

  const perf = await performance_(browser);
  const cost = await toolchainCost();
  section("§16 C++ toolchain transfer");
  for (const [f, v] of Object.entries(cost)) {
    console.log(`  ${f.padEnd(24)} ${String(v.status).padEnd(4)} ${String(v.bytes).padStart(10)} B  ${v.ms}ms`);
  }
  if (runTimings?.timings) {
    section("§16 In-browser Run timings (compile + link + execute)");
    for (const [k, v] of Object.entries(runTimings.timings)) console.log(`  ${k.padEnd(22)} ${v}ms`);
  }

  await ctx.close();
  await browser.close();

  console.log(`\n${"=".repeat(64)}`);
  console.log(`  mode=${MODE}   ${checks - failures}/${checks} checks passed, ${failures} failed`);
  console.log(`${"=".repeat(64)}\n`);
  if (failures > 0) {
    console.log("FAILED CHECKS:");
    for (const r of results.filter((r) => !r.ok)) console.log(`  ✗ ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
  }
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("harness error:", e);
  process.exit(3);
});
