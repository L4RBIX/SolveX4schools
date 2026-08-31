/**
 * brilliant.org/math — every string and asset path on this page.
 *
 * Copy is verbatim from the fetched SSR HTML / JS bundle (see
 * docs/research/specs/b-subject.spec.md). Note the deliberate mix of curly and
 * straight apostrophes: FAQ items 4 and 5 use `'` while everything else uses
 * `’`. That is what the source says.
 *
 * The Python in here is Brilliant's, not ours. "Thinking in Python" is a real
 * course on a real site, this tree is a verbatim reproduction of it, and
 * `/brilliant/**` 404s outside development (`tests/school/routes.test.ts`). A
 * migration that renamed it to C++ would break the only baseline the product's
 * own pages are measured against, and would put a course name on a page that
 * the site it copies does not have. Leave it.
 */

/** Root of the mirrored brilliant.org asset tree in /public. */
export const B = "/assets/original/brilliant/brilliant.org";

/* -------------------------------------------------------------------------- */
/* Section 1 — hero                                                            */
/* -------------------------------------------------------------------------- */

export interface HeroBullet {
  /** Text before the bold run. */
  lead: string;
  /** The `<strong>` run. */
  strong: string;
  /** Text after the bold run. */
  tail: string;
}

export const HERO_BULLETS: readonly HeroBullet[] = [
  { lead: "Interactive problem solving that’s ", strong: "effective and fun", tail: "" },
  { lead: "Step-by-step ", strong: "thinking, not memorization", tail: "" },
  { lead: "For ", strong: "grades 4-12, college, and adults", tail: "" },
  {
    lead: "",
    strong: "Comprehensive curriculum",
    tail: " designed by world-class teachers from MIT, Harvard, and more",
  },
];

export const HERO_CTAS = [
  {
    label: "I’m a learner",
    href: "/welcome/?cta_persona=learner&sem=math",
    variant: "green",
  },
  {
    label: "I’m a parent or teacher",
    href: "/welcome/?cta_persona=parent_teacher&sem=math",
    variant: "outlineSecondary",
  },
] as const;

export const HERO_REVIEWS_LINE = "Over 100,000 5-star reviews!";

/**
 * The reference plays `math-sem-sizzle.*` here. Video was removed from this
 * build, so only the reference's own fallback stills remain and the hero
 * renders them statically.
 */
export const HERO_POSTER = {
  desktop: {
    poster: `${B}/images/homepage/heroes/math-sem-sizzle-fallback.png`,
    width: 880,
    height: 1200,
  },
  mobile: {
    poster: `${B}/images/homepage/heroes/math-sizzle-mobile-fallback.png`,
    width: 660,
    height: 480,
  },
} as const;

export const SCRATCH_IMAGE = `${B}/images/homepage/heroes/math-scratch.svg`;

/* -------------------------------------------------------------------------- */
/* Section 2 — social proof                                                    */
/* -------------------------------------------------------------------------- */

export const SOCIAL_PROOF_HEADING = "Join over 10 million learners worldwide";
export const SOCIAL_PROOF_STARS_LABEL = "Over 100,000 5-star app reviews";

/* -------------------------------------------------------------------------- */
/* Sections 3, 4, 5, 7, 8 — value props                                        */
/* -------------------------------------------------------------------------- */

export interface ValueProp {
  id: string;
  /** Which side the artwork sits on at `lg` and up. */
  assetAlignment: "left" | "right";
  /** Heading split at the source's hard `<br>`. */
  headingLines: readonly [string, string];
  body: string;
  bgBase: string;
  bgDesktop: string;
  image: string;
}

export const VALUE_PROPS_TOP: readonly ValueProp[] = [
  {
    id: "better-way",
    assetAlignment: "left",
    headingLines: ["A better way to", "learn math"],
    body: "Step-by-step interactive lessons make even complex concepts feel intuitive. Custom, intelligent feedback catches mistakes as you learn.",
    bgBase: "linear-gradient(0deg, #eaf7f6 0%, #f8f8f8 100%)",
    bgDesktop: "linear-gradient(90deg, #f8f8f8 0%, #eaf7f6 100%)",
    image: `${B}/images/homepage/refresh/math/better-way.png`,
  },
  {
    id: "personalized-learning",
    assetAlignment: "right",
    headingLines: ["Personalized", "learning"],
    body: "Start at your level and ramp up fast. Brilliant tracks the concepts you’ve mastered and designs practice sets based on your progress.",
    bgBase: "linear-gradient(0deg, #ecf0ff 0%, white 100%)",
    bgDesktop: "linear-gradient(90deg, #ecf0ff 0%, white 100%)",
    image: `${B}/images/homepage/refresh/math/personalized-learning.png`,
  },
  {
    id: "think-like-mathematician",
    assetAlignment: "left",
    headingLines: ["Think like a", "mathematician"],
    body: "Build mathematical intuition as you learn through “aha” moments, not memorizing answers.",
    bgBase: "linear-gradient(0deg, #fffcf4 0%, white 100%)",
    bgDesktop: "linear-gradient(90deg, white 0%, #fffcf4 100%)",
    image: `${B}/images/homepage/refresh/math/think-like-mathematician.png`,
  },
];

