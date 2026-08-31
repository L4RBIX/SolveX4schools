/**
 * Hero. Two stacked gradients over white, with the artwork painted by a
 * ::before that carries NO background-size — the SVG therefore renders at its
 * intrinsic 2108x561 (1259x529 on mobile), anchored bottom-centre and clipped
 * by the viewport. Adding bg-cover/bg-contain here would be wrong.
 *
 * The negative top margin pulls the copy off the artwork; a max-height query
 * cancels it on short viewports.
 */
export function AboutHero() {
  return (
    <div
      data-slot="vstack"
      className={
        "relative flex w-full flex-col items-center justify-center gap-0 " +
        "min-h-[calc(96.5vh-64px)] min-[769px]:min-h-[calc(95vh-64px)] " +
        "[background:linear-gradient(246deg,transparent_38.81%,#fdf3d3_100%),linear-gradient(144deg,#fff_34.94%,#ecf0ff_57.88%,#ffe1f7_80.83%,#ffc3b8_104.47%),#fff] " +
        "before:absolute before:inset-x-0 before:bottom-0 before:h-full before:content-[''] " +
        "before:bg-no-repeat before:[background-position-x:center] before:[background-position-y:bottom] " +
        "before:[background-image:url('/assets/original/brilliant/brilliant.org/images/about/hero-mobile.svg')] " +
        "min-[769px]:before:[background-image:url('/assets/original/brilliant/brilliant.org/images/about/hero.svg')]"
      }
    >
      <div
        data-slot="vstack"
        className={
          "relative z-[1] flex max-w-[926px] flex-col items-center px-4 text-center " +
          "-mt-[50%] min-[769px]:-mt-40 [@media(max-height:550px)]:mt-0!"
        }
      >
        <p
          data-slot="p"
          className="mb-4 text-[16px] leading-[1.5] font-normal tracking-[3px] text-b-muted uppercase"
        >
          Our Mission
        </p>
        <h1
          data-slot="heading"
          className="font-b-sans text-[36px] leading-[100%] font-bold tracking-[-0.025em] text-b-ink min-[481px]:text-[48px] min-[769px]:text-[72px]"
        >
          Making a world of great problem solvers
        </h1>
      </div>
    </div>
  );
}
