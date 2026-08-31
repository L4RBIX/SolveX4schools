/**
 * `next/font/local` and `next/font/google` outside the Next build.
 *
 * The real modules are compiled away by the Next loader — imported directly they
 * are not callable, so any module that declares a font (the reverse-engineering
 * baseline's layout, for one) cannot be imported by a test at all.
 *
 * The stub returns the shape the callers use: a CSS variable name and a class.
 * Nothing under test asserts on font output; what the tests need is to be able
 * to load the module that declares one.
 */
export default function font(options: { variable?: string } = {}) {
  return {
    className: "stub-font",
    variable: options.variable ?? "--stub-font",
    style: { fontFamily: "stub" },
  };
}

export const IBM_Plex_Sans = font;
export const JetBrains_Mono = font;
