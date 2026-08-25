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
 */

const CH = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter";
const CH2 = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/chapter";
const CAT = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/category-images";

/** Programme-level art, used on the learning-path row. */
export const PROGRAMME_ART = `${CAT}/Computer_Science-JEbqeF.png`;

/**
 * Month art. Indexed 1–9, September to May.
 *
 * `intent` records what the slot is *for*, so replacement artwork can be
 * commissioned against a brief rather than guessed at.
 */
export const MONTH_ART: Record<number, { src: string; intent: string }> = {
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
    src: `${CH}/Recursion_in_Python_1-FEJb29.png`,
    intent: "recursion — a call tree unfolding and folding back",
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

/** The full-bleed scene image the lesson player's opening page uses. */
export const SCENE_SETTER =
  "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/uploads/lessons/scene-setter-final-FtktQS.png";
