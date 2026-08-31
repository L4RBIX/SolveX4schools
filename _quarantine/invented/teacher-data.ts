/**
 * Demo data for the Elice LXP teacher experience.
 *
 * The live trial tenant (trial-qazaq-b2.elice.io/lxp/home) sits behind a login
 * and serves an empty DOM, so no roster could be extracted from it. Everything
 * here is invented demo content shaped to the structures Elice's public product
 * pages describe (class -> unit -> lesson, auto-graded submissions, skill
 * mastery, mistake clustering). Semantic colours are the measured public ones:
 * green #0FA968, amber #F5A524, red #E5484D, violet #6C4FE0.
 *
 * Every number rendered by the teacher UI is sourced from this file.
 */

export type StudentStatus = "advanced" | "progressing" | "struggling";

export interface Student {
  id: string;
  name: string;
  initials: string;
  status: StudentStatus;
  /** Unit completion, 0-100. */
  progress: number;
  /** Mean auto-graded score, 0-100. */
  averageScore: number;
  submitted: number;
  totalAssignments: number;
  lastActive: string;
  currentLesson: string;
  /** Only set for students flagged as struggling. */
  stuckOn?: string;
}

export interface Skill {
  id: string;
  label: string;
  /** Class-average mastery, 0-100. */
  mastery: number;
  /** Students below SKILL_THRESHOLD on this skill. */
  behind: number;
}

export interface MistakePattern {
  id: string;
  label: string;
  students: number;
  /** The offending line(s), verbatim from submissions. */
  code: string;
  fix: string;
}

export type AssignmentState = "open" | "needs-review" | "closed";

export interface Assignment {
  id: string;
  title: string;
  language: string;
  due: string;
  submitted: number;
  total: number;
  autoGraded: number;
  needsReview: number;
  state: AssignmentState;
}

export interface TrendPoint {
  week: string;
  label: string;
  average: number;
}

export interface WeekSummaryItem {
  id: string;
  label: string;
  value: string;
  tone: "ink" | "good" | "warn" | "muted";
}

export interface ClassMeta {
  name: string;
  unit: string;
  period: string;
  teacher: string;
  course: string;
}

export const CLASS_META: ClassMeta = {
  name: "10A Programming",
  unit: "Loops in Python",
  period: "Tuesday, 10:15",
  teacher: "Ms. Karimova",
  course: "Introduction to Python",
};

/** Mastery below this counts a student as "behind" on a skill. */
export const SKILL_THRESHOLD = 70;

export interface StatusMeta {
  label: string;
  /** Hex, for SVG strokes and fills. */
  color: string;
  note: string;
  dotClass: string;
  textClass: string;
  chipClass: string;
  avatarClass: string;
  cellClass: string;
  barClass: string;
  tileBorderClass: string;
}

export const STATUS_META: Record<StudentStatus, StatusMeta> = {
  advanced: {
    label: "Advanced",
    color: "#0FA968",
    note: "Ahead of the unit plan — ready for extension tasks.",
    dotClass: "bg-[#0FA968]",
    textClass: "text-[#0FA968]",
    chipClass: "bg-[#0FA968]/12 text-[#0FA968]",
    avatarClass: "bg-[#0FA968]/12 text-[#0FA968]",
    cellClass: "bg-[#0FA968]/10 hover:bg-[#0FA968]/20",
    barClass: "bg-[#0FA968]",
    tileBorderClass: "border-e-line",
  },
  progressing: {
    label: "Progressing",
    color: "#6C4FE0",
    note: "On track to finish Nested loops by Friday.",
    dotClass: "bg-e-violet",
    textClass: "text-e-violet",
    chipClass: "bg-e-violet/12 text-e-violet",
    avatarClass: "bg-e-violet-soft text-e-violet",
    cellClass: "bg-e-violet/10 hover:bg-e-violet/20",
    barClass: "bg-e-violet",
    tileBorderClass: "border-e-line",
  },
  struggling: {
    label: "Struggling",
    color: "#F5A524",
    note: "Below 40% of the unit — worth a check-in this week.",
    dotClass: "bg-[#F5A524]",
    textClass: "text-[#B4770B]",
    chipClass: "bg-[#F5A524]/16 text-[#B4770B]",
    avatarClass: "bg-[#F5A524]/16 text-[#B4770B]",
    cellClass: "bg-[#F5A524]/14 hover:bg-[#F5A524]/24",
    barClass: "bg-[#F5A524]",
    tileBorderClass: "border-[#F5A524]",
  },
};

/** Order the three statuses are always presented in. */
export const STATUS_ORDER: StudentStatus[] = [
  "advanced",
  "progressing",
  "struggling",
];

