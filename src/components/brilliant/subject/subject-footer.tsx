import { cn } from "@/lib/utils";

import { FOOTER_COLUMNS, FOOTER_COPYRIGHT, FOOTER_SOCIALS } from "./data";
import { GLYPHS, Glyph } from "./glyphs";

/** Every footer link and legal item shares this transparent-to-blue underline. */
const UNDERLINE = "border-b-2 border-transparent hover:border-[#456dff]";

const LEGAL_TEXT = "text-left text-[12px] leading-[1.5] text-[#999]";

/** Section 12 — the black footer. */
export function SubjectFooter() {
  return (
    <div className="flex w-full justify-center bg-black pt-20">
      <div
        className={cn(
          "mx-6 w-full max-w-full",
          "min-[360px]:max-w-[432px] min-[769px]:mx-10 min-[769px]:max-w-[1216px] min-[1280px]:mx-8",
        )}
      >
        {/* top row */}
        <div
          className={cn(
            "mb-20 flex w-full flex-col items-start justify-between gap-0",
            "min-[769px]:mb-32 min-[1280px]:flex-row",
          )}
        >
          <a
            href="/brilliant"
            className="mb-12 inline-flex w-2/5 text-white min-[1280px]:mb-0 min-[1280px]:w-1/4"
          >
            <Glyph src={GLYPHS.wordmark} className="h-8 w-[135px]" />
          </a>

          <div
            className={cn(
              "grid max-w-full flex-1 grid-cols-1 items-start gap-x-8 gap-y-12",
              "min-[481px]:w-[576px]",
              "min-[769px]:w-full min-[769px]:grid-cols-[repeat(4,140px)]",
              "min-[1280px]:grid-cols-[repeat(5,minmax(0,1fr))] min-[1280px]:gap-y-0",
            )}
          >
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="mb-4 text-[16px] leading-[1.5] text-[#999]">{column.title}</p>
                <div className="flex flex-col gap-3">
                  {column.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className={cn("relative self-start text-white", UNDERLINE)}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex flex-row gap-6">
              {FOOTER_SOCIALS.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  aria-label={social.label}
                  className="inline-flex text-[#999] transition-colors hover:text-[#456dff]"
                >
                  <Glyph src={social.file} width={social.width} height={social.height} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* bottom row */}
        <div
          className={cn(
            "mb-12 flex w-full flex-col justify-between gap-8",
            "min-[992px]:mb-20 min-[1280px]:flex-row",
          )}
        >
          <div className="flex flex-col items-center gap-3 min-[769px]:flex-row min-[769px]:gap-4">
            <div className="flex w-full justify-start min-[769px]:w-auto">
              <a href="/terms-of-use/" className={cn(LEGAL_TEXT, UNDERLINE)}>
                Terms of service
              </a>
            </div>
            <div className="flex w-full justify-start min-[769px]:w-auto">
              <button
                type="button"
                className={cn(LEGAL_TEXT, UNDERLINE, "cursor-pointer bg-transparent")}
              >
                Do not sell my personal information
              </button>
            </div>
            <div className="flex w-full justify-start min-[769px]:w-auto">
              <a href="/ccpa-policy/" className={cn(LEGAL_TEXT, UNDERLINE)}>
                California privacy policy
              </a>
            </div>
            <div className="flex w-full justify-start min-[769px]:w-auto">
              <a
                href="/privacy/"
                className={cn(
                  LEGAL_TEXT,
                  UNDERLINE,
                  "inline-flex items-center gap-1.5 whitespace-nowrap text-white",
                )}
              >
                Privacy policy
                <Glyph src={GLYPHS.externalLink} width={8} height={8} />
              </a>
            </div>
          </div>

          <p className={cn("break-words text-[12px] leading-[1.5] text-[#999]", "min-[1280px]:w-1/2")}>
            {FOOTER_COPYRIGHT}
          </p>
        </div>
      </div>
    </div>
  );
}
