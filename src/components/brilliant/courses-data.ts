/**
 * Content for the brilliant.org dark course surfaces:
 *   /courses            — three learning paths, six tiles each
 *   /courses/<slug>     — the Fractions course map, three levels of lesson nodes
 *
 * Vocabulary, grade bands, lesson names and the 27 lessons / 375 exercises
 * counters are taken from the live pages. `art` keys into the inline-SVG
 * registry in `path-tile.tsx` — there are no raster assets on these routes.
 */

export type ArtKind =
  | "pie"
  | "numberline"
  | "percent"
  | "scale"
  | "axes"
  | "equation"
  | "slope"
  | "intersect"
  | "power"
  | "parabola"
  | "machine"
  | "polynomial"
  | "triangle"
  | "logcurve"
  | "sequence"
  | "vector"
  | "limit"
  | "tangent"
  | "blocks"
  | "xy"
  | "sigma";

export interface PathTileData {
  /** Stable key, also the course slug the tile would link to. */
  slug: string;
  /** Sits below the tile, outside the frame. */
  label: string;
  /** Grade chip in the tile's top-left corner, e.g. `GR 4–5`. */
  grade: string;
  art: ArtKind;
  /** Renders the green `NEW` pill in the top-right corner. */
  isNew?: boolean;
}

export interface LearningPathData {
  id: string;
  /** Uppercase eyebrow above the title, e.g. `GRADES 4–7`. */
  eyebrow: string;
  title: string;
  description: string;
  art: ArtKind;
  tiles: PathTileData[];
}

export const LEARNING_PATHS: LearningPathData[] = [
  {
    id: "math-foundations",
    eyebrow: "Grades 4–7",
    title: "Math Foundations",
    description:
      "Build the number sense that every later course leans on, one visual at a time.",
    art: "blocks",
    tiles: [
      {
        slug: "fractions",
        label: "Fractions",
        grade: "GR 4–5",
        art: "pie",
        isNew: true,
      },
      {
        slug: "negative-numbers",
        label: "Negative Numbers",
        grade: "GR 5–6",
        art: "numberline",
      },
      { slug: "percents", label: "Percents", grade: "GR 6–7", art: "percent" },
      {
        slug: "proportional-reasoning",
        label: "Proportional Reasoning",
        grade: "GR 6–7",
        art: "scale",
      },
      {
        slug: "coordinate-plane",
        label: "Coordinate Plane",
        grade: "GR 6–7",
        art: "axes",
      },
      {
        slug: "solving-equations",
        label: "Solving Equations",
        grade: "GR 7",
        art: "equation",
      },
    ],
  },
  {
    id: "algebra",
    eyebrow: "Grades 8–10",
    title: "Algebra",
    description:
      "Move from arithmetic to structure — the language the rest of math is written in.",
    art: "xy",
    tiles: [
      {
        slug: "linear-equations",
        label: "Linear Equations",
        grade: "GR 8",
        art: "slope",
      },
      {
        slug: "systems-of-equations",
        label: "Systems of Equations",
        grade: "GR 8–9",
        art: "intersect",
      },
      {
        slug: "exponents-and-radicals",
        label: "Exponents & Radicals",
        grade: "GR 9",
        art: "power",
      },
      {
        slug: "quadratics",
        label: "Quadratics",
        grade: "GR 9–10",
        art: "parabola",
        isNew: true,
      },
      {
        slug: "functions",
        label: "Functions",
        grade: "GR 9–10",
        art: "machine",
      },
      {
        slug: "polynomials",
        label: "Polynomials",
        grade: "GR 10",
        art: "polynomial",
      },
    ],
  },
  {
    id: "advanced-math",
    eyebrow: "Grades 10–12",
    title: "Advanced Math",
    description:
      "Trig, growth and change — the on-ramp to calculus, built from pictures first.",
    art: "sigma",
    tiles: [
      {
        slug: "trigonometry",
        label: "Trigonometry",
        grade: "GR 10–11",
        art: "triangle",
      },
      {
        slug: "logarithms",
        label: "Logarithms",
        grade: "GR 11",
        art: "logcurve",
      },
      {
        slug: "sequences-and-series",
        label: "Sequences & Series",
        grade: "GR 11",
        art: "sequence",
      },
      { slug: "vectors", label: "Vectors", grade: "GR 11–12", art: "vector" },
      {
        slug: "limits",
        label: "Limits",
        grade: "GR 12",
        art: "limit",
        isNew: true,
      },
      {
        slug: "derivatives",
        label: "Derivatives",
        grade: "GR 12",
        art: "tangent",
      },
    ],
  },
];