export const SEMANTIC = {
  good: "#0FA968",
  warn: "#F5A524",
  bad: "#E5484D",
  brand: "#6C4FE0",
} as const;

/** 30 students: exactly 8 advanced / 17 progressing / 5 struggling. */
export const ROSTER: Student[] = [
  { id: "s01", name: "Aigerim S.", initials: "AS", status: "advanced", progress: 100, averageScore: 97, submitted: 8, totalAssignments: 8, lastActive: "2 min ago", currentLesson: "6.1 Functions" },
  { id: "s02", name: "Daniyar K.", initials: "DK", status: "advanced", progress: 96, averageScore: 94, submitted: 8, totalAssignments: 8, lastActive: "18 min ago", currentLesson: "6.1 Functions" },
  { id: "s03", name: "Milana P.", initials: "MP", status: "advanced", progress: 94, averageScore: 96, submitted: 8, totalAssignments: 8, lastActive: "Today, 09:52", currentLesson: "5.3 Nested loops" },
  { id: "s04", name: "Sofia R.", initials: "SR", status: "advanced", progress: 92, averageScore: 91, submitted: 8, totalAssignments: 8, lastActive: "Today, 09:40", currentLesson: "5.3 Nested loops" },
  { id: "s05", name: "Nurlan T.", initials: "NT", status: "advanced", progress: 91, averageScore: 93, submitted: 7, totalAssignments: 8, lastActive: "1 h ago", currentLesson: "5.3 Nested loops" },
  { id: "s06", name: "Yuki M.", initials: "YM", status: "advanced", progress: 90, averageScore: 90, submitted: 8, totalAssignments: 8, lastActive: "Today, 10:02", currentLesson: "5.2 Nested loops intro" },
  { id: "s07", name: "Amina Zh.", initials: "AZ", status: "advanced", progress: 89, averageScore: 92, submitted: 7, totalAssignments: 8, lastActive: "Today, 09:31", currentLesson: "5.1 while / else" },
  { id: "s08", name: "Lucas F.", initials: "LF", status: "advanced", progress: 88, averageScore: 90, submitted: 7, totalAssignments: 8, lastActive: "Yesterday", currentLesson: "5.1 while / else" },

  { id: "s09", name: "Timur A.", initials: "TA", status: "progressing", progress: 80, averageScore: 85, submitted: 7, totalAssignments: 8, lastActive: "Today, 10:05", currentLesson: "5.1 while / else" },
  { id: "s10", name: "Kamila B.", initials: "KB", status: "progressing", progress: 78, averageScore: 82, submitted: 7, totalAssignments: 8, lastActive: "35 min ago", currentLesson: "4.4 while loops" },
  { id: "s11", name: "Arman D.", initials: "AD", status: "progressing", progress: 76, averageScore: 79, submitted: 6, totalAssignments: 8, lastActive: "Today, 09:12", currentLesson: "4.4 while loops" },
  { id: "s12", name: "Elena V.", initials: "EV", status: "progressing", progress: 74, averageScore: 81, submitted: 7, totalAssignments: 8, lastActive: "Today, 08:58", currentLesson: "4.4 while loops" },
  { id: "s13", name: "Rustam I.", initials: "RI", status: "progressing", progress: 72, averageScore: 76, submitted: 6, totalAssignments: 8, lastActive: "Yesterday", currentLesson: "4.3 Loop conditions" },
  { id: "s14", name: "Dana O.", initials: "DO", status: "progressing", progress: 70, averageScore: 78, submitted: 6, totalAssignments: 8, lastActive: "2 h ago", currentLesson: "4.3 Loop conditions" },
  { id: "s15", name: "Nikita G.", initials: "NG", status: "progressing", progress: 68, averageScore: 74, submitted: 6, totalAssignments: 8, lastActive: "Yesterday", currentLesson: "4.3 Loop conditions" },
  { id: "s16", name: "Zarina M.", initials: "ZM", status: "progressing", progress: 66, averageScore: 77, submitted: 6, totalAssignments: 8, lastActive: "Today, 09:05", currentLesson: "4.2 while intro" },
  { id: "s17", name: "Alisher K.", initials: "AK", status: "progressing", progress: 64, averageScore: 72, submitted: 5, totalAssignments: 8, lastActive: "Yesterday", currentLesson: "4.2 while intro" },
  { id: "s18", name: "Polina Y.", initials: "PY", status: "progressing", progress: 62, averageScore: 75, submitted: 6, totalAssignments: 8, lastActive: "3 h ago", currentLesson: "4.2 while intro" },
  { id: "s19", name: "Erlan S.", initials: "ES", status: "progressing", progress: 60, averageScore: 70, submitted: 5, totalAssignments: 8, lastActive: "Yesterday", currentLesson: "4.1 for / range recap" },
  { id: "s20", name: "Maria C.", initials: "MC", status: "progressing", progress: 58, averageScore: 73, submitted: 5, totalAssignments: 8, lastActive: "2 days ago", currentLesson: "4.1 for / range recap" },
  { id: "s21", name: "Bekzat N.", initials: "BN", status: "progressing", progress: 56, averageScore: 69, submitted: 5, totalAssignments: 8, lastActive: "Yesterday", currentLesson: "4.1 for / range recap" },
  { id: "s22", name: "Aruzhan T.", initials: "AT", status: "progressing", progress: 54, averageScore: 71, submitted: 5, totalAssignments: 8, lastActive: "Today, 08:44", currentLesson: "3.4 range() steps" },
  { id: "s23", name: "Omar H.", initials: "OH", status: "progressing", progress: 52, averageScore: 68, submitted: 5, totalAssignments: 8, lastActive: "2 days ago", currentLesson: "3.4 range() steps" },
  { id: "s24", name: "Leila N.", initials: "LN", status: "progressing", progress: 50, averageScore: 70, submitted: 5, totalAssignments: 8, lastActive: "Yesterday", currentLesson: "3.4 range() steps" },
  { id: "s25", name: "Viktor P.", initials: "VP", status: "progressing", progress: 46, averageScore: 66, submitted: 4, totalAssignments: 8, lastActive: "2 days ago", currentLesson: "3.3 Loop counters" },

  { id: "s26", name: "Ivan R.", initials: "IR", status: "struggling", progress: 38, averageScore: 58, submitted: 4, totalAssignments: 8, lastActive: "3 days ago", currentLesson: "3.2 Looping a list", stuckOn: "while loops" },
  { id: "s27", name: "Saltanat B.", initials: "SB", status: "struggling", progress: 32, averageScore: 54, submitted: 3, totalAssignments: 8, lastActive: "2 days ago", currentLesson: "3.2 Looping a list", stuckOn: "Nested loops" },
  { id: "s28", name: "Chen W.", initials: "CW", status: "struggling", progress: 28, averageScore: 49, submitted: 3, totalAssignments: 8, lastActive: "4 days ago", currentLesson: "3.1 First for loop", stuckOn: "for / range" },
  { id: "s29", name: "Madina E.", initials: "ME", status: "struggling", progress: 22, averageScore: 45, submitted: 2, totalAssignments: 8, lastActive: "Yesterday", currentLesson: "3.1 First for loop", stuckOn: "Loop conditions" },
  { id: "s30", name: "Ayan U.", initials: "AU", status: "struggling", progress: 15, averageScore: 38, submitted: 2, totalAssignments: 8, lastActive: "6 days ago", currentLesson: "2.4 Conditionals recap", stuckOn: "Accumulator pattern" },
];

