import { P } from "../prose";
import { Tex } from "../tex";

/** `#section-applications` */
export function Applications() {
  return (
    <>
      <P>
        <Tex src={String.raw`\[ \]`} />{" "}
        <strong className="font-semibold">Richter Scale:</strong>
      </P>
      <P>
        Richter scale was developed by Charles Richter in 1935 to compare the intensities of
        earthquakes. The amount of energy released in an earthquake is very large, so a
        logarithmic scale avoids the use of large numbers.
      </P>
      <P>The formula used for these calculations is</P>
      <P>
        <Tex src={String.raw`\[M= \log_{10}\left(\frac{I}{I_0}\right),\]`} />
      </P>
      <P>
        where <Tex src={String.raw`\(M\)`} /> is the magnitude on the Richter scale,{" "}
        <Tex src={String.raw`\(I\)`} /> is the intensity of the earthquake being measured, and{" "}
        <Tex src={String.raw`\(I_0\)`} /> is the intensity of a reference earthquake.
      </P>
      <P>Let&apos;s do a quick example to clarify how this works.</P>
      <P>
        The 1906 San Francisco earthquake had a magnitude of 8.3 on the Richter scale. At the
        same time in South America there was an eathquake with magnitude 4.1 that caused only
        minor damage. How many times more intense was the San Francisco earthquake than the
        South American one?
      </P>
      <P>
        Because the magnitude is a base-10 log, the Richter number is actually the exponent that
        10 is raised to in order to calculate the intensity of the earthquake. Thus, the
        difference in magnitudes of the earthquakes can be calculated as follows:
      </P>
      <P>
        <Tex
          src={String.raw`\[M=\log_{10}\left(\frac{10^{8.3}}{10^{4.1}}\right)=4.2.\]`}
        />
      </P>
      <P>
        So, to answer the question, the San Francisco earthquake is more intense than the South
        American one by about <Tex src={String.raw`\(10^M \approx 15848.93192\)`} /> times!
      </P>
      <P>
        Note that you can just subtract 4.1 from 8.3 and get the same result. But if your math
        teachers are like mine, they will want you to use logarithms, and this is how it is done.
        The reason that subtracting the magnitudes works is because of the exponent rule for
        dividing exponents with the same base.
      </P>

      <P>
        <Tex src={String.raw`\[ \]`} />{" "}
        <strong className="font-semibold">Decibel Scale:</strong>
      </P>
      <P>
        One decibel is one tenth of one bel, named in honor of Alexander Graham Bell. The bel is
        rarely used without the deci- prefix, deci- meaning one tenth. The decibel scale is used
        to calculate the difference in intensity between two sounds:
      </P>
      <P>
        <Tex src={String.raw`\[L=10\log_{10}\left(\frac{I}{I_0}\right),\]`} />
      </P>
      <P>
        where <Tex src={String.raw`\( L\)`} /> is the loudness of the sound measured in decibels,{" "}
        <Tex src={String.raw`\(I\)`} /> is the intensity of the sound being measured, and{" "}
        <Tex src={String.raw`\(I_0\)`} /> is the intensity of the sound at the threshold of
        hearing which is equal to zero decibels.
      </P>

      <P>
        <Tex src={String.raw`\[ \]`} />{" "}
        <strong className="font-semibold">
          <Tex src={String.raw`\(\text{pH}\)`} /> Scale:
        </strong>
      </P>
      <P>
        The <Tex src={String.raw`\(\text{pH}\)`} /> scale was invented in 1910 by Dr. Soren
        Sorenson, Head of Laboratory at Carlsberg Beer Company. The &quot;H&quot; in{" "}
        <Tex src={String.raw`\(\text{pH}\)`} /> stands for hydrogen and the meaning of the
        &quot;p&quot; in <Tex src={String.raw`\(\text{pH}\)`} />, although disputed, is generally
        considered to mean the power of hydrogen. This scale is used to measure the acidity or
        alkalinity of water or water soluble substances including, but definitely not limited to,
        soil or rainwater. The <Tex src={String.raw`\(\text{pH}\)`} /> scale ranges from 1 to 14,
        where seven is a neutral point. Values below 7 indicate acidity with 1 being the most
        acidic. Values above 7 indicate alkalinity with14 being the most alkaline:
      </P>
      <P>
        <Tex src={String.raw`\[\text{pH}=-\log_{10}\ce{[H+]},\]`} />
      </P>
      <P>
        where <Tex src={String.raw`\(\text{pH}\)`} /> is the{" "}
        <Tex src={String.raw`\(\text{pH}\)`} /> number between <Tex src={String.raw`\(1\)`} />{" "}
        and <Tex src={String.raw`\(14\)`} /> and <Tex src={String.raw`\(\ce{[H+]}\)`} /> is the
        concentration of hydrogen ions.
      </P>
    </>
  );
}
