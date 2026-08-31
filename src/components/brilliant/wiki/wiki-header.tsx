import { WIKI_CONTAINER, WIKI_MIN_WIDTH } from "./container";
import { CoursesIcon, HomeIcon } from "./nav-icons";

/**
 * `#header.site-header.refreshed-navbar` — logged-out wiki chrome.
 *
 *   .site-header                      position: fixed; top/left 0; width 100%;
 *                                     min-width 1200px; z-index 400
 *   .hdr-big .site-header             min-height 60px; background #fff
 *   .hdr-big .refreshed-navbar        box-shadow 0 0 15px rgba(0,0,0,.1); no border
 *   .hdr-big .site-header .container  flex; align-items center; margin-top 4px
 *   #logged-out-header                height 60px
 *
 * The CTA pair is `float: right` in the original, so the DOM order
 * Sign up -> Log in paints as Log in, then Sign up hard right; that painted
 * order is what is written out here.
 */

const NAV_LINK = [
  "group relative flex flex-nowrap items-center justify-between gap-2",
  "mr-8 py-4 text-[16px] font-normal capitalize text-[#666]",
  "transition-colors duration-200 hover:rounded-md hover:text-black focus-visible:text-black",
  "focus-visible:outline-none",
  // ::after — the 2px hover rule that fades in and lifts 2px
  "after:absolute after:top-full after:left-0 after:h-[2px] after:w-full after:content-['']",
  "after:translate-y-0 after:bg-[#ccc] after:opacity-0",
  "after:transition after:duration-200 after:ease-in-out",
  "hover:after:-translate-y-[2px] hover:after:opacity-100",
  "focus-visible:after:-translate-y-[2px] focus-visible:after:opacity-100",
  // ::before — the 3px #2c6fef focus ring, inset 4px vertically, -16px horizontally
  "focus-visible:before:absolute focus-visible:before:top-1 focus-visible:before:right-[-16px]",
  "focus-visible:before:bottom-1 focus-visible:before:left-[-16px] focus-visible:before:rounded-md",
  "focus-visible:before:border-[3px] focus-visible:before:border-[#2c6fef] focus-visible:before:content-['']",
].join(" ");

const BTN = [
  "inline-block w-[108px] rounded-[54px] border-2 px-4 py-[2px]",
  "text-center align-middle font-b-sans text-[16px] font-medium leading-[2]",
  "transition-all duration-300 focus-visible:outline-none",
  "focus-visible:shadow-[0_0_0_3px_rgba(218,226,255,0.3)]",
].join(" ");

const NEXT_PARAM = "?next=/wiki/logarithms/";

export function WikiHeader() {
  return (
    <div
      id="header"
      className={`fixed top-0 left-0 z-[400] min-h-[60px] w-full bg-b-white shadow-[0_0_15px_rgba(0,0,0,0.1)] ${WIKI_MIN_WIDTH}`}
    >
      <div
        id="logged-out-header"
        className={`${WIKI_CONTAINER} mt-1 flex h-[60px] items-center justify-start`}
      >
        <div className="mr-6">
          <a href="/brilliant" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/original/brilliant/brilliant.org/site_media/version-0/images/brilliant-wordmark-black.svg"
              alt="Brilliant"
              width={101}
              height={24}
              className="h-6 w-auto"
            />
          </a>
        </div>

        <nav className="flex flex-nowrap">
          <span className="p-0">
            <a href="/brilliant" className={NAV_LINK}>
              <HomeIcon />
              Home
            </a>
          </span>
          <span className="p-0">
            <a href="/brilliant/courses" className={NAV_LINK}>
              <CoursesIcon />
              Courses
            </a>
          </span>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-[10px]">
          <a
            href={`https://brilliant.org/account/login/${NEXT_PARAM}`}
            rel="nofollow"
            className={`${BTN} border-[#ccc] bg-transparent text-black hover:border-black`}
          >
            Log in
          </a>
          <a
            href={`https://brilliant.org/account/signup/${NEXT_PARAM}`}
            rel="nofollow"
            className={`${BTN} border-[#29cc57] bg-b-green text-b-white hover:border-[#15b441] hover:bg-[#15b441]`}
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
