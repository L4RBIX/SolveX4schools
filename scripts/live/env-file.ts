import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Read `.env.local` and `.env` the way the app already does.
 *
 * ## Why this exists
 *
 * `npm run dev` and `npm run build` are Next, and Next loads `.env.local`
 * itself. `npm run judge0:validate` is a bare tsx process and does not, so a
 * key pasted into `.env.local` — the obvious place, the place the setup runbook
 * points at, and the only file in this repo that is gitignored for secrets —
 * reached the app and not the validator. The operator would have seen
 * "JUDGE0_RAPIDAPI_KEY is not set" while looking straight at the line where
 * they had just set it.
 *
 * ## The precedence, and why it runs this way round
 *
 * A real environment variable always wins. `export JUDGE0_RAPIDAPI_KEY=…` in a
 * shell, or a key injected by a deployment platform, must not be silently
 * overridden by a stale line in a file somebody edited last month — that is how
 * a validation run ends up reporting on the wrong subscription.
 *
 * `.env.local` beats `.env` for the same reason Next orders them that way:
 * `.env` is the shared, committed-ish defaults and `.env.local` is this
 * machine's secrets.
 *
 * ## What it deliberately does not do
 *
 * No interpolation, no `export ` prefix handling, no multi-line values. A
 * dotenv parser that is clever is a parser that reads a key wrong in a way
 * nobody notices until a request 401s. Keys here are opaque single-line
 * strings; anything more elaborate belongs in a real environment variable.
 */
export function loadEnvFiles(
  root: string,
  env: NodeJS.ProcessEnv = process.env,
  files: readonly string[] = [".env.local", ".env"],
): void {
  for (const file of files) {
    let raw: string;
    try {
      raw = readFileSync(path.join(root, file), "utf8");
    } catch {
      continue; // Absent is the normal case for at least one of them.
    }

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("#")) continue;

      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;

      const name = trimmed.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) continue;
      /* Already set — by the shell, by CI, by a platform. Never overridden. */
      if (env[name] !== undefined) continue;

      let value = trimmed.slice(eq + 1).trim();
      /* One layer of matching quotes, which is the only quoting these files
         use and the only kind worth supporting silently. */
      if (value.length >= 2 && (value.startsWith('"') || value.startsWith("'"))) {
        const quote = value[0];
        if (value.endsWith(quote)) value = value.slice(1, -1);
      }
      if (value === "") continue; // An empty line is "unset", not "set to nothing".

      env[name] = value;
    }
  }
}
