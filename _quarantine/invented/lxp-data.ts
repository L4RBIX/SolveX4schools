/**
 * Demo data for the Elice LXP student experience.
 *
 * The live trial tenant (trial-qazaq-b2.elice.io/lxp/home) sits behind a login
 * and serves an empty DOM, so nothing here was scraped from it. Subject matter,
 * course naming and the coding-task shape follow Elice's public catalogue
 * (elice.io/en, elice.io/en/ax/lxp); the values themselves are demo content.
 */

export interface Student {
  name: string;
  firstName: string;
  initials: string;
  track: string;
}

export const STUDENT: Student = {
  name: "Aigerim K.",
  firstName: "Aigerim",
  initials: "AK",
  track: "Data Science track",
};

/** Today, written out once so the dashboard and the deadline list agree. */
export const TODAY_LABEL = "Thursday, 12 March 2026";

export type CourseStatus = "in-progress" | "completed" | "not-started";

export interface Course {
  id: string;
  title: string;
  category: string;
  /** 0–100. */
  progress: number;
  lessonsDone: number;
  lessonsTotal: number;
  nextLesson: string;
  /** Base hue (deg) for the card's gradient banner. */
  hue: number;
  chips: string[];
}

export const COURSES: Course[] = [
  {
    id: "data-analysis-python",
    title: "Data Analysis with Python",
    category: "Data Science",
    progress: 60,
    lessonsDone: 12,
    lessonsTotal: 20,
    nextLesson: "Grouping and aggregating with pandas",
    hue: 258,
    chips: ["Python", "pandas"],
  },
  {
    id: "math-for-ml",
    title: "Mathematics for Machine Learning",
    category: "Mathematics",
    progress: 35,
    lessonsDone: 7,
    lessonsTotal: 20,
    nextLesson: "Eigenvalues, in practice",
    hue: 218,
    chips: ["NumPy", "Linear algebra"],
  },
  {
    id: "llm-prompting",
    title: "LLMs and Prompt Engineering",
    category: "Applied AI",
    progress: 0,
    lessonsDone: 0,
    lessonsTotal: 16,
    nextLesson: "What a language model actually predicts",
    hue: 286,
    chips: ["LLM", "API"],
  },
  {
    id: "it-fundamentals",
    title: "IT Fundamentals for Everyone",
    category: "Foundations",
    progress: 100,
    lessonsDone: 18,
    lessonsTotal: 18,
    nextLesson: "Course complete",
    hue: 168,
    chips: ["Linux", "Networking"],
  },
  {
    id: "excel-vba",
    title: "Excel VBA Automation",
    category: "Productivity",
    progress: 48,
    lessonsDone: 11,
    lessonsTotal: 23,
    nextLesson: "Recording and editing a macro",
    hue: 28,
    chips: ["VBA", "Excel"],
  },
];

export function courseStatus(course: Course): CourseStatus {
  if (course.progress >= 100) return "completed";
  if (course.progress <= 0) return "not-started";
  return "in-progress";
}

export type StatIcon = "courses" | "lessons" | "assignments" | "score";

export interface StatTile {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  icon: StatIcon;
}

export const STAT_TILES: StatTile[] = [
  { id: "in-progress", label: "Courses in progress", value: 3, icon: "courses" },
  { id: "lessons", label: "Lessons this week", value: 14, icon: "lessons" },
  { id: "due", label: "Assignments due", value: 2, icon: "assignments" },
  { id: "score", label: "Average score", value: 88, suffix: "%", icon: "score" },
];

export interface ActivityDay {
  /** Single-letter label under the bar. */
  initial: string;
  /** Full day name, for the screen-reader table. */
  day: string;
  minutes: number;
  isToday: boolean;
}

