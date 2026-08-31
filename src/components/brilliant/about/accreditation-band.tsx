import { ABOUT_IMG } from "./assets";
import { AboutContainer } from "./container";

/**
 * Accreditation band. One hairline divider between the two halves: it is a
 * bottom rule while the halves stack, and becomes a right rule from 769px.
 *
 * Both logos keep the 232px cap at every width. Panda emits `max-width: auto`
 * for the lg step, which is not a valid max-width value, so browsers drop the
 * declaration and the 232px base survives. Reproduced as rendered, not as
 * declared — same call as the invalid `font-weight: medium` elsewhere.
 */
export function AccreditationBand() {
  return (
    <div
      data-slot="box"
      className="bg-[#f8f8f8] px-6 py-[72px] min-[769px]:px-8 min-[769px]:py-[108px]"
    >
      <AboutContainer>
        <div
          data-slot="flex"
          className="flex flex-col gap-0 min-[769px]:flex-row"
        >
          <div
            data-slot="box"
            className="flex items-center justify-center border-solid border-b-line border-r-0 border-b pr-0 pb-8 min-[769px]:border-r min-[769px]:border-b-0 min-[769px]:pr-8 min-[769px]:pb-0"
          >
            <img
              data-slot="img"
              src={`${ABOUT_IMG}/math-counts.png`}
              alt="Math Counts Foundation Partner"
              className="mx-auto max-w-[232px]"
            />
          </div>

          <div
            data-slot="flex"
            className="flex flex-col items-center gap-5 pt-8 pl-0 min-[769px]:flex-row min-[769px]:pt-0 min-[769px]:pl-8"
          >
            <img
              data-slot="img"
              src={`${ABOUT_IMG}/wasc-logo.png`}
              alt="WASC Accredited"
              className="mx-auto max-w-[232px]"
            />
            <div
              data-slot="vstack"
              className="flex flex-col items-center min-[769px]:items-start"
            >
              <p
                data-slot="p"
                className="text-center text-[16px] leading-[1.5] text-b-ink min-[769px]:text-left"
              >
                <strong>Brilliant is fully accredited</strong> by the
                Accrediting Commission for Schools, Western Association of
                Schools and Colleges.
              </p>
            </div>
          </div>
        </div>
      </AboutContainer>
    </div>
  );
}
