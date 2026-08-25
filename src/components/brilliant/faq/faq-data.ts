/**
 * The 21 FAQ entries served by brilliant.org/faq/.
 *
 * `answerHtml` is the verbatim inner HTML of each panel body as it appears in
 * the SSR markup (and, byte for byte, as the `FAQPage` JSON-LD `acceptedAnswer`
 * text). It is rendered with `dangerouslySetInnerHTML` so the inline anchors and
 * lists survive intact — every one of these strings is a static constant
 * transcribed from the extracted page, never user input.
 *
 * Rendered group order is About Brilliant -> About our courses -> About Premium.
 * The JSON-LD array order on the original differs (see `JSON_LD_GROUP_ORDER`).
 */

export interface FaqItem {
  /** `data-value` on the trigger in the original markup. */
  readonly value: string;
  readonly question: string;
  readonly answerHtml: string;
}

export interface FaqGroup {
  readonly title: string;
  readonly items: readonly FaqItem[];
}

const ABOUT_BRILLIANT: FaqGroup = {
  title: "About Brilliant",
  items: [
    {
      value: "who-is-brilliant-best-for",
      question: "Who is Brilliant best for?",
      answerHtml:
        `Brilliant is designed for anyone looking to get smarter, faster. Students, professionals, and curious lifelong learners from ages 10 to 110 can sharpen their skills through Brilliant’s interactive problem solving at their own pace. Personalized learning paths featuring thousands of interactive lessons help beginners and advanced learners alike build a real understanding of concepts—rather than just memorizing facts and formulas.`,
    },
    {
      value: "what-is-interactive-learning-and-why-is-it-effective",
      question: "What is interactive learning and why is it effective?",
      answerHtml:
        `On Brilliant, you learn by doing—instead of watching videos or reading dense blocks of text, you learn interactively, which has been shown to be <a href="https://www.educationworld.com/a_news/interactive-learning-helps-students-learn-six-times-more-moocs-study-says-1058054973" target="_blank" rel="noopener noreferrer">6x more effective</a>. Hands-on lessons and instant, personalized feedback make even the most complex ideas easy to grasp. Rather than memorizing formulas or coding languages, you’ll learn to think logically and understand concepts from a first-principles approach, leading to deeper comprehension and better retention.`,
    },
    {
      value: "how-does-brilliant-compare-to-other-learning-platforms-and-methods",
      question: "How does Brilliant compare to other learning platforms and methods?",
      answerHtml:
        `Unlike passive video lectures, dense textbooks, or long lists of practice problems, Brilliant uses interactive problem-solving where you learn STEM concepts by doing. This hands-on approach builds genuine understanding and better retention compared to traditional educational methods that rely on memorization.`,
    },
    {
      value: "how-much-time-should-i-commit-to-learning",
      question: "How much time should I commit to learning?",
      answerHtml:
        `Brilliant recommends just 15 minutes per day for optimal learning progress, with bite-sized lessons designed to fit into any schedule. On busier days, you can maintain your streak with quick 2-minute practice sessions, ensuring consistent progress without overwhelming time commitments.`,
    },
    {
      value: "can-i-learn-on-the-go",
      question: "Can I learn on-the-go?",
      answerHtml:
        `Yes. Brilliant’s native mobile apps for iOS and Android allow you to learn anywhere, with full progress syncing across all devices. Our bite-sized lessons are designed for mobile learning, letting you tackle complex concepts during your commute, on a break, or whenever you have a few minutes to spare.`,
    },
    {
      value: "how-can-i-stay-motivated-to-learn",
      question: "How can I stay motivated to learn?",
      answerHtml:
        `Brilliant’s gamified features like daily streaks, competitive leagues, and progress tracking keep you engaged and make learning feel rewarding.`,
    },
    {
      value: "can-learning-be-fun",
      question: "Can learning be fun?",
      answerHtml:
        `Absolutely. Brilliant transforms learning into an adventure with interactive puzzles, visual storytelling, and bite-sized lessons that make complex concepts click. Our gamified approach turns every subject into an exciting challenge that keeps you coming back for more. At Brilliant, we've cracked the code on making learning irresistibly fun.`,
    },
    {
      value: "how-can-i-improve-my-problem-solving-skills",
      question: "How can I improve my problem-solving skills?",
      answerHtml:
        `Brilliant helps you improve your problem-solving skills through interactive courses that teach you to break down complex problems into smaller, solvable parts. Our hands-on approach develops critical reasoning skills you can apply to real-world challenges across any domain, from logic puzzles to problems at work.`,
    },
  ],
};

