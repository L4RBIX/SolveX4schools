/**
 * `#loggedout-wiki-footer.wiki-footer` — the archive notice.
 *
 *   .wiki-footer          position: fixed; bottom 0; left 0; width 100%;
 *                         min-height 48px; padding 18px 24px; background #333;
 *                         z-index 1
 *   .content              flex; centred; colour #fff
 *   .cta-text-wrap        16px, centred, max-width 700px
 *   .cta-link             #29cc57 with a 2px #29cc57 underline, 1px below the
 *                         text; #15b441 on hover
 *
 * The controller (`app/wiki:wikiFooter`) measures `#footer` before attaching a
 * scroll handler that lifts the bar. This document ships no `#footer`, so the
 * handler never binds and the bar stays pinned for the whole page — hence no
 * scroll behaviour here either.
 */
export function ArchiveBar() {
  return (
    <div
      id="loggedout-wiki-footer"
      className="fixed bottom-0 left-0 z-[1] min-h-[48px] w-full bg-[#333] px-6 py-[18px]"
    >
      <a
        href="https://brilliant.org/account/signup/?next=/wiki/logarithms/"
        rel="nofollow"
        className="group flex items-center justify-center p-0 text-b-white"
      >
        <span className="max-w-[700px] text-center text-[16px] text-b-white">
          <strong className="font-semibold">
            You&apos;re viewing an archive of Brilliant&apos;s Wiki, which is no longer
            maintained.
          </strong>{" "}
          For the best place to learn math, programming, data, and more,{" "}
          <span className="border-b-2 border-[#29cc57] pb-px text-[#29cc57] transition-colors group-hover:border-[#15b441] group-hover:text-[#15b441]">
            check out Brilliant&apos;s interactive courses
          </span>
          .
        </span>
      </a>
    </div>
  );
}
