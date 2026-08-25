/**
 * Content for one brilliant.org lesson.
 *
 * The live player sits behind the signup wall, so the structure here follows
 * brilliant.org's documented lesson shape — intro, worked visual, manipulable
 * diagram, checked question, reaction, harder question, summary — with the
 * subject matter kept as Brilliant's own (Visualize Fractions, Level 1).
 */

/** The three inline-SVG figures `ExplanationBlock` can draw. */
export type DiagramKind = "halves" | "unequal" | "quarters";

export interface QuestionOption {
  id: string;
  label: string;
  correct: boolean;
}

/** A figure attached to a question screen, resolved to a node by the player. */
export type QuestionFigure =
  | { type: "diagram"; kind: DiagramKind }
  | { type: "parts"; parts: number; shaded: number; caption?: string };

export interface IntroScreenData {
  kind: "intro";
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  meta: string;
}

export interface ExplanationScreenData {
  kind: "explanation";
  id: string;
  eyebrow?: string;
  title: string;
  paragraphs: string[];
  diagram: DiagramKind;
}

export interface InteractiveScreenData {
  kind: "interactive";
  id: string;
  eyebrow?: string;
  title: string;
  hint: string;
}

export interface QuestionScreenData {
  kind: "question";
  id: string;
  eyebrow?: string;
  prompt: string;
  figure?: QuestionFigure;
  options: QuestionOption[];
  explanation: string;
  correctMessage: string;
  wrongMessage: string;
}

export interface SummaryStat {
  value: string;
  label: string;
}

export interface SummaryScreenData {
  kind: "summary";
  id: string;
  title: string;
  description: string;
  stats: SummaryStat[];
}

/** Every screen the lesson player knows how to render. */
export type LessonScreenData =
  | IntroScreenData
  | ExplanationScreenData
  | InteractiveScreenData
  | QuestionScreenData
  | SummaryScreenData;

export const equalPartsLesson: LessonScreenData[] = [
  {
    kind: "intro",
    id: "intro",
    eyebrow: "Level 1 · Visualize Fractions",
    title: "Equal Parts",
    description:
      "A fraction only means something when the whole is split into parts of the same size. Let's see what that looks like.",
    meta: "5 exercises · about 4 minutes",
  },
  {
    kind: "explanation",
    id: "whole-in-two",
    eyebrow: "The whole",
    title: "One whole, two equal parts",
    paragraphs: [
      "Cut a whole straight through the middle and you get two parts of exactly the same size.",
      "Each one is one half of the whole, written 1/2.",
    ],
    diagram: "halves",
  },
  {
    kind: "interactive",
    id: "split-the-bar",
    eyebrow: "Try it",
    title: "Split the bar into halves",
    hint: "Drag the divider until both parts are equal.",
  },
  {
    kind: "question",
    id: "where-does-the-cut-go",
    prompt:
      "Where does the cut have to land to split this bar into two equal parts?",
    figure: { type: "parts", parts: 1, shaded: 0, caption: "one whole" },
    options: [
      { id: "quarter", label: "1/4 of the way", correct: false },
      { id: "third", label: "1/3 of the way", correct: false },
      { id: "half", label: "1/2 of the way", correct: true },
      { id: "two-thirds", label: "2/3 of the way", correct: false },
    ],
    explanation:
      "Two parts are equal only when the cut lands exactly halfway along the whole. Anywhere else leaves one part bigger than the other.",
    correctMessage: "Nice. Both parts are the same size.",
    wrongMessage: "Not quite — those parts aren't equal.",
  },
  {
    kind: "explanation",
    id: "two-pieces-isnt-two-halves",
    eyebrow: "Why it works",
    title: "Two pieces isn't the same as two halves",
    paragraphs: [
      "Cutting a whole in two doesn't automatically make halves. The pieces have to be the same size.",
      "Slide the cut to the middle and the two pieces finally match. Now each one is 1/2.",
    ],
    diagram: "unequal",
  },
  {
    kind: "question",
    id: "cut-twice",
    eyebrow: "Problem solving",
    prompt:
      "A square is cut in half, then each half is cut in half again. If you shade three of the pieces, what fraction of the square is shaded?",
    figure: { type: "diagram", kind: "quarters" },
    options: [
      { id: "one-quarter", label: "1/4", correct: false },
      { id: "one-third", label: "1/3", correct: false },
      { id: "three-eighths", label: "3/8", correct: false },
      { id: "three-quarters", label: "3/4", correct: true },
    ],
    explanation:
      "Two cuts give four pieces of the same size, so each piece is 1/4 of the square. Three of them shaded is 3/4.",
    correctMessage: "Exactly. Three of four equal parts is 3/4.",
    wrongMessage: "Not quite — start by counting the equal parts.",
  },
  {
    kind: "summary",
    id: "summary",
    title: "Lesson complete",
    description:
      "You can spot equal parts now — and that is what makes a fraction a fraction.",
    stats: [
      { value: "5/5", label: "correct" },
      { value: "+40", label: "XP" },
      { value: "4", label: "min" },
    ],
  },
];