const ABOUT_OUR_COURSES: FaqGroup = {
  title: "About our courses",
  items: [
    {
      value: "what-subjects-and-courses-does-brilliant-offer",
      question: "What subjects and courses does Brilliant offer?",
      answerHtml:
        `Brilliant offers <a href="https://brilliant.org/courses/" target="_blank" rel="noopener noreferrer">60+ interactive courses</a> covering math, science, computer science, programming, data analysis, AI, and more, with content spanning from foundational topics like algebra and logic to advanced subjects like machine learning and quantum computing. Whether you're building basic STEM foundations or advancing your career with cutting-edge skills, Brilliant has courses designed for your learning journey.`,
    },
    {
      value: "are-courses-written-by-experts",
      question: "Are courses written by experts?",
      answerHtml:
        `All of Brilliant’s courses are crafted by award-winning teachers, researchers, and professionals from top universities and leading tech companies. We maintain rigorous quality standards and regularly update our content library to ensure quality, accuracy, and relevance.`,
    },
    {
      value: "can-i-start-learning-as-a-beginner",
      question: "Can I start learning as a beginner?",
      answerHtml:
        `Brilliant is designed for everyone from beginners to advanced learners, with learning paths that start from foundational concepts and progress to professional-level skills. Our adaptive learning approach meets you at your current level and guides you through increasingly complex topics at your own pace.`,
    },
    {
      value: "can-i-learn-advanced-topics",
      question: "Can I learn advanced topics?",
      answerHtml:
        `Brilliant offers advanced courses in machine learning, neural networks, quantum computing, advanced algorithms, and more that push your skills to expert levels. Our curriculum includes cutting-edge topics designed for professionals and ambitious learners who want to master complex abilities.`,
    },
    {
      value: "are-new-courses-on-cutting-edge-topics-coming-soon",
      question: "Are new courses on cutting-edge topics coming soon?",
      answerHtml:
        `Brilliant continuously releases new interactive courses to expand our coverage of math, science, computer science, data analysis, AI and more. We prioritize quickly releasing new content about cutting-edge advancements in technology to keep learners up-to-date with the latest developments in each field.`,
    },
    {
      value: "how-long-does-it-take-to-complete-a-brilliant-course",
      question: "How long does it take to complete a Brilliant course?",
      answerHtml:
        `Most Brilliant courses can be completed in 2-6 weeks with just 15 minutes of daily learning, though completion time varies based on the course complexity and your learning pace. The platform's bite-sized lessons and flexible structure allow you to progress at your own speed, whether you prefer quick daily sessions or longer focused study periods.`,
    },
    {
      value: "what-should-i-learn",
      question: "What should I learn?",
      answerHtml:
        `Brilliant uses personalized recommendations to suggest courses and lessons based on your interests, skill level, and learning progress. We adaptively recommend whether you should practice existing concepts or learn new content based on what you need, creating customized learning paths that help you build upon your knowledge at the optimal pace.`,
    },
    {
      value: "can-i-follow-a-structured-curriculum-plan",
      question: "Can I follow a structured curriculum plan?",
      answerHtml:
        `Brilliant’s personalized learning paths guide you from foundational concepts to advanced topics, with each lesson building upon previous knowledge. These learning paths adapt to your pace and skill level, ensuring you follow the optimal sequence of courses and topics to build comprehensive understanding.`,
    },
  ],
};

const ABOUT_PREMIUM: FaqGroup = {
  title: "About Premium",
  items: [
    {
      value: "can-i-use-brilliant-for-free",
      question: "Can I use Brilliant for free?",
      answerHtml: `Yes, all users can complete two lessons per day for free.`,
    },
    {
      value: "what-is-the-difference-between-brilliants-free-and-premium-plans",
      question:
        "What is the difference between Brilliant’s free and Premium plans?",
      answerHtml: `On Brilliant’s free plan, you:
<ul>
<li>Get access to all courses</li>
<li>Can complete up to two lessons per day</li>
<li>Must progress through courses sequentially</li>
<li>See occasional ads</li>
</ul>
On Brilliant’s Premium plan, you:
<ul>
<li>Get access to all courses, plus personalized practice</li>
<li>Can do unlimited lessons per day, learning at your pace</li>
<li>Can start anywhere and jump ahead in courses, learning in whatever sequence you'd like</li>
<li>Never see ads</li>
<li>Get personalized tutoring by Koji</li>
</ul>`,
    },
    {
      value: "can-i-try-brilliant-premium-for-free",
      question: "Can I try Brilliant Premium for free?",
      answerHtml:
        `Yes, Brilliant offers a free trial of its Premium plan. Users on a free trial can cancel anytime. There is also a free plan with some restrictions available to all users.`,
    },
    {
      value: "what-premium-plans-and-pricing-does-brilliant-offer",
      question: "What Premium plans and pricing does Brilliant offer?",
      answerHtml:
        `Brilliant offers <a href="https://brilliant.org/subscribe/" target="_blank" rel="noopener noreferrer">individual subscriptions</a> with annual and monthly billing, and <a href="https://brilliant.org/subscribe/" target="_blank" rel="noopener noreferrer">Family subscriptions</a> with annual billing. Subscriptions can also be purchased as <a href="https://brilliant.org/gift-premium/" target="_blank" rel="noopener noreferrer">gifts</a>.`,
    },
    {
      value: "how-do-i-cancel-my-brilliant-subscription",
      question: "How can I cancel my Brilliant subscription?",
      answerHtml: `You can cancel your Brilliant subscription anytime from Subscription Settings`,
    },
  ],
};

/** Order the three accordion cards are painted in. */
export const FAQ_GROUPS: readonly FaqGroup[] = [
  ABOUT_BRILLIANT,
  ABOUT_OUR_COURSES,
  ABOUT_PREMIUM,
];

/** The original's JSON-LD lists the groups in a different order. */
export const JSON_LD_GROUP_ORDER: readonly FaqGroup[] = [
  ABOUT_BRILLIANT,
  ABOUT_PREMIUM,
  ABOUT_OUR_COURSES,
];
