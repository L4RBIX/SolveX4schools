import type { ReactNode } from "react";

import type { StyleWithVars } from "./css-vars";

/**
 * The hand-drawn scratch that sits behind three fragments of the statement
 * band. The mark is a ::after painted from `--scratch-image`, pushed behind the
 * text with z-index:-1 and centred on the fragment. Its offsets differ per
 * fragment, so they arrive as custom properties.
 */
export interface ScratchSpec {
  image: string;
  top: string;
  transform: string;
  width: string;
  height: string;
}

export function ScratchHighlight({
  spec,
  children,
}: {
  spec: ScratchSpec;
  children: ReactNode;
}) {
  const style: StyleWithVars = {
    "--scratch-image": `url(${spec.image})`,
    "--scratch-top": spec.top,
    "--scratch-transform": spec.transform,
    "--scratch-width": spec.width,
    "--scratch-height": spec.height,
  };

  return (
    <span
      data-slot="span"
      style={style}
      className={
        "relative z-[1] inline-block " +
        "after:absolute after:left-1/2 after:z-[-1] after:content-[''] " +
        "after:top-[var(--scratch-top)] after:h-[var(--scratch-height)] after:w-[var(--scratch-width)] " +
        "after:[transform:var(--scratch-transform)] " +
        "after:[background-image:var(--scratch-image)] after:bg-contain after:bg-center after:bg-no-repeat"
      }
    >
      {children}
    </span>
  );
}
