import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { readArtifact, type SubmittedArtifact } from "@schools/learning/hydration";
import type { BlockAnswer } from "@schools/learning/checking";

/**
 * The learner's submitted work, kept and handed back.
 *
 * ## The gap this closes
 *
 * `learning_submissions` recorded what the SERVER said and nothing about what
 * the LEARNER wrote. Proven against a live row before any of this was built:
 * `response` held `{verdict, cases, reveal, why, episodeId, saved,
 * unmeasuredReason, attested}` and the table had no column for an answer.
 *
 * So a learner submitted code, was told "correct", refreshed, and found an
 * empty editor. For a written explanation it was worse — they were told a
 * teacher would read it, and there was nothing left to read.
 *
 * Migration 0021 adds `answer jsonb`, written inside the same transaction that
 * settles the submission, so a verdict without its work cannot be produced.
 * These tests pin the read side: what comes back, and what must never come back.
 */

describe("the artifact contract is BlockAnswer, not a parallel vocabulary", () => {
  it("round-trips every kind the curriculum can produce", () => {
    /* Typed `BlockAnswer` on the way in, so a member added to that union
       without a fixture here is a compile error — which is the point of
       reusing it instead of modelling a second shape that can drift. */
    const cases: { answer: BlockAnswer; restores: boolean }[] = [
      { answer: { kind: "text", value: "print(1)" }, restores: true },
      { answer: { kind: "option", id: "b" }, restores: true },
      { answer: { kind: "blanks", values: ["int", "input"] }, restores: true },
      { answer: { kind: "order", ids: ["p3", "p1", "p2"] }, restores: true },
      { answer: { kind: "line", line: 4 }, restores: true },
      { answer: { kind: "grid", cells: { "0,0": "5", "0,1": "7" } }, restores: true },
      /* Nothing to put back on screen, so they resolve to "no artifact" and a
         caller needs one check rather than two. */
      { answer: { kind: "none" }, restores: false },
      { answer: { kind: "acknowledged" }, restores: false },
    ];
    for (const c of cases) {
      const out = readArtifact(JSON.parse(JSON.stringify(c.answer)) as unknown);
      expect(Boolean(out), `${c.answer.kind} restorable`).toBe(c.restores);
      if (c.restores) expect(out).toEqual(c.answer);
    }
  });

  it("survives the driver that hands jsonb back as text", () => {
    /* PGlite parses jsonb; a wire driver may not. Getting this wrong would
       blank every restored block on exactly one of the two databases. */
    expect(readArtifact('{"kind":"text","value":"a = 1"}')).toEqual({
      kind: "text",
      value: "a = 1",
    });
  });
});

describe("a row without an artifact must not break the page", () => {
  it("treats every pre-0021 and malformed shape as simply absent", () => {
    /* `answer` is nullable on purpose: rows settled before the migration have
       no artifact and never will. The honest result is a settled verdict beside
       an empty editor — never invented source, and never a crash. */
    for (const bad of [
      null, undefined, "", "not json", "[]", "{}",
      { kind: "text" },
      { kind: "option" },
      { kind: "blanks", values: [1, 2] },
      { kind: "order", ids: "p1" },
      { kind: "line", line: "4" },
      { kind: "grid", cells: [1] },
      { kind: "future_kind_nobody_wrote_yet" },
    ]) {
      expect(readArtifact(bad), `${JSON.stringify(bad)} must be absent`).toBeUndefined();
    }
  });
});

describe("what the artifact may never carry", () => {
  it("has no field an answer key could live in", () => {
    /* The rule the migration states and this enforces: the artifact records
       WHAT THE LEARNER SUBMITTED, never what the correct answer is. A future
       member that added `expectedOutput` "for convenience" fails here. */
    const every: SubmittedArtifact[] = [
      { kind: "text", value: "x" },
      { kind: "option", id: "a" },
      { kind: "blanks", values: ["x"] },
      { kind: "order", ids: ["x"] },
      { kind: "line", line: 1 },
      { kind: "grid", cells: { a: "b" } },
    ];
    for (const a of every) {
      const keys = Object.keys(a);
      for (const forbidden of [
        "correctOptionId", "expectedOutput", "referenceSolution",
        "cases", "hidden", "diagnosticMapping", "expectedPoints",
      ]) {
        expect(keys, `${a.kind} must not carry ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it("keeps hostile text as data, byte for byte", () => {
    /* Learner work is untrusted input that now makes a round trip through the
       database and back into a page. It is carried as a JSON string and
       rendered through React's escaping; this asserts the value is preserved
       exactly rather than quietly rewritten, because a silent sanitise would be
       its own bug and would corrupt legitimate code. */
    const hostile = '<script>alert(1)</script>`${x}`"\'\\n{"kind":"option"}';
    expect(readArtifact({ kind: "text", value: hostile })).toEqual({
      kind: "text",
      value: hostile,
    });
  });

  it("preserves Kazakh and Russian exactly", () => {
    const kk = "a = int(input())  # Сәлем, әлем! Жауабы: ә, ө, ұ, ғ\nprint(a)";
    const ru = "b = int(input())  # Привет, мир! Ответ: ё, ъ, ы\nprint(b)";
    expect(readArtifact({ kind: "text", value: kk })).toEqual({ kind: "text", value: kk });
    expect(readArtifact({ kind: "text", value: ru })).toEqual({ kind: "text", value: ru });
  });
});

describe("the write rides the settle transaction", () => {
  it("carries the artifact on the same statement as the verdict", () => {
    /* Asserted on the source because the alternative — a second write — is the
       one thing that produces the split state this phase exists to prevent: a
       verdict with no work behind it, or work the learner never got a verdict
       for. One UPDATE, or neither. */
    const src = readFileSync(
      path.join(process.cwd(), "schools/store/learning-store.ts"),
      "utf8",
    );
    const stmt = src.slice(
      src.indexOf("update learning_submissions\n            set settled_at"),
      src.indexOf("returning submission_id"),
    );
    expect(stmt, "the settle UPDATE must be findable").not.toBe("");
    expect(stmt).toContain("verdict = $3");
    expect(stmt).toContain("answer = $5::jsonb");
  });
});
