import raw from "./b-legal.content.json";

import type { LegalContent } from "./legal-types";

/**
 * The extracted article. Imported, never retyped — see
 * `docs/research/specs/b-legal.spec.md` §15.
 */
export const legalContent = raw as unknown as LegalContent;
