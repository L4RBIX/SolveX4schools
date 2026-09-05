import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * No environment variable may turn a visitor into a pupil.
 *
 * ## What exists on another branch
 *
 * `pilot-release-candidate` carries `DEMO_AUTOLOGIN_USERNAME`. Set it, and
 * `currentUser()` returns a real enrolled account for anyone who opens the URL
 * — with that child's class, that child's work, and every downstream guard
 * satisfied, because identity is faked at the one function they all read. It
 * was a deliberate, well-argued change for a demo deployment, and its own
 * commit message says the rollback is unsetting the variable.
 *
 * That is exactly the property this test refuses. A pilot serves real
 * fourteen-year-olds in a real school; a variable that silently signs a stranger
 * in as one of them is not a feature that can be one environment away, because
 * environments are copied. The two deployment fixes from that branch were
 * cherry-picked; this was not, and this is what keeps it out.
 *
 * ## Why the assertion is on the whole tree
 *
 * Not on `session.ts`. The mechanism is a name read from the environment, and
 * the next version of it will be read somewhere else — so the search is for the
 * NAME, anywhere a deployment could act on it, plus the shape it belongs to.
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const SKIP = new Set(["node_modules", ".next", ".git", "public", ".claude", "docs"]);

function sources(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(path.join(ROOT, dir))) {
      if (SKIP.has(entry)) continue;
      const rel = path.join(dir, entry);
      const full = path.join(ROOT, rel);
      if (statSync(full).isDirectory()) walk(rel);
      else if (/\.(ts|tsx|mjs|js|json|ya?ml)$/.test(entry)) out.push(rel);
    }
  };
  for (const dir of ["schools", "src", "scripts", "packages"]) walk(dir);
  out.push("package.json", ".env.example", "vercel.json");
  return out;
}

describe("anonymous means anonymous", () => {
  const files = sources();

  it("has no DEMO_AUTOLOGIN switch anywhere in the product", () => {
    const offenders = files.filter((f) => {
      const src = readFileSync(path.join(ROOT, f), "utf8");
      /* This file names the variable, and so may a test that guards it. */
      if (f.endsWith("no-demo-autologin.test.ts")) return false;
      return /DEMO_AUTOLOGIN/i.test(src);
    });
    expect(
      offenders,
      `these files carry a demo auto-login switch:\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });

  it("resolves identity from the session and from nothing else", () => {
    /*
     * The shape, not just the name. `currentUser()` is the one function every
     * guard reads, and the demo change worked by returning an account from it
     * without a session. Anything that looks up an account by a name taken from
     * `process.env` inside that file is the same mechanism wearing a different
     * variable.
     */
    const session = readFileSync(path.join(ROOT, "schools/auth/session.ts"), "utf8");
    const fn = session.slice(session.indexOf("export async function currentUser"));
    const body = fn.slice(0, fn.indexOf("\n}\n") + 3);
    expect(body).toContain("cookies()");
    expect(body, "an account may not be resolved from an environment variable").not.toMatch(
      /process\.env|env\(/,
    );
  });

  it("keeps a disabled account disabled", () => {
    /* The demo path had to special-case this, which is the tell: any bypass of
       the session has to re-implement every rule the session already enforces,
       and the one that matters most is an account somebody shut off. */
    const session = readFileSync(path.join(ROOT, "schools/auth/session.ts"), "utf8");
    expect(session).toContain("account.disabledAt");
  });
});
