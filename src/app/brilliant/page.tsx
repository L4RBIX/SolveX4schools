import { FeatureRow, type FeatureRowProps } from "@/components/brilliant/feature-row";
import { Footer } from "@/components/brilliant/footer";
import { GetStarted } from "@/components/brilliant/get-started";
import { Hero } from "@/components/brilliant/hero";
import { KojiSection } from "@/components/brilliant/koji-section";
import { Nav } from "@/components/brilliant/nav";
import { StatsBand } from "@/components/brilliant/stats-band";
import { SubjectTabs, type SubjectTab } from "@/components/brilliant/subject-tabs";
import { Testimonials, type Testimonial } from "@/components/brilliant/testimonials";

/**
 * All section copy lives here, in the server component. Every client module
 * below (`feature-row`, `subject-tabs`, `testimonials`, `get-started`) is a
 * client module, and a server component that imports a value from one only
 * ever receives a client reference — not the array itself. Keeping the strings
 * in one place also makes them auditable against the extraction in one read.
 *
 * The Python in here is Brilliant's, not ours. "Thinking in Python" is a real
 * course on a real site, this tree is a verbatim reproduction of it, and
 * `/brilliant/**` 404s outside development (`tests/school/routes.test.ts`). A
 * migration that renamed it to C++ would break the only baseline the product's
 * own pages are measured against, and would put a course name on a page that
 * the site it copies does not have. Leave it.
 */

const ORIGIN = "/assets/original/brilliant/brilliant.org";

/*
  The reference gives each feature row its own clip. Three of those four are
  maths demos — fractions, expanding (x+4)(x+2), multiplying 3x(2y+5) — so they
  stay out of this build and those rows share the Computer Science clip instead.

  Sharing one clip across three rows reads as a mistake if they all start at 0,
  so each row seeks to a different point in the 17.4s runtime. Brilliant has no
  second coding clip; its course pages ship no video at all.
*/
const CS_CLIP = {
  webm: `${ORIGIN}/videos/homepage/courses/cs-refresh.webm`,
  poster: `${ORIGIN}/videos/homepage/courses/posters/cs-refresh.png`,
} as const;

/*
  "Designed to keep you learning" keeps its own original: it is Koji and the
  streak pillars, with no maths in it.
*/
const KEEP_LEARNING_CLIP = {
  webm: `${ORIGIN}/loggedOutHomepage/keep-learning-desktop.webm`,
  mp4: `${ORIGIN}/loggedOutHomepage/keep-learning-desktop.mp4`,
  poster: `${ORIGIN}/loggedOutHomepage/keep-learning-desktop.jpg`,
} as const;

const FEATURE_ROWS: readonly FeatureRowProps[] = [
  {
    heading: "Concepts that click",
    body: "Every session is visual and interactive. Instead of just memorizing, you play with concepts until they click. And you work through problems step-by-step, building your intuition along the way.",
    tone: "sky",
    video: { ...CS_CLIP, startAt: 0 },
    mediaSide: "left",
  },
  {
    heading: "Built to make you think",
    body: "Questions are designed to find the edge of what you know, then push a little past it. It gets to the heart of where you're getting stuck.",
    tone: "mint",
    video: { ...CS_CLIP, startAt: 6 },
    mediaSide: "right",
  },
  {
    heading: "Adapts to exactly where you are",
    body: "Koji tracks what you've mastered and where you're stuck, then builds practice around the gaps. He speeds up when you're ready, and slows down when you need it.",
    tone: "peach",
    video: { ...CS_CLIP, startAt: 12 },
    mediaSide: "left",
  },
  {
    heading: "Designed to keep you learning",
    body: "Brilliant is designed to feel like a challenge, not a chore. Streaks, levels, and daily goals motivate you to build on your progress and keep moving forward.",
    tone: "sky",
    video: KEEP_LEARNING_CLIP,
    mediaSide: "right",
  },
];

