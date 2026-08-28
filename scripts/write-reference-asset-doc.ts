/**
 * Generate `docs/REFERENCE_ASSET_REPLACEMENT.md` from the registry.
 *
 * Written rather than hand-maintained so the document and the code cannot
 * disagree about how many temporary assets are left — a hand-written list is
 * out of date the first time somebody adds an image.
 *
 *   npx tsx scripts/write-reference-asset-doc.ts
 */
import { writeFileSync } from "node:fs";
import { REFERENCE_ASSETS } from "../schools/assets/registry";

const PRIORITY_ORDER = [
  "before-public-launch",
  "before-final-public-release",
  "development-only",
] as const;

const PRIORITY_TITLE: Record<string, string> = {
  "before-public-launch": "Blocking a public launch — these render on marketing surfaces",
  "before-final-public-release": "Blocking a paid release — these render inside the product",
  "development-only": "Not blocking — these never reach a production route",
};

const lines: string[] = [
  "# Temporary reference assets",
  "",
  "**Generated from `schools/assets/registry.ts`. Do not edit by hand —",
  "run `npx tsx scripts/write-reference-asset-doc.ts`.**",
  "",
  `Total registered: **${REFERENCE_ASSETS.length}**`,
  "",
  "Every file below was downloaded from brilliant.org's CDN during the",
  "reverse-engineering phase and is still referenced by this repository.",
  "Downloading a competitor's assets to *measure* a design is legitimate;",
  "serving them from a product a school pays for is redistribution. This phase",
  "was scoped to finish the product's structure and defer the artwork swap, so",
  "the swap is made cheap rather than pretended away: one module owns every",
  "path, no component holds a raw asset URL, and each entry records what the",
  "slot is *for* so replacement art can be commissioned against a brief.",
  "",
  "## Already resolved — do not re-open",
  "",
  "- **CoFo Brilliant / CoFo Robert** (Contrast Foundry, commercial) are declared",
  "  only in `src/app/brilliant/layout.tsx`, which `notFound()`s in production,",
  "  with the files under `reference/fonts/` rather than `public/`. A production",
  "  build emits neither the `@font-face` rule nor the file.",
  "- **`@bible-strong/avatar-react`** is AGPL-3.0-only. The package is neither",
  "  installed nor imported; Strobi is rendered from the JSON definition by our",
  "  own code in `src/components/nova/strobi-avatar.tsx`.",
  "",
];

for (const priority of PRIORITY_ORDER) {
  const group = REFERENCE_ASSETS.filter((a) => a.replacementPriority === priority);
  if (group.length === 0) continue;

  lines.push(`## ${PRIORITY_TITLE[priority]} (${group.length})`, "");
  lines.push("| id | routes | what the slot depicts | file |");
  lines.push("| --- | --- | --- | --- |");
  for (const a of group) {
    lines.push(
      `| \`${a.id}\` | ${a.routes.map((r) => `\`${r}\``).join(", ")} | ${a.intent} | \`${a.assetPath}\` |`,
    );
  }
  lines.push("");
}

lines.push(
  "## How to replace one",
  "",
  "1. Put the new file under `public/` in a SolveX-owned directory.",
  "2. Change its `assetPath` in `schools/assets/registry.ts`.",
  "3. Drop `temporaryReferenceAsset` and `replacementNeeded` from that entry, or",
  "   remove the entry entirely if nothing else points at it.",
  "4. Re-run this script.",
  "",
  "No component changes. That is the whole point of the registry.",
  "",
);

writeFileSync("docs/REFERENCE_ASSET_REPLACEMENT.md", lines.join("\n"));
console.log(
  `wrote docs/REFERENCE_ASSET_REPLACEMENT.md — ${REFERENCE_ASSETS.length} assets`,
);