export const CLASS_SIZE = ROSTER.length;

export const STATUS_COUNTS: Record<StudentStatus, number> = ROSTER.reduce(
  (acc, student) => {
    acc[student.status] += 1;
    return acc;
  },
  { advanced: 0, progressing: 0, struggling: 0 } as Record<StudentStatus, number>,
);

/** The struggling five, in the order the teacher should work through them. */
export const NEEDS_ATTENTION: Student[] = ROSTER.filter(
  (student) => student.status === "struggling",
);

/** Rounded mean of every student's average score. */
export const CLASS_AVERAGE = Math.round(
  ROSTER.reduce((sum, s) => sum + s.averageScore, 0) / ROSTER.length,
);

/** Rounded mean unit completion. */
export const CLASS_PROGRESS = Math.round(
  ROSTER.reduce((sum, s) => sum + s.progress, 0) / ROSTER.length,
);

export const SKILLS: Skill[] = [
  { id: "variables", label: "Variables & types", mastery: 96, behind: 1 },
  { id: "conditionals", label: "Conditionals", mastery: 88, behind: 3 },
  { id: "for-range", label: "for / range", mastery: 74, behind: 7 },
  { id: "while", label: "while loops", mastery: 61, behind: 11 },
  { id: "nested", label: "Nested loops", mastery: 43, behind: 17 },
  { id: "functions", label: "Functions", mastery: 29, behind: 22 },
];

