import { ABOUT_IMG } from "./assets";
import { Button3D } from "./button-3d";
import { AboutContainer } from "./container";
import { SectionHeading } from "./section-heading";

/**
 * "Great minds think here" — the only Button3D in the page body: a #383838
 * face over a hard #000 4px edge, 48px tall (14 + 20 + 14).
 */
export function CareersBand() {
  return (
    <section
      data-slot="section"
      className="w-full bg-[#f8f8f8] px-6 py-16 min-[769px]:py-[108px]"
    >
      <AboutContainer>
        <div
          data-slot="flex"
          className="flex flex-col items-center gap-10 min-[769px]:flex-row min-[769px]:gap-16"
        >
          <div data-slot="box" className="w-full min-[769px]:w-1/2">
            <SectionHeading className="mb-6 min-[769px]:mb-8">
              Great minds think here
            </SectionHeading>
            <p
              data-slot="p"
              className="mb-6 text-[16px] leading-[1.5] text-b-ink min-[769px]:mb-8"
            >
              Come work alongside a team of diverse talents – multiple IMO
              medalists, ex-Editor-in-Chief at The Onion, Cannes Lion winner,
              knitwear designer for Marvel, an Amazon top 50 book of the year
              writer, and PhDs and dropouts from MIT, Caltech, Stanford, and
              Harvard to name a few.
            </p>
            <Button3D
              href="/careers/"
              faceClassName="bg-[#383838] text-white shadow-[0_4px_0_0_#000]"
            >
              See Brilliant careers
            </Button3D>
          </div>

          <img
            data-slot="img"
            src={`${ABOUT_IMG}/careers.svg`}
            alt=""
            className="w-full min-[769px]:w-1/2"
          />
        </div>
      </AboutContainer>
    </section>
  );
}