export const VALUE_PROPS_BOTTOM: readonly ValueProp[] = [
  {
    id: "guided-lessons",
    assetAlignment: "left",
    headingLines: ["Guided math", "lessons"],
    body: "From foundational algebra to calculus, we help you stay on track and build your problem-solving skills one concept at a time.",
    bgBase: "linear-gradient(0deg, #f5efff 0%, white 100%)",
    bgDesktop: "linear-gradient(90deg, white 0%, #f5efff 100%)",
    image: `${B}/images/homepage/refresh/shared/guided-lessons.png`,
  },
  {
    id: "stay-motivated",
    assetAlignment: "right",
    headingLines: ["Stay", "motivated"],
    body: "Finish every day smarter with engaging lessons, competitive features, and daily encouragement.",
    bgBase: "linear-gradient(0deg, #fdfef5 0%, white 100%)",
    bgDesktop: "linear-gradient(90deg, #fdfef5 0%, white 100%)",
    image: `${B}/images/homepage/refresh/shared/stay-motivated.png`,
  },
];

/* -------------------------------------------------------------------------- */
/* Section 6 — course tabs                                                     */
/* -------------------------------------------------------------------------- */

export type TabColorScheme = "blue" | "purple" | "orange" | "yellow";

export interface CourseGroup {
  id: string;
  colorScheme: TabColorScheme;
  desktopLabel: string;
  mobileLabel: string;
  /** `{title} Courses` is the panel heading. */
  title: string;
  visibleCount: number;
  /**
   * Only the Computer Science group still ships a clip; the others render
   * their poster still instead. Video was stripped from this build except for
   * the coding one.
   */
  video?: string;
  poster: string;
  courses: readonly string[];
}

export const COURSE_SECTION_HEADING = "Reach your math goals and more";

export const COURSE_GROUPS: readonly CourseGroup[] = [
  {
    id: "math",
    colorScheme: "blue",
    desktopLabel: "Math",
    mobileLabel: "Math",
    title: "Math",
    visibleCount: 7,
    poster: `${B}/videos/homepage/courses/posters/math-refresh.png`,
    courses: [
      "Arithmetic Thinking",
      "Proportional Reasoning",
      "Probability and Chance",
      "Visual Algebra",
      "Solving Equations",
      "Quadratics",
      "Calculus",
      "Exponential Functions",
      "Coordinate Geometry",
      "Everyday Statistics",
      "Geometry and Measurement",
      "Real-World Algebra",
      "Coordinate Plane",
      "Coordinate Transformations",
      "Logic",
      "Truth and Lies",
      "Reasoning with Logic",
      "Vectors",
      "Infinity",
      "Number Theory",
      "Geometric Thinking",
      "Bayesian Probability",
      "Contest Math",
      "Linear Functions",
      "Exponents and Radicals",
      "Introduction to Functions",
    ],
  },
  {
    id: "computer-science",
    colorScheme: "purple",
    desktopLabel: "Computer Science",
    mobileLabel: "CS",
    title: "Computer Science",
    visibleCount: 7,
    video: `${B}/videos/homepage/courses/cs-refresh.webm`,
    poster: `${B}/videos/homepage/courses/posters/cs-refresh.png`,
    courses: [
      "Thinking in Code",
      "Programming with Variables",
      "Thinking in Python",
      "Programming with Functions",
      "Algorithmic Thinking",
      "Computer Science Fundamentals",
      "Introduction to Neural Networks",
      "How AI Works",
      "How Technology Works",
      "Search Engines",
      "Cryptocurrency",
    ],
  },
  {
    id: "data-analysis",
    colorScheme: "orange",
    desktopLabel: "Data Analysis",
    mobileLabel: "Data",
    title: "Data Analysis",
    visibleCount: 7,
    poster: `${B}/videos/homepage/courses/posters/data-refresh.png`,
    courses: [
      "Exploring Data Visually",
      "Probability in Data",
      "Clustering & Classification",
      "Regression",
      "Predicting with Probability",
    ],
  },
  {
    id: "science",
    colorScheme: "yellow",
    desktopLabel: "Science",
    mobileLabel: "Science",
    title: "Science",
    visibleCount: 8,
    poster: `${B}/videos/homepage/courses/posters/science-refresh.png`,
    courses: [
      "Scientific Thinking",
      "Circuits",
      "Digital Circuits",
      "Quantum Computing",
      "Beyond the Nutshell",
    ],
  },
];

