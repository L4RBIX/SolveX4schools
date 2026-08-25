import type { DeckCourse } from "./course-deck";

/**
 * Content for the authenticated surfaces, read out of the live DOM rather than
 * written by hand: titles, level labels, lesson names, hrefs and which lesson
 * is the active one (the original dims completed/locked rows to `opacity: .5`).
 *
 * Course art is the real CDN asset, downloaded into `public/assets/original/`.
 * `href`s are kept as the source paths so the mapping back to brilliant.org
 * stays auditable; they are not wired to local routes.
 */

const ART = "/assets/original/brilliant/ds055uzetaobb.cloudfront.net/chapter";

export const JUMP_BACK_IN: DeckCourse[] = [
  {
    id: "algorithmic-thinking",
    title: "Algorithmic Thinking",
    level: "Level 1",
    href: "/courses/algorithms-greedy-dp/",
    image: `${ART}/Algorithmic_Thinking-ZSOEgi.png`,
    thumb: `${ART}/Algorithmic_Thinking-ZSOEgi.png`,
    lessons: [
      {
        title: "The Scheduling Problem",
        href: "/brilliant/lesson",
        done: false,
        active: true,
      },
      {
        title: "Solving Instances",
        href: "/courses/algorithms-greedy-dp/scheduling-problem/instances-of-a-problem/",
        done: false,
        active: false,
      },
    ],
  },
  {
    id: "exploring-data-visually",
    title: "Exploring Data Visually",
    level: "Level 1",
    href: "/courses/visual-exploration/",
    image: `${ART}/total-AuJUe6.png`,
    thumb: `${ART}/total-AuJUe6.png`,
    lessons: [
      {
        title: "Reading Bar Charts",
        href: "/courses/visual-exploration/intro/edv-newch-8/",
        done: false,
        active: true,
      },
    ],
  },
  {
    id: "scientific-thinking",
    title: "Scientific Thinking",
    level: "Level 1",
    href: "/courses/puzzle-science/",
    image: `${ART}/puzzle-science-vL2Jb1.png`,
    thumb: `${ART}/puzzle-science-vL2Jb1.png`,
    lessons: [
      {
        title: "Connecting Gears",
        href: "/courses/puzzle-science/gears/connecting-gears/",
        done: false,
        active: true,
      },
    ],
  },
  {
    id: "probability-and-chance",
    title: "Probability and Chance",
    level: "Level 1",
    href: "/courses/winning-with-probability/",
    image: `${ART}/Probability_And_Chance-qRuc60.png`,
    thumb: `${ART}/Probability_And_Chance-qRuc60.png`,
    lessons: [
      {
        title: "Comparing Likelihoods",
        href: "/courses/winning-with-probability/introduction/comparing-likelihood/",
        done: false,
        active: true,
      },
    ],
  },
  {
    id: "how-ai-works",
    title: "How AI Works",
    level: "Level 1",
    href: "/courses/how-llms-work/",
    image: `${ART}/how-llms-work-xk99Hz.png`,
    thumb: `${ART}/how-llms-work-xk99Hz.png`,
    lessons: [
      {
        title: "Intro to Language Models",
        href: "/courses/how-llms-work/chapter-1/intro-to-language-models/",
        done: false,
        active: true,
      },
      {
        title: "Predicting the Next Word",
        href: "/courses/how-llms-work/chapter-1/ngrams-2-split/",
        done: false,
        active: false,
      },
    ],
  },
];
