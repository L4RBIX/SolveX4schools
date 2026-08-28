/**
 * The reference-asset registry.
 *
 * ## What this is for
 *
 * Every image, video and animation on a production route that came from
 * brilliant.org's CDN during the reverse-engineering phase is listed here, with
 * the routes that render it and how urgently it needs replacing.
 *
 * They are here **temporarily and on purpose**. Downloading a competitor's
 * assets to measure a design is legitimate; serving them from a product a
 * school pays for is redistribution. This phase was scoped to finish the
 * product's structure and defer the artwork swap, so the swap is made cheap
 * instead of pretended away:
 *
 * - one module owns every path, so no component holds a raw asset URL
 * - every entry records what the slot is FOR, so replacement art can be
 *   commissioned against a brief instead of guessed at
 * - `remainingReferenceAssets()` returns the exact count, so the number in a
 *   status report is read from the code rather than remembered
 *
 * `docs/REFERENCE_ASSET_REPLACEMENT.md` is generated from this list.
 *
 * ## What is deliberately NOT here
 *
 * Anything already resolved. CoFo Brilliant and CoFo Robert are declared only
 * inside `src/app/brilliant/layout.tsx` (which 404s in production) with the
 * files under `reference/fonts/` rather than `public/`; Strobi is rendered from
 * a definition file by our own code, so the AGPL package is neither installed
 * nor imported. Listing settled questions as open ones makes the real list
 * easier to ignore.
 */

export type ReplacementPriority =
  /** Renders on a public marketing surface. Most visible, most exposed. */
  | "before-public-launch"
  /** Renders inside the product for signed-in learners. */
  | "before-final-public-release"
  /** Development-only routes. Never served in production. */
  | "development-only";

export interface ReferenceAsset {
  id: string;
  /** Path under `public/`, or a module-relative import path. */
  assetPath: string;
  /** What the slot depicts, for whoever commissions the replacement. */
  intent: string;
  routes: readonly string[];
  temporaryReferenceAsset: true;
  replacementNeeded: true;
  replacementPriority: ReplacementPriority;
}

const CH = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter";
const CH2 = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/chapter";
const CAT = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/category-images";
const BRI = "/assets/original/brilliant/brilliant.org";

