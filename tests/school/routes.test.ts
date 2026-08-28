import { describe, it, expect, vi } from "vitest";

/* Static imports: Vite's resolver treats `[` in a *dynamic* specifier as a
   glob, so `await import("…/[monthIndex]/page")` never resolves. A literal
   import statement is handled at transform time and does. */
import CoursePage, {
  generateStaticParams as courseParams,
} from "../../src/app/course/[index]/page";
import LessonPage, {
  generateStaticParams as lessonParams,
} from "../../src/app/lesson/[lessonId]/page";

/**
 * Route topology.
 *
 * The consolidation moved the product's front door: `/` was a marketing page
 * that used two of the nine sections the clone had already built, `/welcome`
 * was a second one, and the student dashboard was at `/`. These tests are the
 * thing that stops that from silently reverting — a redirect that quietly
 * becomes a 404, or a dev-only route that stops being dev-only, looks fine in a
 * browser until someone lands on it.
 *
 * Next's `permanentRedirect` and `notFound` work by throwing a tagged error, so
 * calling the module IS the assertion. Nothing here renders JSX.
 */

/** Next tags its control-flow errors on the thrown object. */
function digestOf(err: unknown): string {
  return String((err as { digest?: unknown }).digest ?? "");
}

async function callDefault(mod: Promise<{ default: () => unknown }>) {
  const m = await mod;
  return m.default();
}

describe("legacy routes redirect rather than 404", () => {
  it("/welcome is permanently gone; `/` is the public landing", async () => {
    // 308, not 307: the split-brain landing is never coming back, and a
    // temporary redirect would leave it in caches and in search results.
    let digest = "";
    try {
      await callDefault(import("@/app/welcome/page"));
    } catch (err) {
      digest = digestOf(err);
    }
    expect(digest).toContain("NEXT_REDIRECT");
    expect(digest).toContain("/");
    expect(digest).toContain("308");
  });

  it("/paths points at /program", async () => {
    let digest = "";
    try {
      await callDefault(import("@/app/paths/page"));
    } catch (err) {
      digest = digestOf(err);
    }
    expect(digest).toContain("NEXT_REDIRECT");
    expect(digest).toContain("/program");
    expect(digest).toContain("308");
  });
});

describe("the reverse-engineering baseline is development-only", () => {
  it("404s under NODE_ENV=production", async () => {
    const mod = await import("@/app/brilliant/layout");
    const before = process.env.NODE_ENV;

    // The routes carry Brilliant's branding, marketing copy and testimonials,
    // and they are the only tree that loads the two Contrast Foundry faces.
    // Shipping either inside a paid product is not a styling question.
    vi.stubEnv("NODE_ENV", "production");
    try {
      let digest = "";
      try {
        mod.default({ children: null });
      } catch (err) {
        digest = digestOf(err);
      }
      expect(digest).toContain("NEXT_HTTP_ERROR_FALLBACK;404");
    } finally {
      vi.unstubAllEnvs();
      expect(process.env.NODE_ENV).toBe(before);
    }
  });

  it("renders in development, so regressions still have something to be measured against", async () => {
    const mod = await import("@/app/brilliant/layout");
    expect(() => mod.default({ children: null })).not.toThrow();
  });

  it("is excluded from indexing whatever the environment", async () => {
    const mod = await import("@/app/brilliant/layout");
    expect(mod.metadata.robots).toEqual({ index: false, follow: false });
  });
});

describe("the product's own routes exist and are wired to the curriculum", () => {
  it("every canonical route has a page module", async () => {
    const routes = [
      "@/app/page",
      "@/app/home/page",
      "@/app/program/page",
      "@/app/you/page",
      "@/app/schools/page",
    ];
    for (const route of routes) {
      const mod = (await import(route)) as { default?: unknown };
      expect(typeof mod.default, route).toBe("function");
    }
    expect(typeof CoursePage).toBe("function");
    expect(typeof LessonPage).toBe("function");
  });

  it("/course and /lesson pre-render from the curriculum, not from a hardcoded list", async () => {
    const months = await courseParams();
    const lessons = await lessonParams();

    // Nine months, September to May. The programme's own shape.
    expect(months.map((m) => m.index)).toEqual(
      ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    );
    // Only authored lessons get a route. A pre-rendered page for an unwritten
    // lesson is a link a learner can reach and find empty.
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons.every((l) => /^m\d+\.l\d+$/.test(l.lessonId))).toBe(true);
  });
});
