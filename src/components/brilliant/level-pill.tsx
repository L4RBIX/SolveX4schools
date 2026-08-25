import { cn } from "@/lib/utils";

/**
 * The level marker that pins above its own group of lesson nodes. It is not a
 * tab: nothing here is clickable. Which pill is `active` is decided purely by
 * how far the reader has scrolled (see `course-map.tsx`), and stickiness is
 * applied by the caller so the pill can pin inside its own level section.
 */

export interface LevelPillProps {
  index: number;
  title: string;
  active: boolean;
  className?: string;
}

export function LevelPill({ index, title, active, className }: LevelPillProps) {
  return (
    <div
      aria-current={active ? "step" : undefined}
      className={cn(
        "flex h-[72px] w-full max-w-[468px] flex-col items-center justify-center rounded-[16px] border-2 bg-b-dark px-6 py-3 text-center transition-colors duration-200",
        active
          ? "border-b-blue shadow-[0_4px_0_0_#4A5CD6]"
          : "border-white/20 shadow-[0_4px_0_0_rgba(255,255,255,0.2)]",
        className,
      )}
    >
      <span
        className={cn("b-eyebrow", active ? "text-b-blue" : "text-b-dim")}
      >
        Level {index}
      </span>
      <span
        className={cn(
          "mt-0.5 text-[16px] leading-6 font-normal",
          active ? "text-white" : "text-b-dim",
        )}
      >
        {title}
      </span>
    </div>
  );
}
