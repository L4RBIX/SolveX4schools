import "server-only";
import { CPP_RUNTIME } from "@schools/execution/cpp-runtime";

/**
 * Server configuration.
 *
 * Every secret is read here and nowhere else, and none of them carries a
 * `NEXT_PUBLIC_` prefix. That is not a convention — it is the mechanism. A
 * `NEXT_PUBLIC_` variable is inlined into the client bundle at build time, so
 * prefixing one to "make something work" ships it to every browser
 * permanently, including the ones belonging to fourteen-year-olds who will
 * absolutely open DevTools.
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

/**
 * A whole number from the environment, or the default.
 *
 * `Number(env(...) ?? 60)` is the pattern used above and it is fine for the
 * values that already exist, because they are read once by code that treats
 * `NaN` as "no limit". The judge's knobs are different: a `NaN` poll interval is
 * a busy loop against a metered API, and a `NaN` concurrency bound is a bound of
 * nothing. So a value that is not a positive integer is a TYPO, and a typo takes
 * the default rather than the operator's intent.
 */
function intEnv(name: string, fallback: number): number {
  const raw = env(name);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/** The same, for a knob whose absence is meaningful rather than a default. */
function optionalIntEnv(name: string): number | undefined {
  const raw = env(name);
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/**
 * The RapidAPI host, read once.
 *
 * Above `config` because two fields need it — the `x-rapidapi-host` header and
 * the default base URL — and reading the variable twice is how they end up
 * disagreeing after someone edits one of them.
 */
const JUDGE0_HOST = env("JUDGE0_RAPIDAPI_HOST") ?? "judge0-ce.p.rapidapi.com";

export const config = {
  /** Where the PGlite data directory lives. Ignored when DATABASE_URL is set. */
  dataDir: env("LEARNING_DATA_DIR") ?? ".data/learning",

  /** Set in production. Its presence selects the Postgres driver. */
  databaseUrl: env("DATABASE_URL"),

  environment: ((): "production" | "preview" | "development" => {
    const v = env("VERCEL_ENV") ?? env("NODE_ENV");
    if (v === "production") return "production";
    if (v === "preview") return "preview";
    return "development";
  })(),

  /** Signer and verifier must hold the same value. */
  attestationSecret: env("LEARNING_ATTESTATION_SECRET"),

  /** Guards the cron entry point to the reducer. */
  cronSecret: env("LEARNING_CRON_SECRET"),

  sweep: {
    /**
     * In-process interval, and it defaults OFF on a serverless host.
     *
     * `!== "false"` meant on unless somebody remembered to turn it off, and
     * nobody had: on Vercel a lambda is created for a request and frozen after
     * it, so a twenty-second interval fires zero times while every warm
     * instance carries its own copy of a job meant to run once. The default
     * that fits the platform is the platform's own answer — `VERCEL` is set in
     * every build and at runtime — and an operator can still say either word
     * explicitly.
     *
     * Nothing depends on it. The sweep is request-driven through `after()`, so
     * without an interval the projections lag rather than being wrong, and
     * `/api/cron` is the scheduled backstop.
     */
    inProcess:
      env("LEARNING_SWEEP_IN_PROCESS") === "true" ||
      (env("LEARNING_SWEEP_IN_PROCESS") !== "false" && !env("VERCEL")),
    intervalMs: Number(env("LEARNING_SWEEP_INTERVAL_MS") ?? 20_000),
  },

  nova: {
    /** `echo` needs no credentials and is the default, so the product runs offline. */
    provider: env("NOVA_PROVIDER") ?? "echo",
    /**
     * Kill switch. Independent of the credential: a school that wants the tutor
     * off for a week of assessments should not have to delete a secret to do it.
     */
    enabled: env("NOVA_ENABLED") !== "false",
    apiKey: env("DEEPSEEK_API_KEY"),
    baseUrl: env("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com",
    /**
     * The model, and a corrected default.
     *
     * This was `deepseek-chat`, which DeepSeek **retired on 2026-07-24**. It no
     * longer resolves — it returns an error rather than falling back — so the
     * first thing that would have happened after adding a real API key is that
     * every single Nova request failed upstream, while the config test suite
     * went on passing because nothing here had ever been checked against the
     * provider's own documentation.
     *
     * `deepseek-v4-flash` is what `deepseek-chat` was aliased to during the
     * migration window, and it is the cheap tier: a 14-year-old asking why
     * their `if` does not fire does not need the reasoning model.
     * See `docs/nova/DEEPSEEK_SETUP.md`.
     */
    model: env("DEEPSEEK_MODEL") ?? "deepseek-v4-flash",
    /**
     * Thinking mode, off.
     *
     * V4 enables it by default at `high` effort, and reasoning tokens bill as
     * output. For a reply capped at six sentences that is most of the cost and
     * most of the latency, spent on a chain of thought the learner never sees
     * and the hint ladder already decided the shape of.
     */
    thinking: env("DEEPSEEK_THINKING") === "true",
    requestTimeoutMs: Number(env("NOVA_REQUEST_TIMEOUT_MS") ?? 30_000),
    maxOutputTokens: Number(env("NOVA_MAX_OUTPUT_TOKENS") ?? 500),

    /**
     * Ceilings.
     *
     * Per learner where the unit is a request, per deployment where the unit is
     * money. A runaway loop in one browser must not be able to spend the
     * school's whole month, and a class of eighteen must not be able to either.
     * Zero disables a limit; the default is a real number rather than zero so
     * that forgetting to configure one is the safe direction.
     */
    dailyRequestLimit: Number(env("NOVA_DAILY_REQUEST_LIMIT") ?? 60),
    monthlyInputTokenLimit: Number(env("NOVA_MONTHLY_INPUT_TOKEN_LIMIT") ?? 20_000_000),
    monthlyOutputTokenLimit: Number(env("NOVA_MONTHLY_OUTPUT_TOKEN_LIMIT") ?? 4_000_000),
    monthlyCostLimitUsd: Number(env("NOVA_MONTHLY_COST_LIMIT_USD") ?? 25),

    /**
     * Peak prices, deliberately.
     *
     * DeepSeek charges half rate off-peak; peak is 01:00–04:00 and 06:00–10:00
     * UTC, which is 06:00–09:00 and 11:00–15:00 in Almaty — the school day. So
     * peak IS the normal case here, and budgeting at the off-peak rate would
     * put the cap at roughly twice the money it claims to be.
     * v4-flash, cache miss: $0.44 / Mtok in, $1.32 / Mtok out.
     */
    inputUsdPerMTok: Number(env("DEEPSEEK_INPUT_USD_PER_MTOK") ?? 0.44),
    outputUsdPerMTok: Number(env("DEEPSEEK_OUTPUT_USD_PER_MTOK") ?? 1.32),
  },

  /**
   * The pilot's single school and class.
   *
   * A placeholder for enrolment, and deliberately a crude one: every subject is
   * scoped to this class on creation so the teacher projection has real data to
   * read. When enrolment exists, scope comes from the roster and these
   * disappear — nothing downstream reads them directly.
   */
  pilot: {
    schoolId: env("SCHOOL_ID") ?? "pilot-school",
    classId: env("CLASS_ID") ?? "grade-9a",
  },

  exec: {
    /**
     * `local` runs a subprocess; `piston` calls a self-hosted judge;
     * `judge0_rapidapi` rents one through RapidAPI; `none` declares that this
     * deployment has no trusted judge at all.
     *
     * `none` is a supported state, not a broken one, and that is new. Before
     * the browser could compile there was no such thing as a deployment
     * without a judge — every code task simply failed. Now local Run works
     * without any server judge whatsoever, so a school can genuinely operate
     * with `none`: learners write code, run it, see output, iterate. What they
     * cannot do is produce evidence, and the product has to say that out loud
     * rather than quietly grading with a browser result.
     */
    provider: env("EXEC_PROVIDER") ?? "local",
    pistonUrl: env("PISTON_URL"),

    /**
     * Judge0 CE, rented through RapidAPI. Only read when
     * `EXEC_PROVIDER=judge0_rapidapi`.
     *
     * The key is a secret like every other one in this file: server-side,
     * unprefixed, header-only, and it never reaches a React prop, a client
     * bundle or a browser network call. The browser must never contact
     * `judge0-ce.p.rapidapi.com` at all — RUN is the browser's own compiler and
     * SUBMIT goes through our own route — so RapidAPI never needs to appear in
     * a future `connect-src` either.
     *
     * See `docs/infrastructure/JUDGE0_RAPIDAPI_AUDIT.md`, and note the
     * residency consequence recorded in `docs/CODE_EXECUTION_DECISION.md`:
     * this provider sends learner source code out of Kazakhstan.
     */
    judge0: {
      apiKey: env("JUDGE0_RAPIDAPI_KEY"),
      host: JUDGE0_HOST,
      /* Derived from the host by default so there is one thing to change, and
         overridable for a self-hosted or proxied Judge0 that still speaks the
         same API. */
      /* Both spellings accepted, and the longer one wins.
         `JUDGE0_RAPIDAPI_BASE_URL` is the name in the integration brief and is
         what an operator will paste; `JUDGE0_BASE_URL` was the shorter name
         this file was first written with. Accepting both costs one `??` and
         removes the failure where someone sets the documented variable, sees
         it ignored, and has no way to tell — the default silently works for
         the default host, so the mistake would only surface on a custom one. */
      baseUrl:
        env("JUDGE0_RAPIDAPI_BASE_URL") ?? env("JUDGE0_BASE_URL") ?? `https://${JUDGE0_HOST}`,
      /**
       * Skip language discovery and use this id.
       *
       * `undefined` — the normal case — means the provider asks the judge which
       * C++ it has and refuses anything older than GCC 11. An id hardcoded from
       * a blog post is how a submission ends up on GCC 7, compiling as C++14
       * and rejecting the syntax the course teaches; an id pinned deliberately
       * by an operator is a decision, and this is where it goes.
       *
       * Pinning it also turns OFF the standard check, because the check is part
       * of discovery. An operator who sets this owns the question of whether
       * the id they chose defaults to `gnu++17` — this plan refuses
       * `compiler_options`, so there is no second chance to ask for it.
       */
      languageId: optionalIntEnv("JUDGE0_LANGUAGE_ID"),
      /**
       * How many submissions this process may have in flight at once.
       *
       * ## Why it was 2, and why 2 was the wrong answer to the right question
       *
       * It was low because the plan's ceiling was unknown and the safe
       * direction for an unknown ceiling is well under it. That reasoning is
       * still sound; what it missed is that **being conservative about spend
       * and being conservative about capacity are opposite settings of the same
       * knob**, and this one was doing both jobs badly.
       *
       * The arithmetic it produced: served-inside-the-queue-wait is
       * `limit × ⌊queueWait / batchTime⌋`. At 2, a 30-second wait and a
       * measured 2.7 s batch, one instance serves 22 of a class of 30 and tells
       * the other 8 that the judge was too busy — a fixed fraction of every
       * class, produced by our own configuration rather than by the judge.
       *
       * ## What is actually known about the plan
       *
       * From the live run in `docs/infrastructure/JUDGE0_LIVE_VALIDATION.md`,
       * against the subscribed key:
       *
       *   - `GET /config_info` reports `max_queue_size: 10000` and
       *     `enable_batched_submissions: true`. Concurrency is not the resource
       *     that is scarce here.
       *   - **Zero HTTP 429s** across 41 requests and 8 billable submissions.
       *   - `x-ratelimit-submissions-limit: 0` with `remaining: -2224` — which
       *     is not a ceiling being approached. It is an overage-billed plan.
       *     The scarce resource is MONEY, not permission.
       *
       * So the thing this knob was protecting is not shaped the way the comment
       * assumed, and money is now bounded where money can actually be bounded:
       * `config.submit.global`, a token bucket in the DATABASE, shared by every
       * instance. A per-process in-flight count cannot bound spend on a
       * platform that runs as many processes as it likes — it never could.
       *
       * ## So what does this bound now
       *
       * One instance's socket fan-out, and nothing more. Six in-flight batches
       * is at most 120 submissions queued at a judge whose queue holds 10,000,
       * and it serves a class of 30 in about 14 seconds at the measured batch
       * time. `maxConcurrentPerLearner` below is what stops one learner taking
       * all six.
       *
       * Raise it only with a measurement, and lower it the moment a 429 appears
       * — `judge0.rate_limited` in the ops counters is the number that would
       * say so, and it has never left zero.
       */
      maxConcurrentRequests: intEnv("JUDGE0_MAX_CONCURRENT_REQUESTS", 6),
      /**
       * How many of those slots ONE learner may hold at once.
       *
       * The gate above was pure FIFO with no notion of who was queueing, so a
       * browser loop posting submissions held both slots five to seven seconds
       * at a time and every classmate behind it was told the judge was
       * unavailable — an outage produced by one person, indistinguishable to
       * everyone else from the judge being down.
       *
       * One, and the number is not a tuning knob so much as a statement: a
       * learner has one Check in flight because a learner has one editor. The
       * fair-queueing in `RequestGate` skips a waiter whose key is already at
       * this cap and wakes the next admissible one instead, so a monopolist
       * loses nothing they were entitled to and everybody behind them keeps
       * their place.
       *
       * Raise it only if a legitimate path ever issues two concurrent batches
       * for one learner — `runBatch` chunking a >20-case block is the one
       * candidate, and no block in the curriculum reaches 20.
       */
      maxConcurrentPerLearner: intEnv("JUDGE0_MAX_CONCURRENT_PER_LEARNER", 1),
      /** First poll delay. Each poll is a billable request, so it backs off. */
      pollIntervalMs: intEnv("JUDGE0_POLL_INTERVAL_MS", 250),
      /**
       * How long a submission may wait for a slot before we give up on the judge.
       *
       * Sized against the function's own ceiling rather than picked. The submit
       * route declares `maxDuration = 60`; a batch that has been admitted needs
       * the judge's own worst case plus our polling overhead — five seconds of
       * CPU per case run in parallel by the batch endpoint, plus
       * `overheadBudgetMs` — so roughly 20 s must stay in reserve. Everything
       * left is queue.
       *
       * The old 30 s was neither: it gave up half a minute early inside a
       * function that was still going to run, and turned a learner who WOULD
       * have been served into "the judge was too busy". Waiting is a slower
       * Check; giving up early is a wrong answer about the infrastructure.
       */
      queueWaitMs: intEnv("JUDGE0_QUEUE_WAIT_MS", 38_000),
      /**
       * How much longer than the learner's own time limit we wait for an answer.
       *
       * It must be generous: our ceiling has to sit ABOVE the judge's, or we
       * give up first and a learner's genuinely slow program is recorded as the
       * judge not answering — losing the evidence December's month is about.
       */
      overheadBudgetMs: intEnv("JUDGE0_OVERHEAD_BUDGET_MS", 15_000),
      /**
       * `POST /submissions/batch`. Default **ON**, and MEASURED.
       *
       * This read `env("JUDGE0_BATCH") === "true"` — off unless asked for —
       * while the two things it was waiting on were unknown. Both have since
       * been measured against the subscribed plan with a real key: the batch
       * endpoints answer HTTP 201 with correct per-case results, and
       * `GET /config_info` reports `max_submission_batch_size: 20`.
       *
       * What it buys, on the median 8-case block and its own reference
       * solution, end to end through `runCases`: **9 746 ms → 2 668 ms** and 30
       * billable requests → 4, with the eight verdicts identical between the
       * two runs. The whole of that is scheduling — same cases, same judge,
       * same `schools/exec/checker.ts`. See `runBatch` in
       * `schools/exec/providers/judge0.ts` for the table and the caveats.
       *
       * `JUDGE0_BATCH=false` restores the old bounded-parallel path, which uses
       * no endpoint this deployment does not already depend on. It is the thing
       * to reach for if a future plan withdraws the batch endpoints, and it is
       * why the flag survives rather than being deleted.
       */
      batchEnabled: env("JUDGE0_BATCH") !== "false",
      /**
       * The plan's `max_submission_batch_size`, which is 20 on this one.
       *
       * A block declaring more cases than this is split across several batches
       * rather than sent as one the judge will refuse whole. Nothing in the
       * curriculum reaches it today — the largest block declares 18 — so this
       * is a guard against a content change and a plan change, not a tuning
       * knob.
       */
      maxBatchSize: intEnv("JUDGE0_MAX_BATCH_SIZE", 20),
    },
    /**
     * Compiler for the local dev provider.
     *
     * A developer's machine, not a judge: on macOS `g++` is Apple clang, which
     * is a different toolchain from the GCC that grades. That is acceptable
     * precisely because this provider never grades anybody — it refuses to run
     * in production — and the same variable name is what
     * `tests/support/cpp-run.ts` already reads, so one export overrides both.
     */
    cppBin: env("EXEC_CPP_BIN") ?? "g++",
    /**
     * The pinned learner runtime, re-exported from the one file that declares it.
     *
     * Deliberately NOT read from an environment variable, and that is the point:
     * a school operator who can change the compiler version from a dashboard can
     * make two months of a child's evidence incomparable without anyone noticing
     * or being able to say when it happened. The version is a programme decision
     * that ships with the build, so changing it is a commit and a rebuild — both
     * of which leave a trace.
     *
     * Consequence for `docs/deployment/PRODUCTION_ENVIRONMENT.md`: nothing. There
     * is no new variable for its table to document, which is the intended shape.
     */
    cpp: CPP_RUNTIME,
  },

  /**
   * Submit — what one learner, and what the whole deployment, may spend.
   *
   * ## Why the route needed its own budget
   *
   * `/api/learning/submit` was the one expensive route with no limiter at all.
   * `grep takeToken` found login, hint, explanation and exec/run; Submit — the
   * route that calls a metered third-party judge — was not among them. A
   * devtools loop posting fresh submission ids graded indefinitely, bounded
   * only by the judge's own concurrency gate, which meant it was bounded by how
   * many of everybody else's turns it could take.
   *
   * ## Two buckets, because there are two different failures
   *
   * `perLearner` answers "can one child spend the class's judge". It is
   * charged only for work that is actually going to be done: a duplicate
   * submission id replays a stored verdict and costs nothing, which is what
   * makes a double-click, a flaky mobile network and a browser POST retry free.
   *
   * `global` answers "can one CLASS spend the school's month". It exists
   * because the judge's concurrency gate lives in a Node process and Vercel
   * runs as many of those as it likes — a per-process bound is not a bound on a
   * metered API. This one is in the database, so every instance shares it, and
   * it is charged only when the configured provider is metered. `local` and
   * `none` cost nothing and are not billed for.
   *
   * ## Where the numbers come from
   *
   * A class of 30 pressing Check is the design load. `perLearner` at 12 burst /
   * 8 a minute is well above deliberate work — a wrong answer, a fix, a
   * re-check is three presses on one task — and well below a loop: a
   * monopolist drops to one submission every 7.5 seconds and can no longer
   * hold a judge slot continuously. `global` at 150 burst / 120 a minute lets
   * all 30 learners check four times a minute, which is faster than a class
   * ever moves, and still bounds a compromised or looping client to a number an
   * operator can put against a plan's quota.
   *
   * They are `intEnv`, so a school with a different plan changes them without a
   * deploy — and a typo takes the default rather than becoming `NaN`, which is
   * how a limit silently becomes no limit.
   */
  submit: {
    perLearner: {
      capacity: intEnv("SUBMIT_BURST_PER_LEARNER", 12),
      refillPerMinute: intEnv("SUBMIT_PER_MINUTE_PER_LEARNER", 8),
    },
    global: {
      capacity: intEnv("SUBMIT_BURST_GLOBAL", 150),
      refillPerMinute: intEnv("SUBMIT_PER_MINUTE_GLOBAL", 120),
    },
  },

  /**
   * SolveX Leagues — the weekly student competition.
   *
   * `=== "true"`, so it is OFF unless a deployment asks for it. The other
   * convention in this file — `!== "false"` — would turn a competition on for
   * every existing deployment at the next deploy, including schools that have
   * not agreed to one. For a feature that shows children to each other, the
   * safe direction is the closed one.
   *
   * `schools` is an allowlist of `school_id` values, empty meaning "every
   * school, once enabled". It exists because there is no `schools` table to
   * hang a column on, and because a school name hardcoded into gamification
   * logic is a school name somebody has to find and remove later. The decision
   * of whether a given school is in is made by `leaguesEnabledForSchool`, which
   * takes these as arguments so it can be tested in the off state.
   */
  leagues: {
    enabled: env("LEAGUES_ENABLED") === "true",
    schools: (env("LEAGUES_SCHOOLS") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  },

  ops: {
    /**
     * Bearer token for the ADMIN health view.
     *
     * A second door beside the `admin` role, not a replacement for it. The
     * thing that has to reach `/api/health` at 03:00 is an uptime monitor, and
     * a monitor has no session, no password to rotate and no business holding
     * one. Absent, the machine door is simply closed — the admin view is then
     * reachable only by a signed-in admin, which is the safe direction to fail
     * for an endpoint whose whole job is to describe the infrastructure.
     *
     * Never asserted at boot. A pilot that never wires a monitor is not
     * misconfigured; it just has one fewer way to be woken up.
     */
    adminToken: env("LEARNING_ADMIN_TOKEN"),
  },
} as const;

/**
 * The judge, checked as data rather than as ambient configuration.
 *
 * Pure, and takes its inputs rather than reading `config`, because the object
 * above resolves `process.env` once at import: anything that inspects it
 * directly can only ever be tested against whatever environment the test runner
 * happens to be in. This shape lets the whole production matrix be asserted
 * without module-reload gymnastics.
 *
 * The decision it enforces is `docs/CODE_EXECUTION_DECISION.md`: RUN is the
 * learner's own browser compiling their C++ and needs nothing here, and SUBMIT
 * is a server-side judge with a credential. `local` is not one of the options — see
 * `schools/exec/providers/local.ts` — and every recognised judge has exactly
 * one thing this function insists on, the piece of configuration whose absence
 * is SILENT: Piston's address, Judge0's key. Both produce the same failure
 * shape, which is why they read the same way here.
 */
export function executionProviderProblems(
  environment: string,
  exec: { provider: string; pistonUrl?: string; judge0?: { apiKey?: string } },
): string[] {
  const problems: string[] = [];
  if (environment !== "production") return problems;

  /* `none` is deliberately NOT a problem, in production or anywhere else.
     A deployment that has decided to run without a judge has made a choice the
     product supports and reports; turning that choice into a boot failure would
     force operators to set `EXEC_PROVIDER=piston` with a dead URL to get the
     app to start, which is strictly worse — it converts an honest "no evidence"
     into a judge that appears configured and times out on every submission. */
  if (exec.provider === "none") return problems;

  if (exec.provider === "piston") {
    if (!exec.pistonUrl) {
      problems.push(
        "EXEC_PROVIDER=piston but PISTON_URL is not set. Every code submission " +
          "would fail to reach the judge and settle as unmeasured.",
      );
    }
    return problems;
  }

  /* Judge0 through RapidAPI, and the key is the same kind of load-bearing
     absence as PISTON_URL. Without it `judge0FromConfig` throws, the submit
     route catches the throw and settles the attempt as unmeasured, and the
     deployment boots perfectly clean while grading nothing — the exact silence
     this function exists to convert into a boot failure.

     The host and base URL are NOT checked: both have working defaults, and a
     wrong one fails loudly on the first submission rather than silently. */
  if (exec.provider === "judge0_rapidapi") {
    if (!exec.judge0?.apiKey) {
      problems.push(
        "EXEC_PROVIDER=judge0_rapidapi but JUDGE0_RAPIDAPI_KEY is not set. Every " +
          "code submission would fail to reach the judge and settle as unmeasured.",
      );
    }
    return problems;
  }

  /* `local` and anything unrecognised land in the same place, because
     `getExecutionProvider` falls back to `LocalExecutionProvider` for every
     value it does not recognise — and that provider throws in
     production by design. The submit route catches the throw and leaves the
     verdict `unknown`, so the failure is invisible: nineteen September code
     tasks stop being graded and every learner is told the sandbox is not
     connected. A typo in this variable is therefore as fatal as omitting it,
     and must read as loudly. */
  if (exec.provider === "local") {
    problems.push(
      "EXEC_PROVIDER=local in production. The local provider is a subprocess " +
        "with the app's filesystem, network and credentials rather than a " +
        "sandbox, so it refuses to run there and every code task would go " +
        "ungraded while telling the learner the sandbox is unavailable.",
    );
  } else {
    problems.push(
      `EXEC_PROVIDER=${JSON.stringify(exec.provider)} is not a provider this ` +
        "build knows. Execution falls back to the local subprocess, which " +
        "refuses to run in production, so every code task would go ungraded.",
    );
  }
  return problems;
}

/**
 * Does this deployment have a judge whose word counts as evidence?
 *
 * "Trusted" here means **we ran it, the learner did not** — it is a statement
 * about who controls the interpreter, not about how well the sandbox is
 * isolated. So `local` counts: a subprocess on our server is dangerous to run
 * hostile code in, and it refuses to start in production for exactly that
 * reason, but a learner cannot forge its output. Sandbox quality and evidential
 * trust are different axes and conflating them produces the wrong answer in
 * both directions.
 *
 * Only `none` — and an unrecognised value, which `getExecutionProvider` cannot
 * honour either — means no trusted result is obtainable.
 */
export function trustedProviderConfigured(provider: string = config.exec.provider): boolean {
  return provider === "piston" || provider === "local" || provider === "judge0_rapidapi";
}

/**
 * Fail at boot, not at the first learner.
 *
 * A missing attestation secret makes `verifyAttestation` return null, which is
 * indistinguishable from a forged token — so a misconfigured deployment looks
 * exactly like an attack, every verdict silently downgrades to browser trust,
 * no misconception ever becomes actionable, and the product goes on looking
 * like it works while it has quietly stopped learning anything.
 */
export function assertProductionConfig(): string[] {
  const problems: string[] = [];
  if (config.environment !== "production") return problems;

  if (!config.attestationSecret) {
    problems.push(
      "LEARNING_ATTESTATION_SECRET is not set. Every judge verdict would " +
        "downgrade to browser trust silently.",
    );
  } else if (config.attestationSecret.length < 32) {
    problems.push("LEARNING_ATTESTATION_SECRET is shorter than 32 characters.");
  }
  if (!config.databaseUrl && config.dataDir.startsWith(".")) {
    problems.push(
      "No DATABASE_URL and the data directory is relative. On an ephemeral " +
        "filesystem every learner's progress is lost on redeploy.",
    );
  }
  if (config.nova.provider === "deepseek" && !config.nova.apiKey) {
    problems.push("NOVA_PROVIDER=deepseek but DEEPSEEK_API_KEY is not set.");
  }
  problems.push(...databaseTlsProblems(config.databaseUrl));
  problems.push(...executionProviderProblems(config.environment, config.exec));
  return problems;
}

/**
 * The learner data on the wire, and whether anything is protecting it.
 *
 * ## What the driver does and does not do
 *
 * `PostgresExecutor` passes the connection string to `pg` and sets no `ssl`
 * option, deliberately — a hardcoded `rejectUnauthorized: false` is how a
 * "temporary" insecure flag becomes permanent. The consequence is that TLS is
 * entirely a property of the URL, and `pg-connection-string` defaults an
 * absent `sslmode` to **no TLS at all**.
 *
 * So a production `DATABASE_URL` with no `sslmode` sends every learner's
 * source code, every verdict and every password hash across the network in
 * plaintext, and nothing anywhere says so. It boots clean.
 *
 * ## Why this refuses at boot rather than warning
 *
 * The failure is invisible by construction: an unencrypted connection works
 * perfectly. There is no moment later at which somebody finds out. A boot
 * failure with the fix in the message is the only signal that arrives before
 * the data does.
 *
 * `sslmode=no-verify` is called out separately because it is the dangerous
 * middle: it encrypts and does not authenticate, so it stops a passive
 * listener and not an active one, and it reads like a security setting.
 *
 * Exported and pure so `tests/school/production-config.test.ts` can put the
 * whole matrix through it without a database.
 */
export function databaseTlsProblems(databaseUrl: string | undefined): string[] {
  if (!databaseUrl) return [];

  /* A unix socket has no network to protect. `host=/var/run/...` and a
     `postgres:///db?host=...` form both reach the server without a wire. */
  if (/[?&]host=%2F|[?&]host=\//.test(databaseUrl) || databaseUrl.startsWith("postgres:///")) {
    return [];
  }

  const mode = /[?&]sslmode=([a-z-]+)/i.exec(databaseUrl)?.[1]?.toLowerCase();

  if (mode === undefined) {
    return [
      "DATABASE_URL has no sslmode. `pg` defaults to NO TLS, so every learner's " +
        "source code, verdict and password hash would cross the network in " +
        "plaintext — and it would work perfectly, so nothing would ever say so. " +
        "Append `?sslmode=verify-full` (preferred) or `?sslmode=require`.",
    ];
  }
  if (mode === "disable" || mode === "allow" || mode === "prefer") {
    return [
      `DATABASE_URL sets sslmode=${mode}, which permits an unencrypted ` +
        "connection to a database of children's work. Use `verify-full`.",
    ];
  }
  if (mode === "no-verify") {
    /* Not a boot failure: it DOES encrypt, and a managed provider with a
       private CA is a real reason to be here. But it authenticates nothing, so
       it must be a decision somebody made rather than a default nobody saw. */
    return [];
  }
  return [];
}
