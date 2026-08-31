/**
 * `brilliant.org/courses/thinking-in-code/` — the course gameboard.
 *
 * Levels, lesson names and the zig-zag side of every node were read out of the
 * live DOM, not authored here. The side is not a pixel offset in the original:
 * each 392px row sets `justify-content: center | flex-start | flex-end`, and
 * that is reproduced verbatim.
 */

export type NodeSide = "center" | "flex-start" | "flex-end";

export interface GameboardNode {
  title: string;
  side: NodeSide;
  /** The learner's current lesson — renders Koji on the pedestal. */
  active?: boolean;
  /** Closing node of a level; the original draws it with a cog outline. */
  review?: boolean;
  href?: string;
  /** The learner has finished it. Added for the curriculum board. */
  done?: boolean;
  /** Not authored yet, or not reached yet. Renders greyed and is not clickable. */
  locked?: boolean;
  /**
   * What kind of curriculum event this node is. The reference data omits it and
   * the board treats a missing value as a plain lesson.
   */
  kind?: "lesson" | "practice" | "checkpoint" | "assessment" | "contest";
}

export interface GameboardLevel {
  index: number;
  title: string;
  nodes: GameboardNode[];
}

export interface GameboardCourse {
  title: string;
  blurb: string;
  lessons: string;
  exercises: string;
  art: string;
  /** The lesson the sticky footer offers by default. */
  activeHref: string;
}

export const COURSE: GameboardCourse = {
  title: "Thinking in Code",
  blurb: "Build solid foundations for computational problem solving.",
  lessons: "48 Lessons",
  exercises: "588 Exercises",
  art: "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/brioche/chapter/thinking-in-code-DolooX.png",
  /** The lesson the sticky footer offers by default. */
  activeHref: "/brilliant/lesson",
};

export const LEVELS: GameboardLevel[] = [
  {
    index: 1,
    title: "Taking the First Steps",
    nodes: [
      { title: "Writing Programs", side: "center", active: true, href: "/brilliant/lesson" },
      { title: "Sequencing Commands", side: "flex-start" },
      { title: "Repeating Patterns", side: "center" },
      { title: "Debugging Programs", side: "flex-end" },
      { title: "Looping With Logic", side: "center" },
      { title: "While Loop Challenge", side: "flex-start" },
      { title: "Level Review", side: "center", review: true },
    ],
  },
  {
    index: 2,
    title: "Loops",
    nodes: [
      { title: "Recognizing Patterns", side: "flex-end" },
      { title: "Controlling with Logic", side: "center" },
      { title: "Nesting Loops", side: "flex-start" },
      { title: "Combining Loops", side: "center" },
      { title: "Loop Combo Challenge", side: "flex-end" },
      { title: "Level Review", side: "center", review: true },
    ],
  },
  {
    index: 3,
    title: "Branching",
    nodes: [
      { title: "Using if Statements", side: "flex-start" },
      { title: "Preventing Errors", side: "center" },
      { title: "Using if-else Statements", side: "flex-end" },
      { title: "Branching with Logic", side: "center" },
      { title: "Branching Challenge", side: "flex-start" },
      { title: "Level Review", side: "center", review: true },
    ],
  },
  {
    index: 4,
    title: "Designing Programs",
    nodes: [
      { title: "Conditioning on History", side: "flex-end" },
      { title: "Nesting Logic", side: "center" },
      { title: "Complex Branching", side: "flex-start" },
      { title: "Complex Logic", side: "center" },
      { title: "Designing Programs", side: "flex-end" },
      { title: "Level Review", side: "center", review: true },
    ],
  },
  {
    index: 5,
    title: "Applications in Automation",
    nodes: [
      { title: "Programming a Website", side: "flex-start" },
      { title: "Automating Emails", side: "center" },
      { title: "Automating Social Media", side: "flex-end" },
      { title: "Programming an App", side: "center" },
      { title: "Level Review", side: "flex-start", review: true },
    ],
  },
  {
    index: 6,
    title: "Variables",
    nodes: [
      { title: "Structuring Code", side: "center" },
      { title: "Combining Commands", side: "flex-end" },
      { title: "Using Inputs", side: "center" },
      { title: "Using Variables", side: "flex-start" },
      { title: "Updating Variables", side: "center" },
      { title: "Incrementing Variables", side: "flex-end" },
      { title: "Looping with Variables", side: "center" },
      { title: "Level Review", side: "flex-start", review: true },
    ],
  },
  {
    index: 7,
    title: "Working with Lists",
    nodes: [
      { title: "Looping with Lists", side: "center" },
      { title: "Processing Input", side: "flex-end" },
      { title: "Dealing with Cases", side: "center" },
      { title: "Navigating a Grid", side: "flex-start" },
      { title: "Nesting For Loops", side: "center" },
      { title: "Level Review", side: "flex-end", review: true },
    ],
  },
  {
    index: 8,
    title: "Exploring with Logic",
    nodes: [
      { title: "Controlling Loops", side: "center" },
      { title: "Avoiding Obstacles", side: "flex-start" },
      { title: "Finding Shortcuts", side: "center" },
      { title: "Chaining Conditionals", side: "flex-end" },
      { title: "Using Boolean Logic", side: "center" },
      { title: "Extending Logic", side: "flex-start" },
      { title: "Level Review", side: "center", review: true },
    ],
  },
  {
    index: 9,
    title: "Building Programs",
    nodes: [
      { title: "Building Helpers", side: "flex-end" },
      { title: "Logical Ordering", side: "center" },
      { title: "Streamlining Logic", side: "flex-start" },
      { title: "Solving Mazes", side: "center" },
      { title: "Building Programs", side: "flex-end" },
      { title: "Level Review", side: "center", review: true },
    ],
  },
];

/** The level the learner is on — the only one whose header reads purple. */
export const CURRENT_LEVEL = 1;
