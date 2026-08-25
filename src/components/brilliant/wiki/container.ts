/**
 * brilliant.org `.container` (brilliant_desktop.css):
 *   width: 1200px; margin: 0 auto; padding: 0 12px;
 *
 * and inside the page's only layout breakpoint
 * `screen and (min-width: 700px) and (max-width: 1200px)`:
 *   width: 960px; padding: 0 8px;
 *
 * Written as an arbitrary media variant because Tailwind's `max-*` variants
 * are exclusive (`width < n`) while the original query is inclusive.
 */
export const WIKI_CONTAINER =
  "mx-auto w-[1200px] px-3 [@media(min-width:700px)_and_(max-width:1200px)]:w-[960px] [@media(min-width:700px)_and_(max-width:1200px)]:px-2";

/** `body { min-width: 1200px }`, 960px inside the same breakpoint. */
export const WIKI_MIN_WIDTH =
  "min-w-[1200px] [@media(min-width:700px)_and_(max-width:1200px)]:min-w-[960px]";
