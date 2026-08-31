/**
 * `div.toc.wiki-toc`
 *
 *   .wiki-toc        clear: left; padding 8px 8px 8px 16px; margin 0 0 40px 16px;
 *                    border-left: 3px solid #f3f3f3; width 376px
 *   .wiki-toc h4     margin-bottom 10px   (h4 base: 20px / 500 / 1.5em / #161616)
 *   .wiki-toc ul     margin 0 0 0 12px; font-size 14px
 *   .wiki-toc li a   #777, hover #456DFF
 *
 * `ul.unstyled` has no declaration in any loaded stylesheet, so the discs stay.
 */

interface TocEntry {
  readonly label: string;
  readonly href: string;
}

export const TOC_ENTRIES: readonly TocEntry[] = [
  { label: "Properties of Logarithms - Basic", href: "#logarithmic-functions-properties-easy" },
  { label: "Worked Examples Using Properties", href: "#worked-examples-using-properties" },
  {
    label: "Properties of Logarithms - Intermediate",
    href: "#logarithmic-functions-properties-medium",
  },
  { label: "Problem Solving - Basic", href: "#logarithmic-functions-problem-solving-easy" },
  {
    label: "Problem Solving - Intermediate",
    href: "#logarithmic-functions-problem-solving-medium",
  },
  { label: "Problem Solving - Advanced", href: "#logarithmic-functions-problem-solving-hard" },
  { label: "Applications", href: "#applications" },
  { label: "See Also", href: "#see-also" },
];

export function WikiToc() {
  return (
    <nav
      aria-labelledby="wiki-toc-heading"
      className="mb-10 ml-4 w-[376px] clear-left border-l-[3px] border-[#f3f3f3] py-2 pr-2 pl-4"
    >
      <h4
        id="wiki-toc-heading"
        className="mb-[10px] font-b-sans text-[20px] leading-[1.5em] font-medium text-[#161616]"
      >
        Contents
      </h4>
      <ul className="m-0 ml-3 list-disc p-0 text-[14px]">
        {TOC_ENTRIES.map((entry) => (
          <li key={entry.href} className="mb-1.5 leading-[1.6em] last:m-0">
            <a
              href={entry.href}
              className="text-[#777] transition-colors hover:text-[#456DFF]"
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