/** `lohpDarkBg` — the course section and the closing CTA share this. */
export const LOHP_DARK_BG =
  "linear-gradient(180deg, #141414 66%, rgba(20,20,20,0.70) 100%), linear-gradient(90deg, #a0dcd5 0%, #edf5a1 100%)";

/** `buildLinearGradient(55, …)` — sections 2 and 9. */
export const GRAY_55_BG = "linear-gradient(55deg, #f2f2f2 25%, white 70%)";

/* -------------------------------------------------------------------------- */
/* Section 9 — designed by experts                                             */
/* -------------------------------------------------------------------------- */

export const EXPERTS_HEADING = "Designed by experts";
export const EXPERTS_BODY =
  "All of our courses are crafted by award-winning teachers and professionals from top institutions.";
export const EXPERTS_CTA = { label: "Learn more", href: "/about/" } as const;

export interface ExpertLogo {
  name: string;
  file: string;
  width: number;
  height: number;
}

export const EXPERT_LOGOS: readonly ExpertLogo[] = [
  { name: "Stanford", file: `${B}/inline-svg/logo-stanford.svg`, width: 118, height: 26 },
  { name: "MIT", file: `${B}/inline-svg/logo-mit.svg`, width: 59, height: 31 },
  { name: "Google", file: `${B}/inline-svg/logo-google.svg`, width: 100, height: 33 },
  { name: "Caltech", file: `${B}/inline-svg/logo-caltech.svg`, width: 100, height: 25 },
  { name: "Harvard University", file: `${B}/inline-svg/logo-harvard.svg`, width: 177, height: 38 },
  { name: "Microsoft", file: `${B}/inline-svg/logo-microsoft.svg`, width: 142, height: 31 },
];

/* -------------------------------------------------------------------------- */
/* Section 10 — FAQ                                                            */
/* -------------------------------------------------------------------------- */

/** One answer is a run of plain text and at most one inline anchor. */
export type AnswerRun =
  | { kind: "text"; text: string }
  | { kind: "link"; text: string; href: string };

export interface FaqItem {
  value: string;
  question: string;
  answer: readonly AnswerRun[];
}

export const FAQ_HEADING = "Frequently asked questions";

