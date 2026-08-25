import Link from "next/link";

import { ConsentButton } from "./consent-button";
import {
  IconArrowUpRight,
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconTwitter,
} from "./social-icons";
import { BrilliantWordmark } from "./wordmark";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  label: string;
  links: readonly FooterLink[];
  /** Company and "Behind the scenes" sit inside one extra VStack wrapper. */
  extraWrapper?: boolean;
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
    extraWrapper: true,
    links: [
      { label: "About us", href: "/about/" },
      { label: "Careers", href: "/careers/" },
    ],
  },
  {
    label: "Behind the scenes",
    extraWrapper: true,
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
    icon: <IconFacebook />,
  },
  {
    label: "Brilliant on Instagram",
    href: "https://www.instagram.com/brilliantorg",
    icon: <IconInstagram />,
  },
  {
    label: "Brilliant on Twitter",
    href: "https://twitter.com/brilliantorg",
    icon: <IconTwitter />,
  },
  {
    label: "Brilliant on LinkedIn",
    href: "https://www.linkedin.com/company/brilliant-org/",
    icon: <IconLinkedIn />,
  },
] as const;

/** Every footer link swaps a transparent 2px bottom border for #456dff. */
const UNDERLINE = "border-b-2 border-transparent hover:border-[#456dff]";
const COLUMN_LINK = `relative text-white ${UNDERLINE}`;
const BOTTOM_LINK = `text-left text-[12px] leading-[1.5] text-[#999] ${UNDERLINE}`;

function LinkVStack({ column }: { column: FooterColumn }) {
  return (
    <div data-slot="box">
      <p data-slot="p" className="mb-4 text-[16px] leading-[1.5] text-[#999]">
        {column.label}
      </p>
      <div data-slot="vstack" className="flex flex-col items-start gap-3">
        {column.links.map((link) => (
          <div data-slot="box" key={link.href}>
            <a href={link.href} className={COLUMN_LINK}>
              {link.label}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Black site footer. Five grid children — four link columns plus the socials
 * row — over a wordmark that only moves beside them at 1280px.
 */
export function AboutFooter() {
  const year = new Date().getFullYear();

  return (
    <div data-slot="flex" className="flex w-full justify-center bg-black pt-20">
      <div
        data-slot="box"
        className="mx-6 w-full max-w-full min-[360px]:max-w-[432px] min-[769px]:mx-10 min-[769px]:max-w-[1216px] min-[1280px]:mx-8"
      >
        <div
          data-slot="flex"
          className="mb-20 flex w-full flex-col items-start justify-between gap-0 min-[769px]:mb-32 min-[1280px]:flex-row"
        >
          <Link
            href="/"
            className="mb-12 w-[40%] min-[1280px]:mb-0 min-[1280px]:w-1/4"
          >
            <BrilliantWordmark className="h-8 w-auto text-white" />
          </Link>

          <div
            data-slot="box"
            className="grid max-w-full flex-1 grid-cols-1 items-start gap-x-8 gap-y-12 min-[481px]:w-[576px] min-[769px]:w-full min-[769px]:grid-cols-[repeat(4,140px)] min-[1280px]:grid-cols-[repeat(5,minmax(0,1fr))] min-[1280px]:gap-y-0"
          >
            {COLUMNS.map((column) =>
              column.extraWrapper ? (
                <div
                  data-slot="vstack"
                  key={column.label}
                  className="flex flex-col items-start gap-6"
                >
                  <LinkVStack column={column} />
                </div>
              ) : (
                <LinkVStack key={column.label} column={column} />
              ),
            )}

            <div data-slot="hstack" className="flex items-center gap-6">
              {SOCIALS.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex text-[#999] hover:text-[#456dff]"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

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
              <a href="/terms-of-use/" className={BOTTOM_LINK}>
                Terms of service
              </a>
            </div>
            <div
              data-slot="flex"
              className="flex w-full justify-start min-[769px]:w-auto"
            >
              <ConsentButton
                className={`cursor-pointer bg-transparent ${BOTTOM_LINK}`}
              />
            </div>
            <div
              data-slot="flex"
              className="flex w-full justify-start min-[769px]:w-auto"
            >
              <a href="/ccpa-policy/" className={BOTTOM_LINK}>
                California privacy policy
              </a>
            </div>
            <div
              data-slot="flex"
              className="flex w-full justify-start min-[769px]:w-auto"
            >
              <a
                href="/privacy/"
                className={`inline-flex items-center justify-start gap-1.5 whitespace-nowrap text-white ${BOTTOM_LINK}`}
              >
                Privacy policy
                <IconArrowUpRight />
              </a>
            </div>
          </div>

          <p
            data-slot="p"
            className="text-[12px] leading-[1.5] break-words text-[#999] min-[1280px]:w-1/2"
          >
            © {year} Brilliant Worldwide, Inc., Brilliant and the Brilliant Logo
            are trademarks of Brilliant Worldwide, Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
