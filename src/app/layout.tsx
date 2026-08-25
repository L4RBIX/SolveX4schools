import type { Metadata } from "next";
import localFont from "next/font/local";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";

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
 * The references' own self-hosted webfonts, extracted from their /_next/static
 * media directories. These are the real families, not stand-ins:
 *   brilliant.org -> CoFo Brilliant (UI/body) + CoFo Robert (display) + Source Code Pro
 *
 * RELEASE BLOCKER: CoFo Brilliant and CoFo Robert are commercially licensed by
 * Contrast Foundry. They are here for the local reverse-engineering study under
 * /brilliant and MUST NOT be deployed or redistributed. Nothing under the
 * SolveX4Schools product surface loads them — it uses IBM Plex Sans and
 * JetBrains Mono above, both SIL OFL. Before any public deploy, either drop the
 * /brilliant routes or drop these three localFont declarations.
 * Source Code Pro is open-licence (SIL OFL) and is fine either way.
 */

const cofoBrilliant = localFont({
  variable: "--font-cofo-brilliant",
  display: "swap",
  src: [
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/cofo_brilliant_regular-s.p.0x-1wd4a7iit8.woff2", weight: "400", style: "normal" },
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/cofo_brilliant_italic-s.p.01uthtfhv3qu6.woff2", weight: "400", style: "italic" },
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/cofo_brilliant_medium-s.p.1vop2d5y_jpw2.woff2", weight: "500", style: "normal" },
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/cofo_brilliant_medium_italic-s.p.30ni91w93hr35.woff2", weight: "500", style: "italic" },
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/cofo_brilliant_bold-s.p.00peqb48xfqwb.woff2", weight: "700", style: "normal" },
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/cofo_brilliant_bold_italic-s.p.3orrcir-ph8bn.woff2", weight: "700", style: "italic" },
  ],
});

const cofoRobert = localFont({
  variable: "--font-cofo-robert",
  display: "swap",
  src: [
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/cofo_robert_medium-s.p.3krozkcg6qt-u.woff2", weight: "500", style: "normal" },
    { path: "../../public/assets/original/brilliant/brilliant.org/_next/static/media/cofo_robert_medium_italic-s.p.2b_znar3654ya.woff2", weight: "500", style: "italic" },
  ],
});

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
    <html
      lang="kk"
      className={`${plexSans.variable} ${jetbrainsMono.variable} ${cofoBrilliant.variable} ${cofoRobert.variable} ${sourceCodePro.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
