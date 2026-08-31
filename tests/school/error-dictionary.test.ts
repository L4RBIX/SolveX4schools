import { describe, it, expect } from "vitest";
import { MONTHS } from "@schools/curriculum/months";
import type { AttributedMistake, SavedErrorEntry } from "@schools/store/learning-store";
import {
  blockIdFromTaskRef,
  buildDictionary,
  justificationsFor,
  refFor,
  resolveRef,
} from "@schools/learning/error-dictionary";

/**
 * The error dictionary — «Жеке қателер журналы» (PDF).
 *
 * The suite exists for one rule above all the others: **no sentence about a
 * learner may ever be composed by this product.** An entry can say a thing that
 * happened, in the words of the author who wrote the task or in the learner's
 * own, and it can say nothing else. Everything below is a way of failing loudly
 * if that stops being true.
 *
 * The rest is ordinary: a task reference parses, a handle is stable, and an
 * entry with nothing true left in it is not rendered as a husk.
 */

/* Real September content, chosen for what each one exercises:
     m1.l3.b3  — one answer, one class
     m1.l5.b2  — TWO answers written into the SAME class
     m1.l6.b2  — two answers written into DIFFERENT classes  */
const ONE_ANSWER = { block: "m1.l3.b3", failureClass: "remainder_vs_quotient_swap" };
const TWO_ANSWERS = { block: "m1.l5.b2", failureClass: "elif_chain_short_circuit_missed" };
const TWO_CLASSES = { block: "m1.l6.b2", failureClass: "and_or_swap" };

function mistake(blockId: string, failureClass: string, occurrences = 1): AttributedMistake {
  return {
    taskRef: `sx-lesson:${blockId}`,
    failureClass,
    occurrences,
    lastAt: "2026-08-20T10:00:00.000Z",
  };
}

/** Every justification string the curriculum actually contains. */
const AUTHORED = new Set<string>();
for (const month of MONTHS) {
  const blocks = [
    ...month.units.flatMap((u) => u.lessons.flatMap((l) => l.blocks)),
    ...(month.assessment?.blocks ?? []),
  ];
  for (const block of blocks) {
    for (const entry of Object.values(block.diagnosticMapping ?? {})) {
      AUTHORED.add(entry.justification);
    }
  }
}

describe("nothing here writes a claim about a learner", () => {
  it("has authored justifications to draw on at all, so this suite is scanning something", () => {
    expect(AUTHORED.size).toBeGreaterThan(5);
  });

  it("shows only text an author wrote or the learner wrote", () => {
    /* The load-bearing assertion. Every string on every card is either
       byte-identical to a `diagnosticMapping.justification` in the curriculum,
       or is the learner's own note — there is no third source, and no branch
       anywhere assembles one from a count. "Forgot int() after input" is a
       thing that happened; "you struggle with types" is a claim about a
       fourteen-year-old's mind, and this is what makes the second unbuildable
       rather than merely discouraged. */
    const note = "келесі жолы % пен // ажыратамын";
    const { saved, candidates } = buildDictionary(
      [mistake(ONE_ANSWER.block, ONE_ANSWER.failureClass), mistake(TWO_ANSWERS.block, TWO_ANSWERS.failureClass)],
      [{ blockId: ONE_ANSWER.block, failureClass: ONE_ANSWER.failureClass, note, createdAt: "2026-08-20T10:00:00.000Z" }],
    );

    for (const entry of [...saved, ...candidates]) {
      for (const text of entry.justifications) {
        expect(AUTHORED.has(text), `unauthored text: ${text}`).toBe(true);
      }
      if (entry.note !== null) expect(entry.note).toBe(note);
    }
  });

  it("never puts the failure class on the wire", () => {
    /* `/api/learning/state/me` already refuses to return misconception names:
       what the engine decided is the learner's business, what it filed the
       mistake under is not. A dictionary payload carrying
       `remainder_vs_quotient_swap` would undo that in one line, and it is the
       kind of field that gets added "just for the client to key on". */
    const { candidates } = buildDictionary([mistake(ONE_ANSWER.block, ONE_ANSWER.failureClass)], []);
    expect(candidates).toHaveLength(1);
    expect(JSON.stringify(candidates[0])).not.toContain(ONE_ANSWER.failureClass);
  });

  it("offers nothing for a failure the author did not explain", () => {
    /* Every wrong answer produces an attribution — that is what keeps the
       unexplained-failure denominator honest — and the overwhelming majority
       are `unattributed_failure`: "we graded this and could not tell why". An
       entry built on one would be the product inventing a cause, which is the
       exact thing `DiagnosticMapping`'s contract exists to prevent. */
    const { candidates } = buildDictionary(
      [mistake(ONE_ANSWER.block, "unattributed_failure")],
      [],
    );
    expect(candidates).toEqual([]);
  });
});

