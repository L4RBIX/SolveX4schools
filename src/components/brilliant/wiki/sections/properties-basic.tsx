import { Callout } from "../callout";
import { P, Rule } from "../prose";
import { PropertiesTable } from "../properties-table";
import { Tex } from "../tex";

/** `#section-logarithmic-functions-properties-easy` */
export function PropertiesBasic() {
  return (
    <>
      <P>
        First, we must know the basic structure of a logarithm{" "}
        <Tex src={String.raw`\((\)`} />
        abbreviated <Tex src={String.raw`\(\log\)`} /> for convenience
        <Tex src={String.raw`\().\)`} /> <Tex src={String.raw`\(\log_a{b}=c\)`} /> can be
        rewritten as <Tex src={String.raw`\(a^c=b,\)`} /> where{" "}
        <Tex src={String.raw`\(a\)`} /> is called the{" "}
        <strong className="font-semibold">base</strong>, <Tex src={String.raw`\(c\)`} /> the{" "}
        <strong className="font-semibold">exponent</strong>, and{" "}
        <Tex src={String.raw`\(b\)`} /> the{" "}
        <strong className="font-semibold">argument</strong>. Also,{" "}
        <Tex src={String.raw`\(\log\)`} /> without a base is shorthand for the common{" "}
        <Tex src={String.raw`\(\log\)`} /> of base <Tex src={String.raw`\(10.\)`} /> Now that we
        know this, we can manipulate logs:
      </P>

      <PropertiesTable />

      <P>
        Other properties can be derived from these basic ones, especially when noting that these
        properties are inversable.
      </P>

      <Callout label="Example">
        <P>
          Simplify <Tex src={String.raw`\(\log_2 \left(\dfrac{32}{9}\right)^2\)`} /> as much as
          possible.
        </P>
        <Rule />
        <P>Try to follow the steps and identify what properties were used:</P>
        <P>
          <Tex
            src={String.raw`\[\begin{align}
\log_2 \left(\dfrac{32}{9}\right)^2
&=2 \cdot \log_2 \left(\frac{32}{9}\right)\\
&=2 \cdot ( \log_2 32 - \log_2 9)\\
&=2 \cdot \left( \log_2 2^5 -\log_2 3^2\right)\\
&=2 \cdot ( 5 \cdot \log_2 2 - 2 \cdot \log_2 3)\\
&=2 \cdot ( 5 \cdot 1 -2 \cdot \log_2 3)\\
&=10- 4 \log_2 3.
\end{align}\]`}
          />
        </P>
        <P>
          Note: <Tex src={String.raw`\(\log_2 3\)`} /> can&apos;t be simplified further. Line 1
          used the second property, line 2 put thingies into exponential form, line 3 used the
          third property, and lines 4 and 5 did basic simplification.{" "}
          <Tex src={String.raw`\(_\square\)`} />
        </P>
      </Callout>

      <Callout label="Example">
        <P>
          Simplify{" "}
          <Tex
            src={String.raw`\[\displaystyle{2\log_4{\sqrt{5}}+\frac{1}{2}\log_2{625}-\log_2{\frac{1}{5}}}.\]`}
          />
        </P>
        <Rule />
        <P>Again, try to follow the steps of the solution:</P>
        <P>
          <Tex
            src={String.raw`\[\begin{align}
2\log_{(2^2)}{\big(5^\frac{1}{2}\big)}+\frac{1}{2}\log_2{\big(5^4\big)}-\log_2{\big(5^{-1}\big)}
&=2\frac{\log 5^{\frac{1}{2}}}{\log 2^2}+\frac{1}{2}(4)(\log_2{5})+\log_2{5}\\
&=2\frac{\frac{1}{2}\log 5}{2\log 2}+2\log_2{5}+\log_2{5}\\
&=\frac{1}{2}\frac{\log 5}{\log 2}+3\log_2{5}\\
&=\frac{1}{2}\log_2{5}+3\log_2{5}\\
&=\frac{7}{2}\log_2{5}.
\end{align}\]`}
          />
        </P>
        <P>
          The first line shows that it is (usually) best to convert numbers so that they are
          integers to a power. Note that lines 4 reverses the process of the fourth property.{" "}
          <Tex src={String.raw`\(_\square\)`} />
        </P>
      </Callout>
    </>
  );
}
