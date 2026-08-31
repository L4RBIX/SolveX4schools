import { Callout } from "../callout";
import { P, Rule } from "../prose";
import { Tex } from "../tex";

/** `#section-logarithmic-functions-problem-solving-hard` */
export function ProblemSolvingAdvanced() {
  return (
    <Callout label="Example">
      <P>What are the solutions of the equation</P>
      <P>
        <Tex
          src={String.raw`\[ \log_{x} xy \times \log_{y} xy + \log_{x}(x-y) \times \log_{y} (x-y) = 0?\]`}
        />
      </P>
      <Rule />
      <P>We have</P>
      <P>
        <Tex
          src={String.raw`\[ \begin{align}
\log_{x} xy \times \log_{y} xy + \log_{x}(x-y) \times \log_{y} (x-y) &= 0 \\
\frac{\log xy}{\log x} \times \frac{\log xy}{\log y} + \frac{\log(x-y)}{\log x} \times \frac{\log(x-y)}{\log y} &= 0 \\
\frac{(\log xy)^2 + (\log(x-y))^2}{\log x \cdot \log y} &= 0 \\
(\log xy)^2 + (\log(x-y))^2 &= 0 \\
\Rightarrow \log xy &= 0 \text{ and } \log(x-y)= 0. \\
\end{align} \]`}
        />
      </P>
      <P>
        Since <Tex src={String.raw`\(x\)`} /> and <Tex src={String.raw`\(y\)`} /> are both
        positive, this implies that
      </P>
      <P>
        <Tex
          src={String.raw`\[ \begin{align}
xy &= 1 \text{ and } x-y=1 \\
\Rightarrow x&= \frac{\sqrt{5} +1}{2}, y=\frac{\sqrt{5}-1}{2}. \ _\square
\end{align} \]`}
        />
      </P>
    </Callout>
  );
}