export const WEEKLY_ACTIVITY: ActivityDay[] = [
  { initial: "M", day: "Monday", minutes: 45, isToday: false },
  { initial: "T", day: "Tuesday", minutes: 70, isToday: false },
  { initial: "W", day: "Wednesday", minutes: 25, isToday: false },
  { initial: "T", day: "Thursday", minutes: 90, isToday: true },
  { initial: "F", day: "Friday", minutes: 0, isToday: false },
  { initial: "S", day: "Saturday", minutes: 55, isToday: false },
  { initial: "S", day: "Sunday", minutes: 30, isToday: false },
];

export const WEEKLY_TOTAL_MINUTES = WEEKLY_ACTIVITY.reduce(
  (total, day) => total + day.minutes,
  0,
);

export type Urgency = "today" | "soon" | "later";

export interface Deadline {
  id: string;
  title: string;
  course: string;
  due: string;
  urgency: Urgency;
}

export const DEADLINES: Deadline[] = [
  {
    id: "d1",
    title: "Assignment 4 — Robot grid traversal",
    course: "Data Analysis with Python",
    due: "Due today, 23:59",
    urgency: "today",
  },
  {
    id: "d2",
    title: "Quiz — Matrix decomposition",
    course: "Mathematics for Machine Learning",
    due: "Due tomorrow",
    urgency: "soon",
  },
  {
    id: "d3",
    title: "Peer review — Sales dashboard",
    course: "Excel VBA Automation",
    due: "In 3 days",
    urgency: "soon",
  },
  {
    id: "d4",
    title: "Final project proposal",
    course: "Data Analysis with Python",
    due: "In 9 days",
    urgency: "later",
  },
];

/* -------------------------------------------------------------------------- */
/* Lecture                                                                     */
/* -------------------------------------------------------------------------- */

export type LectureItemKind = "doc" | "video" | "quiz" | "code";
export type LectureItemState = "done" | "current" | "todo";

export interface LectureItem {
  id: string;
  title: string;
  kind: LectureItemKind;
  duration: string;
  state: LectureItemState;
}

export interface LectureSection {
  id: string;
  title: string;
  items: LectureItem[];
}

export interface LectureMaterial {
  id: string;
  title: string;
  meta: string;
}

export interface QuestionThread {
  id: string;
  author: string;
  asked: string;
  question: string;
  answer: string;
  replies: number;
}

export interface Lecture {
  courseTitle: string;
  lessonTitle: string;
  lessonNumber: number;
  lessonTotal: number;
  /** 0–100, whole course. */
  progress: number;
  elapsed: string;
  total: string;
  /** 0–100 of the scrubber. */
  played: number;
  sections: LectureSection[];
  overview: string;
  objectives: string[];
  transcript: { time: string; text: string }[];
  questions: QuestionThread[];
  materials: LectureMaterial[];
}

