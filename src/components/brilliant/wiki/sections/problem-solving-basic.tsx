import { Callout } from "../callout";
import { P, ProblemStatement, Rule } from "../prose";
import { Tex } from "../tex";

/** `#section-logarithmic-functions-problem-solving-easy` */
export function ProblemSolvingBasic() {
  return (
    <>
      <Callout label="Example">
        <ProblemStatement>What is(are) the solution(s) of the quadratic equation</ProblemStatement>
        <P>
          <Tex src={String.raw`\[\log 2x + \log(x-1) = \log\big(x^2+3\big) ?\]`} />
        </P>
        <Rule />
        <P>We have</P>
        <P>
          <Tex
            src={String.raw`\[ \begin{align}
\log 2x + \log(x-1) &= \log(x^2+3) \\
\log 2x(x-1) &= \log (x^2+3) \\
\Rightarrow 2x(x-1) &= x^2 +3 \\
 x^2-2x-3 &= 0 \\
(x+1)(x-3) &= 0 \\
x &= -1, 3.
\end{align} \]`}
          />
        </P>
        <P>
          Since the logarithm functions <Tex src={String.raw`\( \log(x-1)\)`} /> and{" "}
          <Tex src={String.raw`\( \log 2x\)`} /> are defined over positive numbers, it must be
          true that <Tex src={String.raw`\(x-1>0 \implies x>1\)`} /> and{" "}
          <Tex src={String.raw`\(2x>0 \implies x>0.\)`} /> Thus, <Tex src={String.raw`\(-1\)`} />{" "}
          is can not be the value of <Tex src={String.raw`\(x,\)`} /> implying that the value of{" "}
          <Tex src={String.raw`\(x\)`} /> satisfying the given equation is{" "}
          <Tex src={String.raw`\(x=3.\)`} /> <Tex src={String.raw`\(_\square\)`} />
        </P>
      </Callout>

      <Callout label="Example">
        <ProblemStatement>What is the solution(s) of the quadratic equation</ProblemStatement>
        <P>
          <Tex src={String.raw`\[ 2(\log x)^2 = 7\log x - 3 ?\]`} />
        </P>
        <Rule />
        <P>We have</P>
        <P>
          <Tex
            src={String.raw`\[\begin{align}
2(\log x)^2 &= 7\log x - 3 \\
2(\log x)^2 - 7\log x +3 &= 0 \\
(\log x -3)(2\log x -1) &= 0 \\
\Rightarrow \log x &= 3, \frac{1}{2} \\
x &= 1000, \sqrt{10}. \ _\square
\end{align} \]`}
          />
        </P>
      </Callout>
    </>
  );
}
