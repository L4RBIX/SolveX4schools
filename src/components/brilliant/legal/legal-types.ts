/**
 * Shapes for `b-legal.content.json` — the verbatim extraction of
 * brilliant.org/terms-of-use/. The JSON is the single source of truth for every
 * string on this page; nothing here re-types or paraphrases it.
 */

export type LegalRunKind = "text" | "br";

/** One inline run inside a block. `br` runs carry no text. */
export interface LegalRun {
  t: LegalRunKind;
  text?: string;
  strong?: boolean;
  em?: boolean;
  underline?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

export type LegalBlockTag = "h1" | "h3" | "h4" | "p" | "ol";

export interface LegalBlock {
  tag: LegalBlockTag;
  /** The original panda class string, kept for traceability only. */
  class: string;
  id?: string;
  runs?: LegalRun[];
  /** Only on `ol` blocks: one run array per `<li>`. */
  items?: LegalRun[][];
}

export type LegalTextStyle = "body.base" | "body.sm";

export interface LegalTocEntry {
  href: string;
  label: string;
  style: LegalTextStyle;
  children?: LegalTocEntry[];
}

/** `[label, href]` exactly as extracted. */
export type LegalFooterLink = [label: string, href: string];

/** `[label, href]` where a null href marks the real `<button>` in the legal row. */
export type LegalLegalRowItem = [label: string, href: string | null];

export interface LegalFooterGroup {
  label: string;
  links: LegalFooterLink[];
}

export interface LegalFooterContent {
  groups: LegalFooterGroup[];
  social: LegalFooterLink[];
  legalRow: LegalLegalRowItem[];
  copyright: string;
}

export interface LegalContent {
  source: string;
  fetchedUtc: string;
  httpStatus: number;
  note: string;
  h1: string;
  blocks: LegalBlock[];
  toc: LegalTocEntry[];
  tocHeading: string;
  footer: LegalFooterContent;
}
