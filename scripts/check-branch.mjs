#!/usr/bin/env node
/**
 * Say which product you are about to run.
 *
 * ## The failure this replaces
 *
 * The repository had two working copies of two different products, and the
 * documentation named the wrong one as canonical. `npm run dev` on
 * `pilot-release-candidate` starts a server, returns 200, and serves the
 * retired Python product — 49 commits behind the deployed one, with no unique
 * commits of its own. Nothing about it looks broken. A previous audit spent its
 * first hour reading it, and said so.
 *
 * ## Why this prints rather than refuses
 *
 * A feature branch is a normal thing to be on, and a gate that blocked one
 * would be removed within a week — taking the warning with it. What was missing
 * was not permission; it was a sentence. So this always exits 0 and always
 * says, in one line, which branch is about to run and how far it is from the
 * deployed one.
 *
 * The one thing it treats as alarming is the shape the defect actually had:
 * BEHIND `origin/master` with nothing ahead. That is not a feature branch. That
 * is an old checkout somebody is about to mistake for the product.
 *
 * Everything here is best-effort. No git, no remote, a fresh clone with no
 * fetch — all of them print a shrug and get out of the way. A dev server must
 * not fail to start because a status line could not be computed.
 */
import { execFileSync } from "node:child_process";

const CANONICAL = "cpp17-migration";

/** git, or null if it cannot answer. Never throws, never blocks a dev server. */
function git(...args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 3000,
    }).trim();
  } catch {
    return null;
  }
}

const branch = git("rev-parse", "--abbrev-ref", "HEAD");
if (branch === null) {
  console.log("[branch] not a git checkout, or git is unavailable — skipping the check.");
  process.exit(0);
}

/* `origin/master` rather than the canonical branch name: the remote's default
   is the fact that decides what is deployed, and a local branch of that name
   could be anything. */
const counts = git("rev-list", "--left-right", "--count", "origin/master...HEAD");
if (counts === null) {
  console.log(
    `[branch] on '${branch}'. No 'origin/master' to compare against — run 'git fetch origin' ` +
      `if this checkout should be tracking the deployed product.`,
  );
  process.exit(0);
}

const [behindText, aheadText] = counts.split(/\s+/);
const behind = Number(behindText);
const ahead = Number(aheadText);

if (behind === 0 && ahead === 0) {
  console.log(`[branch] '${branch}' — level with origin/master. This is the deployed product.`);
} else if (ahead > 0 && behind === 0) {
  console.log(`[branch] '${branch}' — ${ahead} ahead of origin/master, nothing behind.`);
} else if (ahead === 0 && behind > 0) {
  /*
   * The exact shape of the defect. Loud, and it names the consequence rather
   * than the git state, because "N behind" is not what goes wrong — serving a
   * retired product to somebody who thinks they are looking at the live one is.
   */
  console.log("");
  console.log(`[branch] ⚠  '${branch}' is ${behind} commits BEHIND origin/master and has no`);
  console.log("[branch]    commits of its own. This is not the deployed product.");
  console.log("[branch]");
  console.log("[branch]    The server will start and return 200. It will serve an older");
  console.log("[branch]    product, which is the failure that is hardest to notice.");
  console.log("[branch]");
  console.log(`[branch]    git switch ${CANONICAL}      # = origin/master = what Vercel deploys`);
  console.log("[branch]    See docs/DEVELOPMENT.md.");
  console.log("");
} else {
  console.log(
    `[branch] '${branch}' — ${ahead} ahead, ${behind} behind origin/master. ` +
      "Rebase before trusting a comparison against production.",
  );
}
