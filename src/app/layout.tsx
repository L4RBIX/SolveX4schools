import type { Metadata } from "next";
import localFont from "next/font/local";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";

import {
  PREFERENCES_BOOT_SCRIPT,
  PreferencesProvider,
} from "@/components/sx/preferences";

import "./globals.css";
import "./solvex.css";

/**
 * SolveX4Schools' own type.
 *
 * IBM Plex Sans and JetBrains Mono are both SIL OFL and both ship Cyrillic,
 * which is not optional here: the interface is Kazakh and Russian, and Kazakh
 * needs Ә Ғ Қ Ң Ө Ұ Ү Һ І beyond the Russian set. The `cyrillic-ext` subset is
 * requested explicitly — `cyrillic` alone omits several of them.
 *
 * The CoFo faces below are a different matter entirely; see the note there.
 */

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "700"],
  display: "swap",
});

/**
 * Source Code Pro is the reference's code face and is SIL OFL, so it ships.
 *
 * CoFo Brilliant and CoFo Robert are NOT here. They are commercially licensed
 * by Contrast Foundry, and they used to be declared in this file — which put
 * their `@font-face` rules and their `--font-cofo-*` variables into the CSS of
 * every production page, with `--font-b-sans` (the family the entire product
 * renders in) pointing straight at them. That is not a note to act on later; it
 * is redistribution on every request.
 *
 * They now live in `src/app/brilliant/layout.tsx`, the reverse-engineering
 * baseline, which `notFound()`s in production. `--font-b-sans` in globals.css
 * falls back to IBM Plex Sans wherever `--font-cofo-brilliant` is undefined —
 * which, outside that layout, is everywhere.
 */

const sourceCodePro = localFont({
  variable: "--font-source-code-pro",
  display: "swap",
  src: [
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/source_code_pro_regular.p.1nc1izk0q8l8t.woff2", weight: "400", style: "normal" },
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/source_code_pro_italic.p.2uutxim5qrm63.woff2", weight: "400", style: "italic" },
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/source_code_pro_medium.p.0k2a2_pd11ndo.woff2", weight: "500", style: "normal" },
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/source_code_pro_mediumitalic.p.15pt67uudl65v.woff2", weight: "500", style: "italic" },
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/source_code_pro_bold.p.05unrvrd219vv.woff2", weight: "700", style: "normal" },
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/source_code_pro_bolditalic.p.447_bjs8ef4vm.woff2", weight: "700", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: {
    default: "SolveX4Schools",
    template: "%s · SolveX4Schools",
  },
  description:
    "Спорттық бағдарламалау үйірмесі — 9-сыныпқа арналған тоғыз айлық оқу бағдарламасы.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /*
      `lang`, `data-theme` and `data-motion` are all stamped before first paint
      by the boot script below and kept in step afterwards by
      `PreferencesProvider`. The attributes here are the no-JavaScript answer:
      Kazakh because the programme is Kazakh-first, and no theme stamp at all so
      the CSS falls through to `prefers-color-scheme`.

      `suppressHydrationWarning` is required and is narrow: the boot script
      mutates exactly these attributes on this element between the server render
      and hydration, which is the one case React cannot know about and the one
      case the warning is not useful for.
    */
    <html
      suppressHydrationWarning
      lang="kk"
      className={`${plexSans.variable} ${jetbrainsMono.variable} ${sourceCodePro.variable}`}
    >
      <head>
        {/*
          Synchronous, inline, and first. A theme applied from an effect paints
          one frame of the wrong palette — on a projector in a classroom that is
          a white flash, and it is the single most obvious "unfinished" tell a
          product can have.
        */}
        <script
          dangerouslySetInnerHTML={{ __html: PREFERENCES_BOOT_SCRIPT }}
        />
      </head>
      <body>
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
