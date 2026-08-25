import { Callout } from "../callout";
import { P, ProblemStatement, Rule } from "../prose";
import { Tex } from "../tex";
import { TryItYourself } from "../try-it-yourself";

/** `#section-logarithmic-functions-problem-solving-medium` */
export function ProblemSolvingIntermediate() {
  return (
    <>
      <Callout label="Example">
        <ProblemStatement>
          If the solutions of the quadratic equation{" "}
          <Tex src={String.raw`\( x^{\log_3 x\,-\,2} = 27 \)`} /> are{" "}
          <Tex src={String.raw`\(a\)`} /> and <Tex src={String.raw`\(b,\)`} /> what is{" "}
          <Tex src={String.raw`\( \log_{a} b + \log_{b} a?\)`} />
        </ProblemStatement>
        <Rule />
        <P>Taking logs with base 3 on both sides, we have</P>
        <P>
          <Tex
            src={String.raw`\[ \begin{align}
x^{\log_{3} x\,-\,2} &= 27 \\
\Rightarrow (\log_{3} x -2)\log_{3} x &= \log_{3} 27 \\
(\log_{3} x)^2-2\log_{3} x - 3 &= 0 \\
(\log_{3} x +1)(\log_{3} x - 3) &= 0 \\
\log_{3} x &= -1, 3.
\end{align} \]`}
          />
        </P>
        <P>
          Since <Tex src={String.raw`\( \log_{a} b + \log_{b} a \)`} /> can be expressed as{" "}
          <Tex
            src={String.raw`\(\frac{\log_{3} b}{\log_{3} a} + \frac{\log_{3} a}{\log_{3} b}\)`}
          />{" "}
          using log with base 3,
        </P>
        <P>
          <Tex
            src={String.raw`\[ \begin{align}
\log_{a} b + \log_{b} a &= \frac{\log_{3} b}{\log_{3} a} + \frac{\log_{3} a}{\log_{3} b} \\
&= \frac{-1}{3} + \frac{3}{-1} \\
&= -\frac{10}{3}. \ _\square
\end{align} \]`}
          />
        </P>
      </Callout>

      <Callout label="Example">
        <P>
          If the solutions of the equation{" "}
          <Tex src={String.raw`\(\log_{2} x + a\log_{x} 8 = b \)`} /> are{" "}
          <Tex src={String.raw`\(2\)`} /> and <Tex src={String.raw`\(\frac{1}{8},\)`} /> what are{" "}
          <Tex src={String.raw`\(a\)`} /> and <Tex src={String.raw`\(b?\)`} />
        </P>
        <Rule />
        <P>We have</P>
        <P>
          <Tex
            src={String.raw`\[ \begin{align}
\log_{2} x + a\log_{x} 8 &= b \\
\log_{2} x + a\log_{x} 2^3 &= b \\
\log_{2} x + \frac{3a}{\log_{2} x} &= b \\
(\log_{2} x)^2 -b \log_{2} x + 3a &= 0. \qquad (1) \\
\end{align} \]`}
          />
        </P>
        <P>
          Since the solutions of the equation{" "}
          <Tex src={String.raw`\( {(\log_{2} x)}^2 -b \log_{2} x + 3a = 0 \)`} /> are{" "}
          <Tex src={String.raw`\(2\)`} /> and <Tex src={String.raw`\(\frac{1}{8} ,\)`} />{" "}
          substituting <Tex src={String.raw`\(2\)`} /> and{" "}
          <Tex src={String.raw`\(\frac{1}{8}\)`} /> into <Tex src={String.raw`\((1)\)`} /> gives
        </P>
        <P>
          <Tex
            src={String.raw`\[ \begin{align}
(\log_{2} 2)^2 - b \log_{2} 2 + 3a &= 0 \\
\Rightarrow 1-b+3a &= 0, \qquad (2)\\
(\log_{2} \frac{1}{8} )^2 - b \log_{2} \frac{1}{8} + 3a &= 0 \\
\Rightarrow 9+3b+3a &=0. \qquad (3)
\end{align} \]`}
          />
        </P>
        <P>
          Solving the simultaneous equations <Tex src={String.raw`\((2)\)`} /> and{" "}
          <Tex src={String.raw`\((3)\)`} /> gives <Tex src={String.raw`\(a= -1\)`} /> and{" "}
          <Tex src={String.raw`\(b = -2.\)`} /> <Tex src={String.raw`\(_\square\)`} />
        </P>
      </Callout>

      <TryItYourself />
    </>
  );
}