export const LECTURE: Lecture = {
  courseTitle: "Data Analysis with Python",
  lessonTitle: "Grouping and aggregating with pandas",
  lessonNumber: 7,
  lessonTotal: 20,
  progress: 60,
  elapsed: "04:12",
  total: "12:40",
  played: 33,
  sections: [
    {
      id: "s1",
      title: "1 · Getting data into pandas",
      items: [
        { id: "s1-1", title: "Series and DataFrame", kind: "doc", duration: "6 min", state: "done" },
        { id: "s1-2", title: "Reading CSV and Excel files", kind: "video", duration: "9 min", state: "done" },
        { id: "s1-3", title: "Checkpoint — loading data", kind: "quiz", duration: "5 questions", state: "done" },
      ],
    },
    {
      id: "s2",
      title: "2 · Reshaping and aggregating",
      items: [
        { id: "s2-1", title: "Selecting rows and columns", kind: "doc", duration: "7 min", state: "done" },
        { id: "s2-2", title: "Grouping and aggregating with pandas", kind: "video", duration: "12 min", state: "current" },
        { id: "s2-3", title: "Practice — group a sales table", kind: "code", duration: "20 min", state: "todo" },
        { id: "s2-4", title: "Checkpoint — groupby", kind: "quiz", duration: "6 questions", state: "todo" },
      ],
    },
    {
      id: "s3",
      title: "3 · Cleaning messy data",
      items: [
        { id: "s3-1", title: "Missing values", kind: "video", duration: "10 min", state: "todo" },
        { id: "s3-2", title: "Types, dates and categories", kind: "doc", duration: "8 min", state: "todo" },
        { id: "s3-3", title: "Practice — clean a survey export", kind: "code", duration: "25 min", state: "todo" },
      ],
    },
    {
      id: "s4",
      title: "4 · Telling the story",
      items: [
        { id: "s4-1", title: "Plotting straight from a DataFrame", kind: "video", duration: "11 min", state: "todo" },
        { id: "s4-2", title: "Final project brief", kind: "doc", duration: "4 min", state: "todo" },
      ],
    },
  ],
  overview:
    "A groupby is three moves in one: split the frame into groups, apply a function to each group, then combine the answers back into a single frame. Once you see those three moves, every aggregation in pandas is the same shape.",
  objectives: [
    "Split a DataFrame on one or more keys with groupby",
    "Apply built-in aggregations and your own functions with agg",
    "Read the resulting MultiIndex without fear",
    "Know when a pivot_table says it more clearly than a groupby",
  ],
  transcript: [
    { time: "00:00", text: "Last lesson we loaded the sales export into a DataFrame. It has 40,000 rows, which is far too many to read." },
    { time: "00:34", text: "So we ask a smaller question: how much did each region sell, per quarter?" },
    { time: "01:12", text: "That question is a groupby. The keys are region and quarter, and the aggregation is a sum over the amount column." },
    { time: "02:05", text: "Watch what pandas gives back — a Series with a MultiIndex, not a DataFrame. That trips up almost everyone the first time." },
    { time: "03:20", text: "reset_index turns those index levels back into ordinary columns, which is usually what you want before plotting." },
    { time: "04:12", text: "Now the same question with agg, so we can ask for the sum, the mean and the row count in one pass." },
  ],
  questions: [
    {
      id: "q1",
      author: "Daniyar S.",
      asked: "2 days ago",
      question: "Why does groupby return a Series here instead of a DataFrame?",
      answer:
        "Because you aggregated a single column. Select with double brackets — df.groupby(keys)[[\"amount\"]].sum() — and you get a DataFrame back.",
      replies: 3,
    },
    {
      id: "q2",
      author: "Madina T.",
      asked: "5 days ago",
      question: "Is pivot_table just a groupby with nicer output?",
      answer:
        "Roughly, yes. pivot_table spreads one key across the columns and fills missing combinations for you, which a groupby will not do.",
      replies: 1,
    },
  ],
  materials: [
    { id: "m1", title: "Lesson slides", meta: "PDF · 2.4 MB" },
    { id: "m2", title: "sales_2025.csv", meta: "Dataset · 1.1 MB" },
    { id: "m3", title: "groupby cheat sheet", meta: "PDF · 380 KB" },
    { id: "m4", title: "Notebook — worked example", meta: "IPYNB · 96 KB" },
  ],
};

/* -------------------------------------------------------------------------- */
/* Coding task                                                                 */
/* -------------------------------------------------------------------------- */

export interface CodeFile {
  id: string;
  name: string;
  /** Folder the file sits in, "" for the project root. */
  folder: string;
  language: "python";
  content: string;
  readOnly: boolean;
}

export interface TaskTest {
  id: string;
  name: string;
  expected: string;
  received: string;
  runtimeMs: number;
  passes: boolean;
}

export interface CodingTask {
  title: string;
  language: string;
  projectName: string;
  statement: string;
  constraints: string[];
  example: { input: string; output: string };
  files: CodeFile[];
  tests: TaskTest[];
  hints: string[];
  consoleOutput: string[];
}

