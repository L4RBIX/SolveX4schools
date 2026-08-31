import { ABOUT_IMG } from "./assets";
import type { SplitSectionProps } from "./split-section";

/**
 * Copy is verbatim from the page, curly apostrophes and en dashes included.
 * Each string is one paragraph; the component joins them with <br><br>, which
 * is how the original marks its paragraph breaks.
 */
export const SPLIT_SECTIONS: readonly SplitSectionProps[] = [
  {
    id: "what-we-do",
    heading: "What we do",
    paragraphs: [
      "At Brilliant, we help our learners achieve much higher levels of ability in STEM, in less time, with more purpose and joy.",
      "We do this by designing learning that’s interactive, adaptive, and fun — and delivering it through a personal tutor at an accessible price.",
      "Our focus is on math and coding, and the problem-solving skills those subjects imbue.",
    ],
    bgBase: "linear-gradient(0deg, #f8f8f8 0%, white 100%)",
    bgDesktop: "linear-gradient(90deg, white 0%, #f8f8f8 100%)",
    image: `${ABOUT_IMG}/what-we-do.svg`,
    mobileImage: `${ABOUT_IMG}/what-we-do.svg`,
    assetSide: "right",
    assetBeforeClassName:
      "before:[background-position:center] before:left-0 before:right-0 before:w-full min-[769px]:before:left-auto min-[769px]:before:w-[90%]",
  },
  {
    id: "our-approach",
    heading: "Our approach",
    paragraphs: [
      "What’s the best way to teach variables to a beginner? This is the kind of question that everyone at Brilliant – from math PhDs to engineers and designers – obsesses over.",
      "We read every piece of feedback. We measure everything. Knowing how many users practice every day, and whether people solve problems of increasing difficulty over time, allows us to get the learning experience just right.",
      "This is what’s driving our exponential growth. With millions of problem tries every day, we’re rapidly increasing the pace at which we’re able to test our pedagogical ideas.",
    ],
    bgBase: "linear-gradient(0deg, #f6f8ff 0%, white 100%)",
    bgDesktop: "linear-gradient(90deg, #f6f8ff 0%, white 100%)",
    image: `${ABOUT_IMG}/lesson-completions-chart.svg`,
    mobileImage: `${ABOUT_IMG}/lesson-completions-chart.svg`,
    assetSide: "left",
    assetBeforeClassName:
      "before:[background-position:center] before:left-0 before:right-0 before:w-full min-[769px]:before:[background-position:right] min-[769px]:before:right-auto min-[769px]:before:w-[70%] min-[769px]:before:max-w-[468px]",
  },
  {
    id: "our-learners",
    heading: "Our learners",
    paragraphs: [
      "As an ethos, we teach people who take pride in having a well-trained mind. Our learners ask “how far can I go?” not “what will be on the test?”. They know the future belongs to people who don’t wait for permission to set their own bar.",
      "In a world with AI, we need even more critical thinkers, not fewer. We help create them across a range of learners: students seeking to excel in STEM, homeschools seeking an engaging curriculum, and lifelong learners staying sharp.",
      "We’ve grown on the strength of being so good that you’ll voluntarily learn each day. This is very hard to do for math. But we’re demonstrating that it’s possible.",
    ],
    bgBase: "linear-gradient(0deg, #faf7ff 0%, white 100%)",
    bgDesktop: "linear-gradient(90deg, white 0%, #faf7ff 100%)",
    image: `${ABOUT_IMG}/our-learners.svg`,
    mobileImage: `${ABOUT_IMG}/our-learners-mobile.svg`,
    assetSide: "right",
    assetBeforeClassName:
      "before:[background-position:bottom] before:left-0 before:right-0 before:w-full min-[769px]:before:left-auto min-[769px]:before:w-[90%]",
  },
];
