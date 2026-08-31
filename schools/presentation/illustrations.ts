/**
 * The illustration registry.
 *
 * ONE place that maps curriculum entities to artwork. Everything that needs a
 * picture — month cards, course tiles, gameboard headers, lesson scene-setters,
 * the home deck — resolves it through here.
 *
 * Why centralised: the artwork is temporary. It is the Brilliant clone's
 * downloaded chapter art, kept because a real illustration beats a grey box
 * while the product is being built. When it is replaced, this file changes and
 * nothing else does.
 *
 * Assignments are semantic, not arbitrary. `Programming_with_Functions` really
 * is the functions month; `search-fundamentals` really is the binary-search
 * month. Where no honest match existed the closest concept was used and the
 * reason is written down, so a later replacement knows what the slot means.
 *
 * ## One slot depicts the wrong language
 *
 * February — `MONTH_ART[6]`, recursion — is drawn by
 * `Recursion_in_Python_1-FEJb29.png`, and that file is not neutral chapter art:
 * it is a purple SNAKE at a laptop, Python's mascot, on a course that teaches
 * C++17. It is the only asset in this registry that names or depicts a
 * programming language at all, and it reaches a learner on `/home`, `/program`
 * and `/course/6`.
 *
 * It is NOT swapped here. Brilliant-derived artwork is the owner's to replace,
 * and quietly repointing the slot at a different downloaded illustration would
 * hide the problem rather than fix it — the same picture would still be in the
 * tree, and the brief for the replacement would be lost. So the slot keeps its
 * `intent`, gains a `wrongLanguage` flag, and `pythonArtNeedingReplacement`
 * below makes the list assertable rather than a comment nobody reads.
 *
 * The identical finding is recorded a second time in
 * `schools/assets/registry.ts` (`month-art-6`), which already carries
 * `replacementNeeded: true` for every slot in this file. That registry is the
 * release gate; this flag is so a reader of THIS file learns it too.
 */

const CH = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter";
const CH2 = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/chapter";
const CAT = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/category-images";

/** Programme-level art, used on the learning-path row. */
export const PROGRAMME_ART = `${CAT}/Computer_Science-JEbqeF.png`;

export interface MonthArt {
  src: string;
  /** What the slot is *for*, so replacement art can be briefed, not guessed. */
  intent: string;
  /**
   * The illustration depicts a programming language that is not the one taught.
   *
   * Set only where it is true, so the absence of the flag is not a claim. Read
   * by `pythonArtNeedingReplacement()`.
   */
  wrongLanguage?: string;
}

/** Month art. Indexed 1–9, September to May. */
export const MONTH_ART: Record<number, MonthArt> = {
  1: {
    src: `${CH}/logical-languages-PaiPd6.png`,
    intent: "reading input, computing, and choosing an answer with a condition",
  },
  2: {
    src: `${CH}/creative-coding-dsGE0e.png`,
    intent: "repetition — loops running over a list of values",
  },
  3: {
    src: `${CH}/Programming_with_Functions-NL91vb.png`,
    intent: "functions — a task broken into named, reusable parts",
  },
  4: {
    src: `${CH}/computer-science-algorithms-jF6RDo.png`,
    intent: "speed — the same answer reached by a cheaper route",
  },
  5: {
    src: `${CH}/search-fundamentals-G1nv3e.png`,
    intent: "halving a search space; converging boundaries",
  },
  6: {
    // The file name says Python and so does the drawing: it is the Python
    // snake, coiled around a laptop. Kept until the owner replaces the
    // artwork; flagged so the release gate and any reader can see it.
    src: `${CH}/Recursion_in_Python_1-FEJb29.png`,
    intent: "recursion — a call tree unfolding and folding back",
    wrongLanguage: "Python — the drawing is the Python snake mascot",
  },
  7: {
    // Clustering is the closest available concept: connected regions on a grid
    // are exactly what BFS/DFS discover in this month.
    src: `${CH}/skip-Clustering-9m6GmH.png`,
    intent: "grids and paths — a wave spreading, connected regions",
  },
  8: {
    src: `${CH2}/Algorithmic_Thinking-ZSOEgi.png`,
    intent: "greedy choice versus a table built from previous answers",
  },
  9: {
    src: `${CH}/math-competition-fundamentals-ifmZin.png`,
    intent: "contests — timed rounds and a final tournament",
  },
};

/**
 * Lesson scene-setter, shown at the top of a lesson's opening page.
 *
 * Falls back to the month's art. A per-lesson slot exists because the
 * programme's own lessons carry an `illustrationId`, and because a scene-setter
 * that changes per lesson is one of the things that makes the player feel
 * authored rather than generated.
 */
const LESSON_ART: Record<string, string> = {
  "m1.l1": `${CH}/thinking-in-code-DolooX.png`,
  "m1.l2": `${CH}/using-variables-iy9wL7.png`,
  "m1.l3": `${CH}/basic-number-theory-aLh2ND.png`,
  "m1.l4": `${CH}/logic-deduction-fHm1JW.png`,
  "m1.l5": `${CH}/Toggle_Logic_Course_Card-MGztCN.png`,
  "m1.l6": `${CH}/logical-languages-PaiPd6.png`,
  "m1.l7": `${CH}/knowledge-and-uncertainty-TdnBt2.png`,
  "m1.l8": `${CH}/strategic-puzzles-long-set-W1RfF3.png`,
  "m1.l9": `${CH}/puzzles-100-pLCnZk.png`,
};

export function monthArt(monthIndex: number): string {
  return MONTH_ART[monthIndex]?.src ?? PROGRAMME_ART;
}

export function lessonArt(lessonId: string, monthIndex: number): string {
  return LESSON_ART[lessonId] ?? monthArt(monthIndex);
}

/** Art for the monthly assessment node. Deliberately distinct from a lesson. */
export const ASSESSMENT_ART = `${CH}/foundation-puzzles-long-set-gYC4xn.png`;

/**
 * Every month slot whose artwork depicts a language this course does not teach.
 *
 * A function rather than a constant so it cannot drift from `MONTH_ART`: add a
 * Python-shaped illustration and it appears here without anybody remembering to
 * list it. Empty is the goal state, and empty is what it will return once the
 * artwork is replaced.
 */
export function pythonArtNeedingReplacement(): {
  monthIndex: number;
  src: string;
  intent: string;
  depicts: string;
}[] {
  const out: { monthIndex: number; src: string; intent: string; depicts: string }[] = [];
  for (const [index, art] of Object.entries(MONTH_ART)) {
    if (art.wrongLanguage === undefined) continue;
    out.push({
      monthIndex: Number(index),
      src: art.src,
      intent: art.intent,
      depicts: art.wrongLanguage,
    });
  }
  return out;
}

/** The full-bleed scene image the lesson player's opening page uses. */
export const SCENE_SETTER =
  "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/uploads/lessons/scene-setter-final-FtktQS.png";
