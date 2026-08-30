import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { capabilityFor } from "@schools/execution/trust-policy";

/**
 * The server tells the learner whether their Check counts. The browser cannot.
 *
 * ## The gap this closes
 *
 * `RunPanel` folds the surface's trust policy together with "does this
 * deployment have a judge" to decide what a learner is told — whether a Check
 * here produces evidence, or whether it will be handed to a teacher.
 *
 * The second half is a SERVER fact. It travelled correctly through
 * `LessonRoute` and `AssessmentRoute`, and then nothing supplied it: both
 * component chains default `trustedProviderConfigured` to `true`, and neither
 * Server Component page passed anything. So on a deployment with no judge the
 * panel said the Check counted, which is the one thing it exists not to say.
 *
 * It was harmless only while every deployment had a judge. `EXEC_PROVIDER=none`
 * is now a supported mode and `judge0_rapidapi` is a provider that can be
 * present, absent, or misconfigured — so the default became a sentence a
 * fourteen-year-old reads and a school believes.
 *
 * Asserted against the pages' source, because the alternative is rendering a
 * React Server Component that needs a session, a store and a track cookie —
 * i.e. not testing it at all.
 */

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const PAGES = [
  { file: "src/app/lesson/[lessonId]/page.tsx", route: "LessonRoute" },
  { file: "src/app/assessment/[month]/page.tsx", route: "AssessmentRoute" },
];

describe("every page that renders a coding block supplies the judge fact", () => {
  for (const { file, route } of PAGES) {
    it(`${file} passes trustedProviderConfigured to ${route}`, () => {
      const src = read(file);
      expect(src, "the page must read it from config, server-side").toContain(
        'from "@schools/config"',
      );
      expect(src).toContain("trustedProviderConfigured");

      /* Passed as a CALL, not as a literal. `trustedProviderConfigured={true}`
         would satisfy a naive substring check and reintroduce exactly the
         defect — a page asserting a judge exists because someone typed it. */
      expect(src).toMatch(/trustedProviderConfigured=\{trustedProviderConfigured\(\)\}/);
      expect(src, "never hardcoded").not.toMatch(/trustedProviderConfigured=\{(true|false)\}/);
    });
  }

  it("reads the value on the server, never from the browser", () => {
    /* `@schools/config` resolves `process.env` — it cannot run in a browser,
       which is what makes this the right side of the boundary. A client
       component asking "is there a judge?" would be asking the party being
       assessed. */
    for (const { file } of PAGES) {
      const src = read(file);
      expect(src, `${file} must not be a client component`).not.toMatch(/^"use client"/m);
    }
  });
});

describe("what the flag actually changes, so the wiring is worth having", () => {
  it("turns evidence off on the surfaces that require a judge", () => {
    /* If this ever stopped differing, the prop would be decoration and the
       test above would be guarding nothing. */
    for (const surface of ["independent_evidence", "assessment", "contest"] as const) {
      expect(capabilityFor(surface, true).checkProducesEvidence).toBe(true);
      expect(capabilityFor(surface, false).checkProducesEvidence).toBe(false);
    }
  });

  it("leaves the teaching surfaces working either way", () => {
    for (const surface of ["lesson_guided", "lesson_practice"] as const) {
      expect(capabilityFor(surface, false).checkProducesEvidence).toBe(true);
      expect(capabilityFor(surface, false).canRunLocally).toBe(true);
    }
  });
});