describe("justificationsFor", () => {
  it("returns the author's prose for the matching class", () => {
    const texts = justificationsFor(ONE_ANSWER.block, ONE_ANSWER.failureClass);
    expect(texts).toHaveLength(1);
    expect(AUTHORED.has(texts[0])).toBe(true);
  });

  it("returns all of them where one class carries several answers", () => {
    /* The ledger records the class, never the keystroke — the payload allowlist
       keeps learner free text out of the event stream. So which of the two
       answers was given is not knowable, and picking one would be a guess with
       the authority of a fact. */
    expect(justificationsFor(TWO_ANSWERS.block, TWO_ANSWERS.failureClass)).toHaveLength(2);
  });

  it("returns only the matching class where a block declares several", () => {
    const declared = Object.values(
      MONTHS[0].units
        .flatMap((u) => u.lessons.flatMap((l) => l.blocks))
        .find((b) => b.id === TWO_CLASSES.block)!.diagnosticMapping!,
    );
    /* "Several", not exactly two. This asserted `=== 2` and broke the moment a
       third distractor on the same block was given a class of its own — which
       is content getting better, not a regression. What the test is actually
       for is that a block carrying more than one class returns ONLY the class
       asked for, and that survives the block growing. */
    const classes = new Set(declared.map((m) => m.failureClass));
    expect(classes.size).toBeGreaterThan(1);
    expect(classes.has(TWO_CLASSES.failureClass)).toBe(true);

    const matching = declared.filter((m) => m.failureClass === TWO_CLASSES.failureClass);
    const texts = justificationsFor(TWO_CLASSES.block, TWO_CLASSES.failureClass);
    expect(texts).toHaveLength(matching.length);
    expect(new Set(texts)).toEqual(new Set(matching.map((m) => m.justification)));
  });

  it("returns nothing for a block that does not exist or has no mapping", () => {
    expect(justificationsFor("m1.l999.b1", "anything")).toEqual([]);
    expect(justificationsFor("m1.l1.b1", ONE_ANSWER.failureClass)).toEqual([]);
  });
});

describe("blockIdFromTaskRef", () => {
  it("reads the block out of the task ref the episode carries", () => {
    expect(blockIdFromTaskRef("sx-lesson:m1.l3.b3")).toBe("m1.l3.b3");
    expect(blockIdFromTaskRef("sx-assessment:m1.as.b1")).toBe("m1.as.b1");
    expect(blockIdFromTaskRef("sx-practice:m1.p1")).toBe("m1.p1");
  });

  it("returns null for anything that is not one", () => {
    expect(blockIdFromTaskRef("m1.l3.b3")).toBeNull();
    expect(blockIdFromTaskRef("sx-lesson:")).toBeNull();
    expect(blockIdFromTaskRef("")).toBeNull();
  });
});

describe("the handle", () => {
  it("is stable and distinguishes both halves of the key", () => {
    expect(refFor("m1.l3.b3", "a")).toBe(refFor("m1.l3.b3", "a"));
    expect(refFor("m1.l3.b3", "a")).not.toBe(refFor("m1.l3.b3", "b"));
    expect(refFor("m1.l3.b3", "a")).not.toBe(refFor("m1.l3.b4", "a"));
    expect(refFor("m1.l3.b3", "a")).toMatch(/^[0-9a-f]{16}$/);
  });

  it("resolves only against mistakes the caller's own ledger records", () => {
    /* This is the evidence check, and it is the addressing scheme rather than a
       validation somebody has to remember: there is no way to name an entry
       that is not already yours. */
    const mine = [mistake(ONE_ANSWER.block, ONE_ANSWER.failureClass)];
    const theirs = refFor(TWO_ANSWERS.block, TWO_ANSWERS.failureClass);

    expect(resolveRef(refFor(ONE_ANSWER.block, ONE_ANSWER.failureClass), mine, [])).toEqual({
      blockId: ONE_ANSWER.block,
      failureClass: ONE_ANSWER.failureClass,
    });
    expect(resolveRef(theirs, mine, [])).toBeNull();
    expect(resolveRef("0".repeat(16), mine, [])).toBeNull();
  });

  it("still resolves a saved entry, so a learner can add words later", () => {
    const saved: SavedErrorEntry[] = [
      { blockId: ONE_ANSWER.block, failureClass: ONE_ANSWER.failureClass, note: null, createdAt: "2026-01-01T00:00:00.000Z" },
    ];
    expect(resolveRef(refFor(ONE_ANSWER.block, ONE_ANSWER.failureClass), [], saved)).toEqual({
      blockId: ONE_ANSWER.block,
      failureClass: ONE_ANSWER.failureClass,
    });
  });

  it("refuses a mistake whose explanation the author has since withdrawn", () => {
    /* An author who removes a diagnostic mapping has decided that wrong answer
       no longer establishes a cause. Saving it afterwards would keep a card
       with nothing true on it. */
    expect(resolveRef(refFor("m1.l1.b1", "invented_class"), [mistake("m1.l1.b1", "invented_class")], []))
      .toBeNull();
  });
});

