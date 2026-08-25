import { Callout } from "../callout";
import { P, ProblemStatement, Rule } from "../prose";
import { Tex } from "../tex";

/** `#section-worked-examples-using-properties` */
export function WorkedExamples() {
  return (
    <>
      <P>
        <Tex src={String.raw`\[ \]`} /> <Tex src={String.raw`\(1.~\log _{ a }{ a } =1\)`} />
      </P>
      <Callout label="Example">
        <ProblemStatement>
          Find the value of <Tex src={String.raw`\(\log _{ 4 }{ 4 }.\)`} />
        </ProblemStatement>
        <Rule />
        <P>
          Using the property <Tex src={String.raw`\(\log _{ a }{ a }=1,\)`} /> we get{" "}
          <Tex src={String.raw`\(\log_{ 4 }{ 4 } =1. \ _\square\)`} />
        </P>
      </Callout>

      <P>
        <Tex src={String.raw`\[ \]`} />{" "}
        <Tex src={String.raw`\(2.~\log _{ a }{ (b^c) } =c\log _{ a }{ b } \)`} />
      </P>
      <Callout label="Example">
        <ProblemStatement>
          Find the value of <Tex src={String.raw`\(\log _{ 2 }{ 16 }.\)`} />
        </ProblemStatement>
        <Rule />
        <P>We have</P>
        <P>
          <Tex
            src={String.raw`\[\begin{align}
\log _{ 2 }{ 16 } 
&= \log _{ 2 }{ { 2 }^{ 4 } } &&\qquad \big(16={ 2 }^{ 4 }\big)\\
&=4\log _{ 2 }{ 2 } &&\qquad \big(\log { { a }^{ b } } = b\log { a } \big)\\ 
&= 4. \ _\square &&\qquad (\text{by property 1})
\end{align}\]`}
          />
        </P>
      </Callout>

      <P>
        <Tex src={String.raw`\[ \]`} />{" "}
        <Tex
          src={String.raw`\(3.~\log _{ a }{ (b \times c) } = \log _{ a }{ b }+ \log _{ a }{ c } \)`}
        />
      </P>
      <Callout label="Example">
        <ProblemStatement>
          Find the value of <Tex src={String.raw`\(\log { 90 }\)`} /> assuming{" "}
          <Tex src={String.raw`\(\log { 3 } =0.47\)`} />.
        </ProblemStatement>
        <Rule />
        <P>We have</P>
        <P>
          <Tex
            src={String.raw`\[\begin{align}
\log { 90 } 
&= \log { (9\times 10) } &&\qquad (90= 9 \times 10)\\
&=\log { 9 } + \log { 10 } &&\qquad \big(\log _{ a }{ (b\times c) } =\log _{ a }{ b } +\log _{ a }{ c } \big)\\
&=2\log { 3 } +1 &&\qquad \text{(by properties 2 and 1)}\\
&=2\times 0.47+1\\
&=0.94+1\\
&=1.94. \ _\square
\end{align}\]`}
          />
        </P>
      </Callout>

      <P>
        <Tex src={String.raw`\[ \]`} />{" "}
        <Tex
          src={String.raw`\(4.~\displaystyle{\log _{ a }{ \frac { b }{ c } } = \log _{ a }{ b } - \log _{ a }{ c }}\)`}
        />
      </P>
      <Callout label="Example">
        <ProblemStatement>
          Evaluate <Tex src={String.raw`\(\log { 0.27 }\)`} /> assuming{" "}
          <Tex src={String.raw`\(\log { 3 } =0.47\)`} />.
        </ProblemStatement>
        <Rule />
        <P>We have</P>
        <P>
          <Tex
            src={String.raw`\[\begin{align}
\log { 0.27 } 
&= \log { \frac { 27 }{ 100 } } \\
&= \log { 27 } - \log { 100 } \\ 
&=3\log{ 3 } - 2\\ 
&=1.41 - 2\\ 
&=-0.59. \ _\square
\end{align}\]`}
          />
        </P>
      </Callout>

      <P>
        <Tex src={String.raw`\[ \]`} /> <Tex src={String.raw`\(5.\)`} />{" "}
        <Tex
          src={String.raw`\(\displaystyle{\log_{ a }{ b } = \frac { \log_{ c }{ b } }{ \log_{ c }{ a } }} \)`}
        />
      </P>
      <Callout label="Example">
        <ProblemStatement>
          Find the value of <Tex src={String.raw`\(\log_{ 32 }{ 2 }\)`} />.
        </ProblemStatement>
        <Rule />
        <P>We have</P>
        <P>
          <Tex
            src={String.raw`\[\begin{align}
\log_{ 32 }{ 2 }
&=\frac { \log_{ 2 }{ 2 } }{ \log_{ 2 }{ 32 } } \\ 
&=\frac { 1 }{ 5\log_{ 2 }{ 2 } } \\
&=\frac { 1 }{ 5 }\\
&={ 0.2 }. \ _\square
\end{align} \]`}
          />
        </P>
      </Callout>
    </>
  );
}
