import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, statSync } from "node:fs";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The curriculum must not be reachable from a client component.
 *
 * ## What went wrong
 *
 * `school-lesson.tsx` imported one pure helper — `isContestLesson` — from
 * `schools/curriculum/inventory.ts`. `inventory.ts` reads `PROGRAM`. A value
 * import is a value import, so the bundler followed it through `program.ts` and
 * `months/` and emitted the entire authored year into a 2,351,507-byte client
 * chunk: 255 `referenceSolution`, 1,735 `hidden:!0`, 2,166 `expectedOutput`,
 * loaded by `/home`, `/lesson/*`, `/course/*`, `/assessment/*`, `/program` and
 * `/review`. `schools/presentation/adapters.ts` did the same thing with
 * `monthCompletables`, which put it on the course map and the roadmap too.
 *
 * Every one of those pages already stripped the same fields out of its props
 * through `public.ts`. The projection was correct and it was not enough,
 * because the data arrived by a path that never passed through it.
 *
 * ## Why this test and not only the build gate
 *
 * `scripts/check-bundle-answers.ts` reads the emitted bytes and is the
 * authority — it catches a leak by any route, including ones nobody predicted.
 * But it needs a production build, so it is the LAST thing in `npm run check`,
 * minutes after the change that broke it.
 *
 * This runs in `npm test`, in about a second, and names the exact import chain.
 * The two are deliberately different instruments: this one asks "can it reach
 * the curriculum", the gate asks "did the answer key ship". A fix that only
 * satisfied one of them would be a fix that only held for one kind of mistake.
 *
 * `import "server-only"` in `program.ts` and `inventory.ts` is the third: it
 * makes the same mistake a hard build error naming the chain. Three statements
 * of one boundary, in three currencies, because the boundary had been stated
 * once — in the projection — and once was not enough.
 */

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** Modules that hold the authored year, in whole or in part. */
const FORBIDDEN = [
  "schools/curriculum/program.ts",
  "schools/curriculum/inventory.ts",
  "schools/curriculum/months/index.ts",
];

const SOURCE_ROOTS = ["src", "schools", "packages"];

function sources(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (p.endsWith(".ts") || p.endsWith(".tsx")) out.push(path.relative(ROOT, p));
    }
  };
  for (const base of SOURCE_ROOTS) {
    const abs = path.join(ROOT, base);
    if (existsSync(abs)) walk(abs);
  }
  return out;
}

function resolveModule(candidate: string): string | null {
  for (const suffix of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    const p = path.join(ROOT, candidate + suffix);
    if (existsSync(p) && statSync(p).isFile()) return path.relative(ROOT, p);
  }
  const bare = path.join(ROOT, candidate);
  if (existsSync(bare) && statSync(bare).isFile()) return path.relative(ROOT, bare);
  return null;
}

/** The path aliases from `tsconfig.json`, resolved the way the bundler does. */
function resolveSpecifier(spec: string, fromFile: string): string | null {
  let candidate: string;
  if (spec.startsWith("@schools/")) candidate = `schools/${spec.slice("@schools/".length)}`;
  else if (spec.startsWith("@solvex/learning-contracts")) {
    candidate = `packages/learning-contracts/src${spec.slice("@solvex/learning-contracts".length)}`;
  } else if (spec.startsWith("@solvex/learning-intelligence-core")) {
    candidate = `packages/learning-intelligence-core/src${spec.slice("@solvex/learning-intelligence-core".length)}`;
  } else if (spec.startsWith("@solvex/nova-core")) {
    candidate = `packages/nova-core/src${spec.slice("@solvex/nova-core".length)}`;
  } else if (spec.startsWith("@/")) candidate = `src/${spec.slice(2)}`;
  else if (spec.startsWith(".")) candidate = path.normalize(path.join(path.dirname(fromFile), spec));
  else return null; // a real package — not ours to police
  return resolveModule(candidate);
}

