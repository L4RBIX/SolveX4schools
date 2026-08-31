import { Button3D } from "./button-3d";

/**
 * Section 3 — the `Upsell` band. `blue.950 #080f28` under the site's own
 * `upsell-bg.svg` line art at `background-size: cover; background-position:
 * center`. Static: nothing here animates, and this CTA carries no shimmer.
 *
 * The band declares two gaps (48px outer, 72px inner) but the SSR capture did
 * not record which children sit in which stack; the grouping below is an
 * inference and is flagged in the page notes.
 */

const BG =
  "bg-[url('/assets/original/brilliant/brilliant.org/images/homepage/upsell-bg.svg')]";

const BADGES = [
  {
    alt: "Get it on Google Play",
    src: "/assets/original/brilliant/brilliant.org/images/app-store-badges/get-it-on-google-play.svg",
    href: "https://play.google.com/store/apps/details?id=org.brilliant.android&listing=try-brilliant-app",
    width: 239,
    height: 71,
  },
  {
    alt: "Download on the App Store",
    src: "/assets/original/brilliant/brilliant.org/images/app-store-badges/download-on-the-app-store.svg",
    href: "https://apps.apple.com/app/apple-store/id913335252?pt=105095803&ct=nux_qr_code&mt=8",
    width: 120,
    height: 40,
  },
] as const;

export function Upsell() {
  return (
    <section
      data-slot="vstack"
      className={`flex min-h-[650px] w-full flex-col items-center justify-center gap-12 bg-[#080f28] ${BG} bg-cover bg-center px-5 py-20 text-white min-[481px]:h-[94vh] min-[481px]:px-8 min-[769px]:px-[112px]`}
    >
      <div
        data-slot="vstack"
        className="flex flex-col items-center gap-[72px] text-center"
      >
        <div>
          <h2 className="mb-6 text-center font-b-serif text-[60px] leading-[1.33] font-medium tracking-[-0.025em] min-[360px]:leading-[1.2] min-[769px]:text-[96px]">
            Start your journey
          </h2>
          <p className="mb-0 text-[16px] font-normal min-[481px]:text-[20px]">
            Join over 10 million people learning interactively.
          </p>
        </div>

        <Button3D
          href="/welcome/"
          role="link"
          label="Get started"
          className="h-16 w-full max-w-[360px] min-w-[280px]"
          faceClassName="h-full px-6 py-4 text-[20px] leading-[1.25]"
        />
      </div>

      <div className="flex flex-row items-center justify-center gap-[14px] min-[769px]:gap-[22px]">
        {BADGES.map((badge) => (
          <a
            key={badge.alt}
            href={badge.href}
            className="inline-flex rounded-xl outline-transparent focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#456dff]"
          >
            {/* Vendor badge artwork, served as SVG straight from the mirror. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badge.src}
              alt={badge.alt}
              width={badge.width}
              height={badge.height}
              className="block h-11 w-auto min-[769px]:h-12"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