describe("buildDictionary", () => {
  it("separates what the learner kept from what is on offer", () => {
    const { saved, candidates } = buildDictionary(
      [
        mistake(ONE_ANSWER.block, ONE_ANSWER.failureClass, 3),
        mistake(TWO_ANSWERS.block, TWO_ANSWERS.failureClass, 1),
      ],
      [{ blockId: ONE_ANSWER.block, failureClass: ONE_ANSWER.failureClass, note: null, createdAt: "2026-08-20T10:00:00.000Z" }],
    );

    expect(saved.map((e) => e.blockId)).toEqual([ONE_ANSWER.block]);
    expect(candidates.map((e) => e.blockId)).toEqual([TWO_ANSWERS.block]);
    expect(saved[0].occurrences).toBe(3);
    expect(saved[0].lessonId).toBe("m1.l3");
    expect(saved[0].monthIndex).toBe(1);
    expect(saved[0].lessonTitle.kk).toBeTruthy();
    expect(saved[0].lessonTitle.ru).toBeTruthy();
  });

  it("keeps an entry whose evidence has aged out of the ledger", () => {
    /* Raw events are purged at 180 days (migration 0003), so a dictionary kept
       across a school year outlives its own evidence — which is exactly why an
       entry is a stored row and not a derivation. It stays; it simply has no
       recent count beside it, and the card omits the count rather than printing
       a zero that reads like a measurement. */
    const { saved } = buildDictionary(
      [],
      [{ blockId: ONE_ANSWER.block, failureClass: ONE_ANSWER.failureClass, note: null, createdAt: "2025-01-01T00:00:00.000Z" }],
    );
    expect(saved).toHaveLength(1);
    expect(saved[0].occurrences).toBe(0);
    expect(saved[0].lastAt).toBeNull();
  });

  it("drops an entry with nothing true left in it", () => {
    /* The block was removed, or the author withdrew the mapping and the learner
       never wrote their own words. What would be left is a card saying only
       "you got this wrong", which is the tone the whole feature exists to
       avoid. */
    const gone: SavedErrorEntry = { blockId: "m1.l999.b1", failureClass: "x", note: null, createdAt: "2026-01-01T00:00:00.000Z" };
    const unexplained: SavedErrorEntry = { blockId: "m1.l1.b1", failureClass: "withdrawn", note: null, createdAt: "2026-01-01T00:00:00.000Z" };
    expect(buildDictionary([], [gone, unexplained]).saved).toEqual([]);
  });

  it("keeps an entry the author no longer explains when the learner wrote their own words", () => {
    const mine: SavedErrorEntry = {
      blockId: "m1.l1.b1",
      failureClass: "withdrawn",
      note: "мен мұнда тырнақшаны байқамадым",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const { saved } = buildDictionary([], [mine]);
    expect(saved).toHaveLength(1);
    expect(saved[0].justifications).toEqual([]);
    expect(saved[0].note).toBe(mine.note);
  });

  it("ignores a mistake whose task ref names no block", () => {
    const broken: AttributedMistake = {
      taskRef: "sx-lesson:",
      failureClass: ONE_ANSWER.failureClass,
      occurrences: 1,
      lastAt: "2026-08-20T10:00:00.000Z",
    };
    expect(buildDictionary([broken], []).candidates).toEqual([]);
  });

  it("collapses a repeated mistake into one entry", () => {
    const twice = [
      mistake(ONE_ANSWER.block, ONE_ANSWER.failureClass, 2),
      mistake(ONE_ANSWER.block, ONE_ANSWER.failureClass, 5),
    ];
    expect(buildDictionary(twice, []).candidates).toHaveLength(1);
  });
});