/**
 * `import type` is erased before the bundler sees it, so a type-only import of
 * `Month` is not a leak and never was. The distinction is the whole point: the
 * adapters have carried a deliberate type-only import of the unlock policy for
 * exactly this reason, with a comment saying so.
 */
const IMPORT = /^\s*import\s+(type\s+)?(?:[^;'"]*?\bfrom\s+)?["']([^"']+)["']/gm;
/** `export … from` re-exports a VALUE and pulls the module in just as hard. */
const REEXPORT = /^\s*export\s+(type\s+)?(?:\*|\{[^}]*\})\s*from\s+["']([^"']+)["']/gm;

interface Graph {
  edges: Map<string, string[]>;
  clients: string[];
}

function buildGraph(): Graph {
  const edges = new Map<string, string[]>();
  const clients: string[] = [];
  for (const file of sources()) {
    const text = readFileSync(path.join(ROOT, file), "utf8");
    if (/^\s*(?:"use client"|'use client')/.test(text)) clients.push(file);
    const deps: string[] = [];
    for (const re of [IMPORT, REEXPORT]) {
      re.lastIndex = 0;
      for (const m of text.matchAll(re)) {
        if (m[1]) continue; // `import type` / `export type` — erased
        const resolved = resolveSpecifier(m[2]!, file);
        if (resolved) deps.push(resolved);
      }
    }
    edges.set(file, deps);
  }
  return { edges, clients };
}

/** Shortest value-import chain from `start` to `target`, or null. */
function chainTo(graph: Graph, start: string, target: string): string[] | null {
  const seen = new Map<string, string[]>([[start, [start]]]);
  const queue = [start];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const dep of graph.edges.get(cur) ?? []) {
      if (seen.has(dep)) continue;
      const chain = [...seen.get(cur)!, dep];
      if (dep === target) return chain;
      seen.set(dep, chain);
      queue.push(dep);
    }
  }
  return null;
}

describe("client components cannot reach the curriculum", () => {
  const graph = buildGraph();

  it("finds the client components at all", () => {
    /* If the `use client` detection ever stops matching — a directive moved
       below a comment, a rename of the components directory — every assertion
       below would pass by walking nothing. This is the floor that makes the
       rest of the file mean something. */
    expect(graph.clients.length).toBeGreaterThan(50);
    expect(graph.clients).toContain("src/components/brilliant/lesson/school-lesson.tsx");
    expect(graph.clients).toContain("src/components/brilliant/app/school-home.tsx");
  });

  it("resolves the modules it is guarding", () => {
    for (const target of FORBIDDEN) {
      expect(existsSync(path.join(ROOT, target)), `${target} should exist`).toBe(true);
    }
  });

  it("can still see a real path when one exists", () => {
    /* The detector, proved on a known-true case: `school-lesson.tsx` does reach
       `curriculum/shape.ts`, deliberately, and this test would be worthless if
       the walk could not find that. */
    const chain = chainTo(graph, "src/components/brilliant/lesson/school-lesson.tsx", "schools/curriculum/shape.ts");
    expect(chain, "school-lesson should reach shape.ts").not.toBeNull();
  });

  for (const target of FORBIDDEN) {
    it(`no client component value-imports ${target}`, () => {
      const offenders: string[] = [];
      for (const client of graph.clients) {
        const chain = chainTo(graph, client, target);
        if (chain) offenders.push(chain.join("\n      → "));
      }
      expect(
        offenders,
        `A client component reaches ${target}, which reads the authored curriculum — every hidden ` +
          `test case, every reference solution. The bundler will emit all of it.\n\n` +
          `Import chains:\n      ${offenders.join("\n\n      ")}\n\n` +
          `The browser-safe half is schools/curriculum/shape.ts. Page props go through ` +
          `schools/curriculum/public.ts.`,
      ).toEqual([]);
    });
  }
});
