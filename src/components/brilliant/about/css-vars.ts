import type { CSSProperties } from "react";

/**
 * Brilliant drives several of this page's pseudo-elements from custom
 * properties set on the host element. This alias lets us set them in a `style`
 * object without loosening `strict` anywhere else.
 */
export type StyleWithVars = CSSProperties & Record<`--${string}`, string>;