/* Sections 9 and 10 — same two-column geometry, extracted stills as media. */
const STILL_ROWS: readonly FeatureRowProps[] = [
  {
    heading: "Always on your schedule",
    body: "Say goodbye to trial-and-error hiring, driving across town, and fitting another thing into your schedule. Koji is there Sunday night before the test, Saturday morning for fun, and the quiet 20 minutes before dinner.",
    tone: "mint",
    mediaSide: "left",
    image: {
      desktop: { src: `${ORIGIN}/loggedOutHomepage/schedule-desktop.png`, width: 554, height: 386 },
      mobile: { src: `${ORIGIN}/loggedOutHomepage/schedule-mobile.png`, width: 337, height: 230 },
    },
  },
  {
    heading: "Built by top learning experts",
    body: "Our curriculum is crafted by award-winning teachers, subject-matter experts, and learning designers from top institutions.",
    tone: "peach",
    mediaSide: "right",
    image: {
      desktop: { src: `${ORIGIN}/loggedOutHomepage/experts-desktop.png`, width: 1116, height: 772 },
      mobile: { src: `${ORIGIN}/loggedOutHomepage/experts-mobile.png`, width: 674, height: 460 },
    },
  },
];

/*
  Section 8. Course names re-extracted from the DOM, one list per tab. Only
  The reference lists four subjects (Math, Computer Science, Science, Data
  Analysis). Only Computer Science is kept in this build; its "additional
  courses" count is the reference's own.
*/
const SUBJECT_TABS: readonly SubjectTab[] = [
  {
    label: "Computer Science",
    courses: [
      "Thinking in Code",
      "Programming with Variables",
      "Thinking in Python",
      "Programming with Functions",
      "Algorithmic Thinking",
      "Computer Science Fundamentals",
      "Introduction to Neural Networks",
    ],
    additional: "7 additional courses",
    clip: "cs",
  },
];

/*
  Section 11. Two of the five roles were occluded at capture and are simply
  absent — those cards render no role line.
*/
const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "I learned the basics of Trigonometry in 12 days, I just got into a flow. I’m best in my class now.",
    name: "Tyler",
    role: "10th grader",
    portrait: `${ORIGIN}/images/homepage/testimonials/tyler.png`,
  },
  {
    quote:
      "I didn’t expect him to learn this fast. He explained how to write algorithms at dinner tonight.",
    name: "Noah",
    portrait: `${ORIGIN}/images/homepage/testimonials/noah.png`,
  },
  {
    quote:
      "I wasn’t getting the slope unit in class, but it finally clicked after 20 minutes talking to Koji!",
    name: "Eliza",
    role: "7th grader",
    portrait: `${ORIGIN}/images/homepage/testimonials/eliza.png`,
  },
  {
    quote:
      "She’ll get stuck on a problem and then yell, ‘Never mind, Mom, I got it!’ How great is that?",
    name: "Arianne",
    portrait: `${ORIGIN}/images/homepage/testimonials/arianne.png`,
  },
  {
    quote:
      "They enthusiastically do it outside of class. I had 8th graders say, ‘This makes me want to do more math!’",
    name: "Aaron",
    role: "Algebra Teacher",
    portrait: `${ORIGIN}/images/homepage/testimonials/aaron.png`,
  },
];

export default function BrilliantHome() {
  return (
    <div className="min-h-screen bg-b-white">
      <Nav />

      {/* The hero sits on its own full-bleed paper band; the padding clears
          the fixed pill bar (16px inset + 56px tall). */}
      <div className="bg-b-paper pt-[72px]">
        <Hero />
      </div>

      <StatsBand />
      <KojiSection />

      <div className="flex flex-col gap-24 bg-b-white py-20 lg:gap-40 lg:py-28">
        {FEATURE_ROWS.map((row) => (
          <FeatureRow key={row.heading} {...row} />
        ))}
      </div>

      <SubjectTabs
        heading="From grade 5 to college and beyond"
        listHeading="Covered subjects"
        tabs={SUBJECT_TABS}
      />

      <div className="flex flex-col gap-24 bg-b-white py-20 lg:gap-40 lg:py-28">
        {STILL_ROWS.map((row) => (
          <FeatureRow key={row.heading} {...row} />
        ))}
      </div>

      <Testimonials
        heading="Students, parents, and teachers love us"
        items={TESTIMONIALS}
      />

      <GetStarted
        heading="The best tutor you'll ever have is already here"
        cta="Get started"
        ctaHref="/brilliant/courses"
      />

      <Footer />
    </div>
  );
}