export type NodeStatus = "complete" | "current" | "available" | "locked";
export type NodeKind = "lesson" | "check";

export interface LessonNodeData {
  id: string;
  title: string;
  status: NodeStatus;
  kind: NodeKind;
  /** Tooltip copy for locked nodes, e.g. what has to be finished first. */
  unlockHint?: string;
}

export interface CourseLevelData {
  id: string;
  /** Numeral shown in the sticky pill eyebrow — `LEVEL 1`. */
  index: number;
  title: string;
  nodes: LessonNodeData[];
}

export interface CourseData {
  slug: string;
  title: string;
  description: string;
  art: ArtKind;
  lessonCount: number;
  exerciseCount: number;
  levels: CourseLevelData[];
}

export const FRACTIONS_COURSE: CourseData = {
  slug: "fractions",
  title: "Fractions",
  description:
    "Learn to wield important tools in number sense and computation.",
  art: "pie",
  lessonCount: 27,
  exerciseCount: 375,
  levels: [
    {
      id: "visualize-fractions",
      index: 1,
      title: "Visualize Fractions",
      nodes: [
        { id: "finding-half", title: "Finding Half", status: "complete", kind: "lesson" },
        {
          id: "combining-parts",
          title: "Combining Parts",
          status: "complete",
          kind: "lesson",
        },
        {
          id: "splitting-parts",
          title: "Splitting Parts",
          status: "current",
          kind: "lesson",
        },
        {
          id: "splitting-and-combining",
          title: "Splitting and Combining",
          status: "available",
          kind: "lesson",
        },
        {
          id: "equal-parts",
          title: "Equal Parts",
          status: "available",
          kind: "lesson",
        },
        {
          id: "level-1-check",
          title: "Level check",
          status: "locked",
          kind: "check",
          unlockHint: "Finish every lesson in Level 1 to unlock the level check.",
        },
      ],
    },
    {
      id: "equivalent-fractions",
      index: 2,
      title: "Equivalent Fractions",
      nodes: [
        {
          id: "sixths-and-twelfths",
          title: "Sixths and Twelfths",
          status: "locked",
          kind: "lesson",
          unlockHint: "Complete the Level 1 check to unlock this lesson.",
        },
        {
          id: "eighths-and-sixteenths",
          title: "Eighths and Sixteenths",
          status: "locked",
          kind: "lesson",
          unlockHint: "Complete Sixths and Twelfths to unlock this lesson.",
        },
        {
          id: "common-denominators",
          title: "Common Denominators",
          status: "locked",
          kind: "lesson",
          unlockHint: "Complete Eighths and Sixteenths to unlock this lesson.",
        },
        {
          id: "level-2-check",
          title: "Level check",
          status: "locked",
          kind: "check",
          unlockHint: "Finish every lesson in Level 2 to unlock the level check.",
        },
      ],
    },
    {
      id: "adding-fractions",
      index: 3,
      title: "Adding Fractions",
      nodes: [
        {
          id: "adding-like-parts",
          title: "Adding Like Parts",
          status: "locked",
          kind: "lesson",
          unlockHint: "Complete the Level 2 check to unlock this lesson.",
        },
        {
          id: "unlike-denominators",
          title: "Unlike Denominators",
          status: "locked",
          kind: "lesson",
          unlockHint: "Complete Adding Like Parts to unlock this lesson.",
        },
        {
          id: "mixed-numbers",
          title: "Mixed Numbers",
          status: "locked",
          kind: "lesson",
          unlockHint: "Complete Unlike Denominators to unlock this lesson.",
        },
        {
          id: "level-3-check",
          title: "Level check",
          status: "locked",
          kind: "check",
          unlockHint: "Finish every lesson in Level 3 to unlock the level check.",
        },
      ],
    },
  ],
};