const COURSES_URL = "https://brilliant.org/courses/";

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    value: "math-topics",
    question: "What math topics does Brilliant cover?",
    answer: [
      { kind: "text", text: "Brilliant’s " },
      { kind: "link", text: "courses", href: COURSES_URL },
      {
        kind: "text",
        text: " cover comprehensive math topics from basic arithmetic, algebra, and geometry to advanced subjects like calculus and vectors. Topics also include specialized areas like discrete math, statistics, number theory, and applied mathematics for data science and AI.",
      },
    ],
  },
  {
    value: "math-learning-paths",
    question: "What math learning paths does Brilliant offer?",
    answer: [
      { kind: "text", text: "Brilliant offers structured math " },
      { kind: "link", text: "learning paths", href: COURSES_URL },
      {
        kind: "text",
        text: ", including Foundational Math, Everyday Math, Advanced Math, Logical Reasoning, and Mind-Bending Math. Each path guides you through interconnected concepts in logical sequence, ensuring you build strong foundations before advancing to complex topics.",
      },
    ],
  },
  {
    value: "math-start",
    question: "Where should I start learning math?",
    answer: [
      {
        kind: "text",
        text: "Brilliant determines your optimal starting point on a math learning path after assessing your interests and skill level. Brilliant’s learning paths provide smooth transitions from arithmetic to algebra to calculus, with each lesson building naturally on previous concepts.",
      },
    ],
  },
  {
    value: "math-visualize",
    question: "How can I visualize complex mathematical concepts?",
    answer: [
      {
        kind: "text",
        text: "Brilliant uses interactive visualizations, animations, and hands-on simulations to make abstract math concepts tangible and understandable. You'll see calculus curves change in real-time and manipulate geometric shapes to grasp complex relationships.",
      },
    ],
  },
  {
    value: "math-real-world",
    question: "How can I connect math to real-world applications?",
    answer: [
      {
        kind: "text",
        text: "Brilliant demonstrates practical math applications throughout every course, showing how mathematical concepts solve real problems in physics, engineering, economics, and technology. You'll see math's relevance beyond the classroom through interactive examples.",
      },
    ],
  },
  {
    value: "math-programming",
    question: "What math do I need for programming and computer science?",
    answer: [
      {
        kind: "text",
        text: "Brilliant covers essential math for programming including discrete mathematics, algorithms, logic, and computational thinking. These courses connect mathematical concepts directly to programming applications, which learners can then explore further in Brilliant’s programming courses.",
      },
    ],
  },
  {
    value: "math-data-science",
    question: "What math topics should I learn for data science?",
    answer: [
      {
        kind: "text",
        text: "Brilliant offers courses in statistics, probability, and calculus—all essential math foundations for data science. Brilliant’s data courses then connect these mathematical concepts directly to real-world applications in data analysis.",
      },
    ],
  },
  {
    value: "math-ai",
    question: "What math should I learn for artificial intelligence?",
    answer: [
      {
        kind: "text",
        text: "Brilliant offers courses in statistics, calculus, and neural networks that provide the mathematical foundation for AI and machine learning, connecting mathematical theory directly to AI applications and algorithms.",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Section 11 — closing CTA                                                    */
/* -------------------------------------------------------------------------- */

export const UPSELL = {
  heading: "Everyone is a math person",
  body: "Join over 10 million people learning interactively.",
  cta: { label: "Get started", href: "/welcome/?sem=math" },
  illustration: `${B}/images/homepage/everyone-is-a-math-person.svg`,
} as const;

export const STORE_BADGES = [
  {
    href: "https://play.google.com/store/apps/details?id=org.brilliant.android&listing=try-brilliant-app",
    src: `${B}/images/app-store-badges/get-it-on-google-play.svg`,
    alt: "Get it on Google Play",
  },
  {
    href: "https://apps.apple.com/app/apple-store/id913335252?pt=105095803&ct=nux_qr_code&mt=8",
    src: `${B}/images/app-store-badges/download-on-the-app-store.svg`,
    alt: "Download on the App Store",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Section 12 — footer                                                         */
/* -------------------------------------------------------------------------- */

export interface FooterColumn {
  title: string;
  links: readonly { label: string; href: string }[];
}

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Courses", href: "/courses/" },
      { label: "Pricing", href: "/subscribe/" },
      { label: "Gift Brilliant", href: "/gift-premium/" },
      { label: "Resources", href: "/resources/" },
      { label: "Help", href: "/help/" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Educators", href: "/educators/" },
      { label: "Homeschools", href: "/start/homeschool/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about/" },
      { label: "Careers", href: "/careers/" },
    ],
  },
  {
    title: "Behind the scenes",
    links: [
      {
        label: "A Tutor in Every Home",
        href: "https://blog.brilliant.org/a-world-class-tutor-in-every-home/",
      },
      { label: "AI at Brilliant", href: "https://blog.brilliant.org/hand-crafted-machine-made/" },
      {
        label: "AI Evals for Learning Games",
        href: "https://blog.brilliant.org/when-almost-right-is-catastrophically-wrong-evals-for-ai-learning-games/",
      },
      { label: "Visual Algebra", href: "https://blog.brilliant.org/visual-algebra/" },
      {
        label: "Decomposition and Abstraction",
        href: "https://blog.brilliant.org/decomposition-and-abstraction/",
      },
    ],
  },
];

export const FOOTER_SOCIALS = [
  {
    label: "Brilliant on Facebook",
    href: "https://www.facebook.com/brilliantorg",
    file: `${B}/inline-svg/icon-facebook.svg`,
    width: 22,
    height: 22,
  },
  {
    label: "Brilliant on Instagram",
    href: "https://www.instagram.com/brilliantorg",
    file: `${B}/inline-svg/icon-instagram.svg`,
    width: 21,
    height: 21,
  },
  {
    label: "Brilliant on Twitter",
    href: "https://twitter.com/brilliantorg",
    file: `${B}/inline-svg/icon-twitter-x.svg`,
    width: 22,
    height: 22,
  },
  {
    label: "Brilliant on LinkedIn",
    href: "https://www.linkedin.com/company/brilliant-org/",
    file: `${B}/inline-svg/icon-linkedin.svg`,
    width: 20,
    height: 21,
  },
] as const;

export const FOOTER_COPYRIGHT =
  "© 2026 Brilliant Worldwide, Inc., Brilliant and the Brilliant Logo are trademarks of Brilliant Worldwide, Inc.";
