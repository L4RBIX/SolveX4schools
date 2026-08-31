import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The rails on the command that closes a month.
 *
 * `withdrawCurriculum` has existed in the store since migration 0013 and had
 * exactly one caller: a test. So the supported way to pull a month back out of
 * a classroom was a hand-written UPDATE against production, typed by whoever
 * was awake. `scripts/unpublish-curriculum.ts` is the command that should have
 * existed, and these are the refusals that matter — the ones that fire BEFORE
 * it opens a database, which is why they can be tested by running the real
 * binary with no database at all.
 *
 * The happy path is exercised against a real Postgres in the release procedure
 * rather than here: it needs a migrated database and a provisioned reviewer,
 * and what it would add over `tests/school/publication-gate.test.ts` — which
 * already covers `withdrawCurriculum` itself — is the CLI wiring. What is
 * genuinely worth pinning is that a mistyped month or an `--all` cannot close
 * a school's year, because that is the mistake with the worst blast radius and
 * the one a tired operator actually makes.
 */

const CLI = path.join(process.cwd(), "scripts/unpublish-curriculum.ts");

function run(args: string[]): { status: number; out: string } {
  try {
    const out = execFileSync("npx", ["tsx", CLI, ...args], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      /* No DATABASE_URL and a memory data dir: every refusal asserted here
         happens before the database is touched, so this must not be able to
         reach one even by accident. */
      env: { ...process.env, DATABASE_URL: "", LEARNING_DATA_DIR: "memory://guards" },
      timeout: 120_000,
    });
    return { status: 0, out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { status: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

describe("closing a month cannot be done by accident", () => {
  it("refuses a month index that is not a month", () => {
    const { status, out } = run([
      "--month", "99", "--reviewer", "someone", "--i-am-the-reviewer",
    ]);
    expect(out).toContain("Not a month");
    expect(status, "and does not exit clean").not.toBe(0);
  });

  it("refuses a month index that is not a number at all", () => {
    const { status, out } = run([
      "--month", "october", "--reviewer", "someone", "--i-am-the-reviewer",
    ]);
    expect(out).toContain("Not a month");
    expect(status).not.toBe(0);
  });

  it("has no --all, and says so rather than ignoring it", () => {
    /* The worst mistake this command can make is closing the whole year during
       a lesson. No flag should make that one keystroke, and an unrecognised
       `--all` that silently withdrew one month would be worse than either. */
    const { status, out } = run([
      "--month", "3", "--all", "--reviewer", "someone", "--i-am-the-reviewer",
    ]);
    expect(out).toContain("There is no --all");
    expect(status).not.toBe(0);
  });

  it("names the school in its rejection, because that is the usual mistake", () => {
    /* Not asserted against a live database — asserted in the source of the
       shared authenticator, which is where the message is built. `username` is
       unique per school and not globally, and "credentials rejected" sent
       operators looking at the password when the answer was `--school`. */
    const src = readFileSync(path.join(process.cwd(), "scripts/operator.ts"), "utf8");
    expect(src).toContain("check --school");
  });
});
