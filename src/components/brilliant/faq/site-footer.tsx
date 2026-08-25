import Link from "next/link";

import {
  BrilliantWordmark,
  ExternalArrow,
  FacebookGlyph,
  InstagramGlyph,
  LinkedInGlyph,
  TwitterGlyph,
} from "./icons";

/**
 * Section 4 — the real global footer as served with /faq/: black band, five
 * grid cells (four link columns + the social row), then a legal row.
 *
 * This is deliberately NOT `src/components/brilliant/footer.tsx`: that file is
 * a white footer with invented column titles, link labels and glyphs, it is
 * owned by another agent, and it does not match this page. The strings, hrefs
 * and SVG geometry below are all verbatim from the capture.
 *
 * `rel="noopener noreferrer"` is added to the `target="_blank"` social links;
 * the capture only recorded `target`, but shipping it bare is a lint error and
 * a tabnabbing hole. That is the only attribute here that is not verbatim.
 */

interface FooterLink {
  readonly label: string;
  readonly href: string;
}

interface FooterColumn {
  readonly label: string;
  readonly links: readonly FooterLink[];
}

const COLUMNS: readonly FooterColumn[] = [
  {
    label: "Product",
    links: [
      { label: "Courses", href: "/courses/" },
      { label: "Pricing", href: "/subscribe/" },
      { label: "Gift Brilliant", href: "/gift-premium/" },
      { label: "Resources", href: "/resources/" },
      { label: "Help", href: "/help/" },
    ],
  },
  {
    label: "Solutions",
    links: [
      { label: "Educators", href: "/educators/" },
      { label: "Homeschools", href: "/start/homeschool/" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About us", href: "/about/" },
      { label: "Careers", href: "/careers/" },
    ],
  },
  {
    label: "Behind the scenes",
    links: [
      {
        label: "A Tutor in Every Home",
        href: "https://blog.brilliant.org/a-world-class-tutor-in-every-home/",
      },
      {
        label: "AI at Brilliant",
        href: "https://blog.brilliant.org/hand-crafted-machine-made/",
      },
      {
        label: "AI Evals for Learning Games",
        href: "https://blog.brilliant.org/when-almost-right-is-catastrophically-wrong-evals-for-ai-learning-games/",
      },
      {
        label: "Visual Algebra",
        href: "https://blog.brilliant.org/visual-algebra/",
      },
      {
        label: "Decomposition and Abstraction",
        href: "https://blog.brilliant.org/decomposition-and-abstraction/",
      },
    ],
  },
];

const SOCIALS = [
  {
    label: "Brilliant on Facebook",
    href: "https://www.facebook.com/brilliantorg",
    Glyph: FacebookGlyph,
  },
  {
    label: "Brilliant on Instagram",
    href: "https://www.instagram.com/brilliantorg",
    Glyph: InstagramGlyph,
  },
  {
    label: "Brilliant on Twitter",
    href: "https://twitter.com/brilliantorg",
    Glyph: TwitterGlyph,
  },
  {
    label: "Brilliant on LinkedIn",
    href: "https://www.linkedin.com/company/brilliant-org/",
    Glyph: LinkedInGlyph,
  },
] as const;

const LEGAL_BASE =
  "relative border-b-2 border-transparent text-left text-[12px] leading-[1.5] hover:border-[#456dff]";

export function SiteFooter() {
  return (
    <footer data-slot="flex" className="flex w-full justify-center bg-black pt-20">
      <div
        data-slot="box"
        className="mx-6 w-full max-w-full min-[360px]:max-w-[432px] min-[769px]:mx-10 min-[769px]:max-w-[1216px] min-[1280px]:mx-8"
      >
        {/* ---- top row ---- */}
        <div
          data-slot="flex"
          className="mb-20 flex w-full flex-col items-start justify-between gap-0 min-[769px]:mb-32 min-[1280px]:flex-row"
        >
          <Link
            href="/"
            aria-label="Brilliant"
            className="mb-12 inline-flex w-[40%] min-[1280px]:mb-0 min-[1280px]:w-[25%]"
          >
            <BrilliantWordmark className="h-8 w-[114px] shrink-0 text-white" />
          </Link>

          <div
            data-slot="box"
            className="grid max-w-full flex-1 grid-cols-1 items-start gap-x-8 gap-y-12 min-[481px]:w-[576px] min-[769px]:w-full min-[769px]:grid-cols-[repeat(4,140px)] min-[1280px]:grid-cols-5 min-[1280px]:gap-y-0"
          >
            {COLUMNS.map((column, index) => {
              const body = (
                <>
                  <p className="mb-4 text-[16px] leading-[1.5] text-[#999]">
                    {column.label}
                  </p>
                  <div
                    data-slot="vstack"
                    className="flex flex-col items-start gap-3"
                  >
                    {column.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="relative border-b-2 border-transparent text-[16px] leading-[1.5] text-white hover:border-[#456dff]"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </>
              );

              // Columns 3 and 4 sit inside an extra 24px-gap vstack wrapper.
              return index >= 2 ? (
                <div key={column.label}>
                  <div
                    data-slot="vstack"
                    className="flex flex-col items-start gap-6"
                  >
                    <div>{body}</div>
                  </div>
                </div>
              ) : (
                <div key={column.label}>{body}</div>
              );
            })}

            <div
              data-slot="hstack"
              className="flex flex-row items-center gap-6"
            >
              {SOCIALS.map(({ label, href, Glyph }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-[#999] transition-colors hover:text-[#456dff]"
                >
                  <Glyph className="shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ---- bottom row ---- */}
        <div
          data-slot="flex"
          className="mb-12 flex w-full flex-col justify-between gap-8 min-[992px]:mb-20 min-[1280px]:flex-row"
        >
          <div
            data-slot="flex"
            className="flex flex-col items-center gap-3 min-[769px]:flex-row min-[769px]:gap-4"
          >
            <div
              data-slot="flex"
              className="flex w-full justify-start min-[769px]:w-auto"
            >
              <a href="/terms-of-use/" className={`${LEGAL_BASE} text-[#999]`}>
                Terms of service
              </a>
            </div>

            <div
              data-slot="flex"
              className="flex w-full justify-start min-[769px]:w-auto"
            >
              {/* No destination: the original opens a consent flow that was not traced. */}
              <button
                type="button"
                className={`${LEGAL_BASE} cursor-pointer bg-transparent text-[#999]`}
              >
                Do not sell my personal information
              </button>
            </div>

            <div
              data-slot="flex"
              className="flex w-full justify-start min-[769px]:w-auto"
            >
              <a href="/ccpa-policy/" className={`${LEGAL_BASE} text-[#999]`}>
                California privacy policy
              </a>
            </div>

            <div
              data-slot="flex"
              className="flex w-full justify-start min-[769px]:w-auto"
            >
              <a
                href="/privacy/"
                className={`${LEGAL_BASE} inline-flex items-center justify-start gap-1.5 whitespace-nowrap text-white`}
              >
                Privacy policy
                <ExternalArrow />
              </a>
            </div>
          </div>

          <p className="text-[12px] leading-[1.5] break-words text-[#999] min-[1280px]:w-1/2">
            &copy; 2026 Brilliant Worldwide, Inc., Brilliant and the Brilliant
            Logo are trademarks of Brilliant Worldwide, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
