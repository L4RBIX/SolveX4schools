import { WikiLink } from "./prose";
import { Tex } from "./tex";

/**
 * `div.table-wrapper > table.table` in "Properties of Logarithms - Basic".
 *
 *   .table-wrapper   overflow-x: auto; margin-bottom: 1.6em
 *                    (8px webkit scrollbar, #f0f0f0 track, #d8d8d8 thumb, r4)
 *   table.table      width: auto; border: 1px solid #262626; border-collapse
 *   .table-wrapper .table td   border: 1px solid #333
 *   .table th/.table td        padding 8px; text-align left; vertical-align top;
 *                              line-height 1.6em
 *
 * The first row is `<td>` cells on the original, not `<th>` — it is therefore
 * not bold, and that is reproduced.
 */

const CELL = "border border-[#333] p-2 text-left align-top leading-[1.6em]";

export function PropertiesTable() {
  return (
    <div className="mb-[1.6em] overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-[4px] [&::-webkit-scrollbar-thumb]:bg-[#d8d8d8] [&::-webkit-scrollbar-track]:rounded-[4px] [&::-webkit-scrollbar-track]:bg-[#f0f0f0] [&::-webkit-scrollbar]:h-2">
      <table className="mb-0 w-auto border-collapse border border-[#262626]">
        <tbody>
          <tr>
            <td className={CELL}>In Math</td>
            <td className={CELL}>In English</td>
            <td className={CELL}>Example</td>
          </tr>
          <tr>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_a b + \log_a c = \log_a bc\)`} />
            </td>
            <td className={CELL}>
              When you add logs with the same base, you can merge into one log and multiply
              their arguments.
            </td>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_2 5 + \log_2 6 = \log_2 30\)`} />
            </td>
          </tr>
          <tr>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_a{b}-\log_a{c} = \log_a \frac{b}{c}\)`} />
            </td>
            <td className={CELL}>The opposite of the above.</td>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_2{18}-\log_2{6} = \log_2{3}\)`} />
            </td>
          </tr>
          <tr>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_a b^c = c \cdot \log_a b\)`} />
            </td>
            <td className={CELL}>
              When your result has an exponent, you can move it to the front of the log.
            </td>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_3{\big(5^{-4}\big)} = -4 \cdot \log_3{5}\)`} />
            </td>
          </tr>
          <tr>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_{a^b}{c}=\frac{1}{b}\log_{a}{c}\)`} />
            </td>
            <td className={CELL}>
              When the base has an exponent, you can move its reciprocal to the front of the
              log.
            </td>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_{\pi^2}{e}=\frac{1}{2}\log_{\pi}{e}\)`} />
            </td>
          </tr>
          <tr>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_a b = \frac{\log_c b}{\log_c a}\)`} />
            </td>
            <td className={CELL}>
              This is the{" "}
              <WikiLink href="/wiki/change-of-base-formula/" title="change of base formula">
                change of base formula
              </WikiLink>
              . You can rearrange any log by making a fraction, with the log of the argument in
              the numerator and the log of the base in the denominator. Any base can be chosen
              for the logs, but the bases <em className="italic">must</em> be the same for both
              logs.
            </td>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_2 \pi = \frac{\log \pi}{\log 2}\)`} />
            </td>
          </tr>
          <tr>
            <td className={CELL}>
              <Tex src={String.raw`\(log_a b=\frac{1}{\log_b a}\)`} />
            </td>
            <td className={CELL}>
              If you want to switch the base of the log <Tex src={String.raw`\(a\)`} /> with the
              argument <Tex src={String.raw`\(b,\)`} /> then you take the reciprocal.
            </td>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_4 e=\frac{\log_e e}{\log_e 4}=\frac{1}{\log_e 4}\)`} />
            </td>
          </tr>
          <tr>
            <td className={CELL}>
              <Tex src={String.raw`\({ a }^{ \log _{ a }{ b } } = b\)`} />
            </td>
            <td className={CELL}>
              When a constant <Tex src={String.raw`\(a\)`} /> is raised to the power{" "}
              <Tex src={String.raw`\(\log _{ a }{ b },\)`} /> the resultant expression is{" "}
              <Tex src={String.raw`\(b.\)`} />
            </td>
            <td className={CELL}>
              <Tex src={String.raw`\({ e }^{ \log _{ e }{ 3 } }=3\)`} />
            </td>
          </tr>
          <tr>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_{a}{1}=0\)`} />
            </td>
            <td className={CELL}>
              Any log which has 1 as its argument will be equal to 0.
            </td>
            <td className={CELL}>
              <Tex src={String.raw`\(\log_{\pi \cdot e}{1}=0\)`} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