const MAIN_PY = `"""Robot grid traversal — walk a rover across an r x c grid."""

DIRECTIONS = {
    "N": (-1, 0),
    "E": (0, 1),
    "S": (1, 0),
    "W": (0, -1),
}


def travel(rows, cols, moves):
    """Return the rover's final (row, col) after running moves."""
    r, c = 0, 0
    for step in moves:
        dr, dc = DIRECTIONS[step]
        nr, nc = r + dr, c + dc
        # A move that would leave the grid is ignored.
        if 0 < nr < rows and 0 < nc < cols:
            r, c = nr, nc
    return r, c


if __name__ == "__main__":
    print(travel(3, 3, "EESS"))
`;

const ROVER_PY = `class Rover:
    """A rover that remembers every cell it has visited."""

    def __init__(self, rows, cols):
        self.rows = rows
        self.cols = cols
        self.trail = [(0, 0)]

    def visit(self, row, col):
        self.trail.append((row, col))
        return len(self.trail)
`;

const TEST_MOVES_PY = `from main import travel


def test_empty_move_string():
    assert travel(3, 3, "") == (0, 0)


def test_clamps_at_the_north_west_wall():
    assert travel(3, 3, "NNWW") == (0, 0)


def test_walks_south_then_east():
    assert travel(4, 4, "SSEE") == (2, 2)


def test_single_cell_grid():
    assert travel(1, 1, "SENW") == (0, 0)
`;

export const CODING_TASK: CodingTask = {
  title: "Robot grid traversal",
  language: "Python 3.11",
  projectName: "robot-grid-traversal",
  statement:
    "A rover starts in the top-left cell (0, 0) of a rows x cols grid and reads a string of moves. N, E, S and W move it one cell; a move that would take it off the grid is ignored. Return the cell it finishes on.",
  constraints: [
    "1 <= rows, cols <= 100",
    "0 <= len(moves) <= 10 000",
    "moves contains only the letters N, E, S and W",
    "Return a tuple (row, col), zero-indexed",
  ],
  example: {
    input: "travel(4, 4, \"SSEE\")",
    output: "(2, 2)",
  },
  files: [
    { id: "main", name: "main.py", folder: "", language: "python", content: MAIN_PY, readOnly: false },
    { id: "rover", name: "rover.py", folder: "", language: "python", content: ROVER_PY, readOnly: true },
    { id: "tests", name: "test_moves.py", folder: "tests", language: "python", content: TEST_MOVES_PY, readOnly: true },
  ],
  tests: [
    {
      id: "t1",
      name: "empty move string",
      expected: "(0, 0)",
      received: "(0, 0)",
      runtimeMs: 4,
      passes: true,
    },
    {
      id: "t2",
      name: "clamps at the north-west wall",
      expected: "(0, 0)",
      received: "(0, 0)",
      runtimeMs: 6,
      passes: true,
    },
    {
      id: "t3",
      name: "walks south then east",
      expected: "(2, 2)",
      received: "(0, 0)",
      runtimeMs: 12,
      passes: false,
    },
    {
      id: "t4",
      name: "single cell grid",
      expected: "(0, 0)",
      received: "(0, 0)",
      runtimeMs: 3,
      passes: true,
    },
  ],
  hints: [
    "The rover starts at (0, 0). Walk the very first move through your guard by hand and check whether the guard lets it happen at all.",
    "0 < nr < rows rejects row 0 — the row the rover starts on. One side of each comparison should be inclusive.",
    "Use 0 <= nr < rows and 0 <= nc < cols, then assign r, c = nr, nc inside that branch.",
  ],
  consoleOutput: [
    "$ python main.py",
    "[elice] sandbox ready — python 3.11.6",
    "start  (0, 0)",
    "moves  EESS",
    "final  (0, 0)",
    "[elice] finished in 0.18s · exit code 0",
  ],
};

/** The lesson the dashboard's "Continue learning" panel points at. */
export const CURRENT_COURSE = COURSES[0];
