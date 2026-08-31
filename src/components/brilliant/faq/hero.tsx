import { Button3D } from "./button-3d";

/**
 * Section 1. Full-bleed white band, centred text, no max-width container —
 * only the paragraph is constrained (906px). The CTA is 288px wide with a
 * full-width face and carries the animated shimmer.
 */
export function Hero() {
  return (
    <section
      data-slot="vstack"
      className="flex w-full flex-col items-center bg-b-white px-5 pt-12 pb-12 text-center min-[769px]:pt-20"
    >
      <h1 className="mb-6 font-b-serif text-[36px] leading-[1.1] font-medium tracking-[-0.36px] text-b-ink min-[769px]:text-[50px] min-[769px]:tracking-[-0.5px]">
        What is Brilliant?
      </h1>

      <p className="mb-10 max-w-[906px] text-[16px] leading-[1.5] text-[rgba(0,0,0,0.6)]">
        Brilliant is a learning app for iOS, Android, and web that teaches STEM
        interactively. Whether you&rsquo;re a student, professional, or curious
        lifelong learner, Brilliant&rsquo;s lessons and personalized, hands-on
        problem solving approach help you build real understanding.
      </p>

      <Button3D
        href="/welcome/"
        role="button"
        label="Get started"
        shimmer
        className="w-[288px]"
      />
    </section>
  );
}
