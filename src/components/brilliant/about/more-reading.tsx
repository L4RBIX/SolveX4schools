import { ABOUT_IMG } from "./assets";
import { AboutContainer } from "./container";
import { SectionHeading } from "./section-heading";

interface Post {
  title: string;
  href: string;
  date: string;
  minutes: number;
}

const POSTS: readonly Post[] = [
  {
    title: "Hand-crafted, Machine made: How we make learning games",
    href: "https://blog.brilliant.org/hand-crafted-machine-made/",
    date: "Jan 30",
    minutes: 5,
  },
  {
    title: "Programming in 2025: A preview of our upcoming CS courses",
    href: "https://blog.brilliant.org/decomposition-and-abstraction/",
    date: "Jan 10",
    minutes: 3,
  },
  {
    title: "Game on: Solving for x-citement with interactive Algebra",
    href: "https://blog.brilliant.org/solving-equations/",
    date: "Nov 8",
    minutes: 2,
  },
  {
    title: "Coding rebooted: Computer Science on Brilliant",
    href: "https://blog.brilliant.org/thinking-in-code/",
    date: "Nov 4",
    minutes: 2,
  },
];

const LINK_CLASS =
  "mb-1 -mx-1 px-1 text-[16px] font-bold text-b-ink no-underline min-[769px]:text-[20px] " +
  "hover:underline hover:decoration-[#456dff] hover:decoration-2 hover:underline-offset-2 " +
  "active:text-[#456dff] active:underline active:decoration-[#456dff] active:decoration-2 active:underline-offset-2 " +
  "focus-visible:overflow-clip focus-visible:bg-b-white focus-visible:shadow-[0_0_0_3px_#456dff]";

/** "More reading" — four outbound blog links beside a static illustration. */
export function MoreReading() {
  return (
    <section
      data-slot="section"
      className="w-full px-6 py-16 min-[769px]:py-[108px]"
    >
      <AboutContainer>
        <SectionHeading className="mb-8 min-[769px]:mb-[60px]">
          More reading
        </SectionHeading>

        <div
          data-slot="flex"
          className="flex flex-col items-center gap-10 min-[769px]:flex-row min-[769px]:gap-16"
        >
          <img
            data-slot="img"
            src={`${ABOUT_IMG}/more-reading.svg`}
            alt=""
            className="w-full rounded-[32px] min-[769px]:w-1/2"
          />

          <div
            data-slot="vstack"
            className="flex w-full flex-col items-start gap-5 min-[769px]:w-1/2"
          >
            {POSTS.map((post) => (
              <div data-slot="box" key={post.href}>
                <a
                  href={post.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLASS}
                >
                  {post.title}
                </a>
                <p
                  data-slot="p"
                  className="text-[14px] leading-[1.5] text-[rgba(0,0,0,0.6)] min-[769px]:text-[16px]"
                >
                  {post.date} • {post.minutes} min read
                </p>
              </div>
            ))}
          </div>
        </div>
      </AboutContainer>
    </section>
  );
}