export const REFERENCE_ASSETS: readonly ReferenceAsset[] = [
  /* ---- public marketing surfaces ------------------------------------- */
  {
    id: "landing-hero-clip",
    assetPath: `${BRI}/videos/homepage/courses/cs-refresh.webm`,
    intent:
      "17s ambient loop behind the landing hero — someone writing and running short code",
    routes: ["/"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-public-launch",
  },
  {
    id: "landing-hero-poster",
    assetPath: `${BRI}/videos/homepage/courses/posters/cs-refresh.png`,
    intent: "Poster frame shown when the hero clip cannot autoplay",
    routes: ["/"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-public-launch",
  },
  {
    id: "get-started-art",
    assetPath: `${BRI}/images/homepage/get-started`,
    intent: "Closing call-to-action illustration on the landing page",
    routes: ["/"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-public-launch",
  },
  {
    id: "about-why",
    assetPath: `${CH}/logic-deduction-fHm1JW.png`,
    intent: "Reasoning made visible — a problem being taken apart into steps",
    routes: ["/about"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-public-launch",
  },
  {
    id: "about-approach",
    assetPath: `${CH}/thinking-in-code-DolooX.png`,
    intent: "Short explanation followed immediately by hands-on practice",
    routes: ["/about"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-public-launch",
  },
  {
    id: "about-nova",
    assetPath: `${CH}/knowledge-and-uncertainty-TdnBt2.png`,
    intent: "A tutor asking a question rather than handing over an answer",
    routes: ["/about"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-public-launch",
  },

  /* ---- in-product artwork -------------------------------------------- */
  {
    id: "programme-art",
    assetPath: `${CAT}/Computer_Science-JEbqeF.png`,
    intent: "The programme as a whole, on the learning-path row",
    routes: ["/program"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "month-art-1",
    assetPath: `${CH}/logical-languages-PaiPd6.png`,
    intent: "Reading input, computing, choosing an answer with a condition",
    routes: ["/home", "/program", "/course/1", "/lesson/[id]"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "month-art-2",
    assetPath: `${CH}/creative-coding-dsGE0e.png`,
    intent: "Repetition — a loop running over a list of values",
    routes: ["/home", "/program", "/course/2"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "month-art-3",
    assetPath: `${CH}/Programming_with_Functions-NL91vb.png`,
    intent: "Functions — a task broken into named, reusable parts",
    routes: ["/home", "/program", "/course/3"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "month-art-4",
    assetPath: `${CH}/computer-science-algorithms-jF6RDo.png`,
    intent: "Speed — the same answer reached by a cheaper route",
    routes: ["/home", "/program", "/course/4"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "month-art-5",
    assetPath: `${CH}/search-fundamentals-G1nv3e.png`,
    intent: "Halving a search space; converging boundaries",
    routes: ["/home", "/program", "/course/5"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "month-art-6",
    assetPath: `${CH}/Recursion_in_Python_1-FEJb29.png`,
    intent: "Recursion — a call tree unfolding and folding back",
    routes: ["/home", "/program", "/course/6"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "month-art-7",
    assetPath: `${CH}/skip-Clustering-9m6GmH.png`,
    intent: "Grids and paths — a wave spreading, connected regions",
    routes: ["/home", "/program", "/course/7"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "month-art-8",
    assetPath: `${CH2}/Algorithmic_Thinking-ZSOEgi.png`,
    intent: "Greedy choice versus a table built from previous answers",
    routes: ["/home", "/program", "/course/8"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "month-art-9",
    assetPath: `${CH}/math-competition-fundamentals-ifmZin.png`,
    intent: "Contests — timed rounds and a final tournament",
    routes: ["/home", "/program", "/course/9"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "assessment-art",
    assetPath: `${CH}/foundation-puzzles-long-set-gYC4xn.png`,
    intent: "The monthly check — deliberately distinct from a lesson",
    routes: ["/course/[index]", "/assessment/[month]"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "lesson-scene-setter",
    assetPath: `${BRI}/../ds055uzetaobb.cloudfront.net/brioche/uploads/lessons/scene-setter-final-FtktQS.png`,
    intent: "Full-bleed scene image on a lesson's opening page",
    routes: ["/lesson/[id]"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },
  {
    id: "lesson-art-m1",
    assetPath: `${CH}/*.png (9 files, one per September lesson)`,
    intent: "Per-lesson scene-setters for September, keyed by lesson id",
    routes: ["/lesson/m1.l1 … /lesson/m1.l9"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "before-final-public-release",
  },

  /* ---- development only ---------------------------------------------- */
  {
    id: "gameboard-rive",
    assetPath: `${BRI}/rive/koji-gameboard.e2320c48.riv`,
    intent:
      "The reference gameboard node animation. NOT rendered in the product — " +
      "`ownMascot` takes the native branch, because this scene puts Koji on " +
      "the learner's current node",
    routes: ["/brilliant/app/course"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "development-only",
  },
  {
    id: "koji-rive",
    assetPath: `${BRI}/rive/meet_koji.0dced838.riv`,
    intent: "The reference mascot. Never rendered on a product route.",
    routes: ["/brilliant", "/brilliant/lesson"],
    temporaryReferenceAsset: true,
    replacementNeeded: true,
    replacementPriority: "development-only",
  },
];

const BY_ID = new Map(REFERENCE_ASSETS.map((a) => [a.id, a]));

/**
 * Resolve an asset path by id.
 *
 * Throws on an unknown id rather than returning a broken URL. A missing
 * illustration that renders as an empty box is the kind of defect that survives
 * to production because nobody notices one blank square; a thrown error in
 * development is noticed immediately.
 */
export function referenceAsset(id: string): string {
  const found = BY_ID.get(id);
  if (!found) {
    throw new Error(
      `Unknown reference asset "${id}". Add it to schools/assets/registry.ts ` +
        `rather than inlining a path — see the note at the top of that file.`,
    );
  }
  return found.assetPath;
}

/** Assets that still render on a route a paying school can reach. */
export function productionReferenceAssets(): ReferenceAsset[] {
  return REFERENCE_ASSETS.filter((a) => a.replacementPriority !== "development-only");
}

export function remainingReferenceAssets(): number {
  return REFERENCE_ASSETS.length;
}
