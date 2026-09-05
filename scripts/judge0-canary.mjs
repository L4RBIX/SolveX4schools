/**
 * The live Judge0 canary — the four questions the conformance suite does not ask.
 *
 * `tests/exec/judge0-conformance.test.ts` already puts ten programs through the
 * real judge and asserts the protocol: hello world, stdin, a compile error, a
 * crash, a time limit, an output flood, a non-zero exit, Kazakh on stdout, a
 * value past 32 bits, and which GCC answered. What it does not exercise is what
 * a CLASSROOM does to the judge, and that is where money and fairness live.
 *
 * So this run adds exactly four, and no more, because every line below is a
 * paid submission:
 *
 *   1. `<bits/stdc++.h>`     — GCC has it, libc++ does not, and the whole
 *                              curriculum is written with it.
 *   2. a duplicate submission — the same `submissionId` twice must cost ONE
 *                              judge call, not two. That is C3's promise.
 *   3. an eight-case batch    — one HTTP request, eight results, in order.
 *   4. three learners at once — the fairness gate must not let one of them
 *                              take the whole channel.
 *
 * Requests are counted by wrapping `fetch`, so the number reported is the
 * number actually sent rather than the number intended.
 *
 *   set -a; . ./.env.local; set +a
 *   JUDGE0_LIVE_TEST=1 node --experimental-strip-types scripts/judge0-canary.mjs
 */
import { spawnSync } from "node:child_process";

const key = process.env.JUDGE0_RAPIDAPI_KEY;
if (process.env.JUDGE0_LIVE_TEST !== "1" || !key) {
  console.error("refusing to run: needs JUDGE0_LIVE_TEST=1 and JUDGE0_RAPIDAPI_KEY");
  process.exit(2);
}

/* The canary runs inside vitest, because that is where the provider's module
   graph resolves (`@schools/*` aliases) and where a failure is reported the
   same way every other gate reports one. This file is the runner. */
const r = spawnSync(
  "npx",
  ["vitest", "run", "tests/exec/judge0-canary.test.ts"],
  { stdio: "inherit", env: { ...process.env } },
);
process.exit(r.status ?? 1);