export const MISTAKES: MistakePattern[] = [
  {
    id: "off-by-one",
    label: "Off-by-one in range()",
    students: 12,
    code: "for i in range(1, len(items)):\n    print(items[i])",
    fix: "Indexes start at 0 — use range(len(items)) so the first item is not skipped.",
  },
  {
    id: "infinite-while",
    label: "while loop never terminates",
    students: 9,
    code: "count = 0\nwhile count < 10:\n    print(count)",
    fix: "Update the counter inside the loop body: count += 1.",
  },
  {
    id: "mutate-while-iterating",
    label: "List mutated while looping over it",
    students: 6,
    code: "for score in scores:\n    if score < 50:\n        scores.remove(score)",
    fix: "Iterate a copy — for score in scores[:] — or build a new filtered list.",
  },
];

export const ASSIGNMENTS: Assignment[] = [
  {
    id: "a1",
    title: "Loop the multiplication table",
    language: "Python",
    due: "Due Today, 23:59",
    submitted: 24,
    total: CLASS_SIZE,
    autoGraded: 21,
    needsReview: 3,
    state: "needs-review",
  },
  {
    id: "a2",
    title: "while-loop guessing game",
    language: "Python",
    due: "Due Thu, 28 Aug",
    submitted: 18,
    total: CLASS_SIZE,
    autoGraded: 18,
    needsReview: 0,
    state: "open",
  },
  {
    id: "a3",
    title: "Nested loops: star pyramid",
    language: "Python",
    due: "Overdue by 2 days",
    submitted: 27,
    total: CLASS_SIZE,
    autoGraded: 22,
    needsReview: 5,
    state: "needs-review",
  },
  {
    id: "a4",
    title: "Quiz: for vs while",
    language: "Python",
    due: "Closed 12 Aug",
    submitted: 30,
    total: CLASS_SIZE,
    autoGraded: 30,
    needsReview: 0,
    state: "closed",
  },
];

/** Six-week class-average series for the trend chart. */
export const TREND: TrendPoint[] = [
  { week: "W1", label: "Week 1", average: 58 },
  { week: "W2", label: "Week 2", average: 63 },
  { week: "W3", label: "Week 3", average: 66 },
  { week: "W4", label: "Week 4", average: 64 },
  { week: "W5", label: "Week 5", average: 71 },
  { week: "W6", label: "Week 6", average: CLASS_AVERAGE },
];

const totalSubmitted = ASSIGNMENTS.reduce((sum, a) => sum + a.submitted, 0);
const totalAutoGraded = ASSIGNMENTS.reduce((sum, a) => sum + a.autoGraded, 0);
const totalNeedsReview = ASSIGNMENTS.reduce((sum, a) => sum + a.needsReview, 0);

export const REVIEW_QUEUE = totalNeedsReview;

export const WEEK_SUMMARY: WeekSummaryItem[] = [
  { id: "submissions", label: "Submissions", value: String(totalSubmitted), tone: "ink" },
  { id: "auto", label: "Auto-graded", value: String(totalAutoGraded), tone: "good" },
  { id: "review", label: "Needs review", value: String(totalNeedsReview), tone: "warn" },
  { id: "time", label: "Avg. time on task", value: "38 min", tone: "muted" },
];

/** Options offered by the "New assignment" modal. */
export const COURSE_OPTIONS = [
  "Introduction to Python",
  "Data Structures I",
  "Web Basics: HTML & CSS",
] as const;

export const LANGUAGE_OPTIONS = ["Python", "JavaScript", "SQL", "C"] as const;

/* ---------------------------------------------------------------------------
   Shared class strings for the teacher surface.

   Measured on elice.io/en and elice.io/en/ax/lxp: buttons are 8px radius,
   40px tall, 0 20px padding, 15px/600. The `after:` pseudo element widens the
   touch target to 44px without changing the measured visual height.
   ------------------------------------------------------------------------- */

const BTN_BASE =
  "relative inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-semibold whitespace-nowrap transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-0.5 after:content-[''] disabled:cursor-not-allowed disabled:opacity-50";

export const BTN_PRIMARY = `${BTN_BASE} bg-e-black text-e-white hover:bg-e-dark`;
export const BTN_SECONDARY = `${BTN_BASE} border border-e-line bg-e-white text-e-ink hover:bg-e-grey`;
export const BTN_BRAND = `${BTN_BASE} bg-e-violet text-e-white hover:bg-e-violet-2`;

/** Elice cards: 12px radius, 1px #E5E8EB hairline, white, no hard edge. */
export const CARD = "rounded-xl border border-e-line bg-e-white";
export const CARD_LG = "rounded-[20px] border border-e-line bg-e-white";
export const FLOAT_SHADOW = "shadow-[0_12px_32px_rgba(25,31,40,0.10)]";
