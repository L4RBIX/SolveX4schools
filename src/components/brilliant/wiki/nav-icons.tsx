/**
 * The two inline SVGs in the wiki page's fixed header, copied path-for-path
 * from the served HTML. Neither path carries a `fill` attribute on the
 * original — both inherit `fill: var(--navbar-icon-color)` (#666666, #000 on
 * hover/focus) from the header stylesheet, so the fill lives on the <svg>
 * here and is inherited the same way.
 */

const ICON_CLASS =
  "flex shrink-0 fill-[#666] transition-[fill] duration-300 ease-in-out group-hover:fill-black group-focus-visible:fill-black";

export function HomeIcon() {
  return (
    <svg
      className={ICON_CLASS}
      width="21"
      height="20"
      viewBox="0 0 21 20"
      aria-hidden="true"
      focusable="false"
    >
      <g clipPath="url(#wiki-nav-home-clip)">
        <path d="M20.2832 9.37336L10.9098 0L1.53638 9.37336L2.71904 10.556L10.9098 2.36534L19.1005 10.556L20.2832 9.37336Z" />
        <path d="M4.1984 11.63L10.9096 4.93977L17.6208 11.63V20H13.4183L13.4183 13.3098L8.40061 13.3098L8.40061 20H4.1984V11.63Z" />
      </g>
      <defs>
        <clipPath id="wiki-nav-home-clip">
          <rect width="20" height="20" fill="white" transform="translate(0.536377)" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function CoursesIcon() {
  return (
    <svg
      className={ICON_CLASS}
      width="21"
      height="20"
      viewBox="0 0 21 20"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4.73594 1.6H17.5359V16H19.1359V0H4.73594V1.6Z" />
      <path d="M4.73594 15.2H10.3359V13.6H4.73594V15.2Z" />
      <path d="M4.73594 6.39999H12.7359V11.2H4.73594V6.39999Z" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.53613 20V3.2H15.9361V20H1.53613ZM3.13613 4.8H14.3361V18.4H3.13613V4.8Z"
      />
    </svg>
  );
}
