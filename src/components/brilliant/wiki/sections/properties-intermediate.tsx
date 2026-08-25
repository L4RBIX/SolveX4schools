import { Callout } from "../callout";
import { P, ProblemStatement, Rule } from "../prose";
import { Tex } from "../tex";

/** `#section-logarithmic-functions-properties-medium` */
export function PropertiesIntermediate() {
  return (
    <Callout label="Example">
      <ProblemStatement>
        What is the value of <Tex src={String.raw`\( \log_3 15 + \log_3 81 - \log_3 5 ?\)`} />
      </ProblemStatement>
      <Rule />
      <P>Using the properties of logarithms, we can rewrite the given expression as follows:</P>
      <P>
        <Tex
          src={String.raw`\[ \begin{align}
\log_3 15 + \log_3 81 - \log_3 5 &= \log_3 15 - \log_3 5 + \log_3 3^4 \\
&= \log_3 \frac{15}{5} + \log_3 3^4 \\
&= \log_3 3+ 4 \log_3 3 \\
&= 5. \ _\square
\end{align}\]`}
        />
      </P>
    </Callout>
  );
}
