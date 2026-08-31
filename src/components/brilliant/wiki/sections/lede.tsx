import { Callout } from "../callout";
import { P, WikiLink } from "../prose";
import { Tex } from "../tex";

/**
 * `div#section-pre-header-section.section.collapsed` — the only section
 * without a heading, and the only one without `clear: both`.
 */
export function Lede() {
  return (
    <div id="section-pre-header-section" className="mb-10">
      <div>
        <P>
          A <strong className="font-semibold">logarithm</strong> is the{" "}
          <WikiLink href="/wiki/functions-inverses/" title="inverse">
            inverse
          </WikiLink>{" "}
          of the{" "}
          <WikiLink href="/wiki/exponential-functions/" title="exponential function">
            exponential function
          </WikiLink>
          . Specifically, a logarithm is the power to which a number (the base) must be raised
          to produce a given number.
        </P>
        <P>
          For example, <Tex src={String.raw`\(\log_2 64 = 6,\)`} /> because{" "}
          <Tex src={String.raw`\( 2^6 = 64.\)`} /> In general, we have the following definition:
        </P>
        <Callout label="Definition">
          <P>
            <Tex src={String.raw`\( z \)`} /> is the{" "}
            <strong className="font-semibold">
              base-
              <Tex src={String.raw`\(x\)`} /> logarithm of <Tex src={String.raw`\(y\)`} />
            </strong>{" "}
            if and only if <Tex src={String.raw`\( x^z = y \)`} />. In typical notation
          </P>
          <P>
            <Tex src={String.raw`\[ \log_x y = z \iff x^z = y.\]`} />
          </P>
        </Callout>
      </div>
    </div>
  );
}
