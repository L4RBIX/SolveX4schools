/**
 * "Our method" accordion copy, verbatim. `strong` marks the two run-in bold
 * lead-ins in item 1; `link` marks the single outbound blog link. Paragraphs
 * are joined with <br><br>, which is how the original breaks them.
 */
export type MethodSegment =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "link"; text: string; href: string };

export interface MethodItem {
  value: string;
  title: string;
  paragraphs: readonly (readonly MethodSegment[])[];
}

const t = (text: string): MethodSegment => ({ kind: "text", text });

export const METHOD_ITEMS: readonly MethodItem[] = [
  {
    value: "a-personal-tutor-for-all",
    title: "A personal tutor for all",
    paragraphs: [
      [
        t(
          "Brilliant’s tutor, Koji, is personalized, rigorous, and built to help learners prove to themselves they can do hard things. Koji is infinitely patient, asks instead of tells, builds confidence instead of dependency, and never, ever just hands you the answer.",
        ),
      ],
      [
        t(
          "Koji can see what’s on your screen, so we know where you’re stuck and can intervene in the ideal way. Some of how Koji does this is:",
        ),
      ],
      [
        { kind: "strong", text: "User knowledge modeling" },
        t(
          ". Teaching well requires having an understanding of what the learner does and doesn’t know. We’re combining techniques from intelligent tutoring systems, classic ML recommender systems, and natural language conversations to identify exactly where a learner’s misconception lies.",
        ),
      ],
      [
        { kind: "strong", text: "On-the-fly visual and interactive generation" },
        t(
          ". Learners get lost in a wall of text. They want a visual or a manipulable interactive, problems that exactly match the question they have, and the ability to practice on near-neighbor problems just like it. Our content has been built over many years to enable ",
        ),
        {
          kind: "link",
          text: "precisely this functionality",
          href: "https://blog.brilliant.org/hand-crafted-machine-made/",
        },
        t("."),
      ],
      [
        t(
          "Good tutoring makes itself unnecessary. Our goal is for Koji’s actions to gradually become things the student initiates themselves, until Koji is barely needed at all. The point is to make the student feel seen while they do the thinking themselves.",
        ),
      ],
    ],
  },
  {
    value: "targeted-practice-and-review",
    title: "Targeted practice and review",
    paragraphs: [
      [
        t(
          "Every lesson has associated practice sets. These practice sets are designed to feel like low-stakes quizzes. The frequency, timing, and composition of practice sets are an area of active experimentation, to maximize effective retrieval and automaticity.",
        ),
      ],
      [
        t(
          "In practice sets, the scaffolding falls away — you’re being tested on your independent ability to answer the questions, so there are no more visual aids or hints.",
        ),
      ],
      [
        t(
          "For constructing personalized practice, we predict the optimal next problem X to ask, so that you are adequately prepared to answer a future question Y. This is also a generalized testing umbrella within which we test spaced repetition (especially in weak areas), mixing practice problems from different concepts (so that the learner must identify what approach to use to solve each problem, rather than just applying the same procedure to every problem), determining level of effective automaticity (fast solving speed with no mistakes), and optimal length and difficulty per set.",
        ),
      ],
      [
        t(
          "Review sets that combine problems from preceding lessons are currently being rolled out on a course-by-course basis (we human-review everything, which is why this has a gradual rollout).",
        ),
      ],
    ],
  },
  {
    value: "designed-to-be-fun",
    title: "Designed to be fun",
    paragraphs: [
      [
        t(
          "To learn math well requires many, many reps. The precise amount required varies among individuals, but everyone needs practice. We design a variety of mechanisms to make it fun to practice, and satisfying to progress to more challenging sets.",
        ),
      ],
      [
        t(
          "Our gamification layer provides scaffolding for motivation and habit formation. This provides another tool to help learners stick with learning even in the absence of tutors or parents who help foster motivation.",
        ),
      ],
      [
        t(
          "On Brilliant, the content itself is designed to feel fun — from the pedagogical design of the interactives and problem progression, to the types of sounds, feedback, and haptics we provide as you interact.",
        ),
      ],
      [
        t(
          "Most of the increase in usage and learner retention has come from excellent content delivery, but gamification helps. We avoid packing too many game incentives into the product to keep the focus on the learning content, but aim to execute well on a few core habit formation loops. These include Streaks and Leagues.",
        ),
      ],
      [
        t(
          "Learners progress through levels of progressively more difficult problem solving in a topic. The leveling system intentionally displays a more reductive view of concept connections and prerequisites than the underlying reality. It is focused on providing learners with clear and satisfying milestones to work toward.",
        ),
      ],
      [
        t(
          "Progress is also gamified — including in how we structure XP and pass/fail feedback and routing. Currently, we’re working on testing various mechanics to extend your learning session, i.e., motivate learners to continue with the next appropriate practice, review, or lesson.",
        ),
      ],
      [
        t(
          "Overall, approaches to building both intrinsic and extrinsic motivation are an area of active investigation and testing.",
        ),
      ],
    ],
  },
  {
    value: "visual-and-interactive",
    title: "Visual and interactive",
    paragraphs: [
      [t("Our lessons prioritize visual representations and active learning.")],
      [
        t(
          "Each lesson focuses on a single concept and has a mix of direct instruction and blocked problem solving (i.e., practicing similar problems). ",
        ),
      ],
      [
        t(
          "We first build intuition with visual explanations, hands-on manipulation, and concrete computation. We start with the simplest version of an idea, minimizing cognitive load. Each interactive problem gives instant, custom feedback based on your answer.",
        ),
      ],
      [
        t(
          "As concepts build on one another, we challenge learners to try more advanced computations and combine ideas to solve problems.",
        ),
      ],
      [
        t(
          "We don’t teach how to do something before asking questions. Instead, we pretest on the material, letting the learner try to find a solution before learning the procedure. Based on our testing to date, we believe this is the optimal approach.",
        ),
      ],
    ],
  },
];
