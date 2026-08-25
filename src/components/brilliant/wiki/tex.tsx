/**
 * Math passthrough.
 *
 * The original ships every formula as raw LaTeX inside `\( … \)` / `\[ … \]`
 * and renders it client-side with KaTeX (+ mhchem for `\ce{[H+]}`), loaded by
 * `util/latex_loader`. This project has no `katex` dependency and adding one
 * would mean editing shared `package.json`, so the LaTeX source is emitted as
 * literal text — exactly the bytes the server sends, which is also exactly
 * what the original page shows before KaTeX resolves.
 *
 * Nothing here is re-typeset, simplified or paraphrased. Swapping in a real
 * renderer later is a one-component change.
 */
export function Tex({ src }: { src: string }) {
  return <>{src}</>;
}
