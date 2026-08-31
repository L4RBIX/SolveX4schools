"use client";

import { motion } from "motion/react";
import { Fragment } from "react";

import type { LearningPathData } from "@/components/brilliant/courses-data";
import { PathTile, TileArt } from "@/components/brilliant/path-tile";
import { enter } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * One learning path: a header row (64px illustration + eyebrow/title/blurb)
 * above a #1E1E1E panel holding six tiles.
 *
 * The connectors between neighbouring tiles are flex spacers that only exist
 * on the wide (xl) layout — below that the row wraps to 3-up and then 2-up and
 * the reference drops the connecting line entirely.
 */

export interface LearningPathProps {
  path: LearningPathData;
  className?: string;
}

export function LearningPath({ path, className }: LearningPathProps) {
  const headingId = `${path.id}-title`;

  return (
    <section
      aria-labelledby={headingId}
      className={cn("b-shell-narrow", className)}
    >
      <header className="flex items-start gap-4 sm:gap-5">
        <TileArt kind={path.art} className="size-12 shrink-0 sm:size-16" />
        <div className="min-w-0">
          <p className="b-eyebrow text-b-dim">{path.eyebrow}</p>
          <h2
            id={headingId}
            className="mt-1.5 text-[24px] leading-[30px] font-bold text-b-fg"
          >
            {path.title}
          </h2>
          <p className="mt-1.5 max-w-[680px] text-[16px] leading-6 text-b-dim">
            {path.description}
          </p>
        </div>
      </header>

      <div className="mt-6 rounded-[12px] bg-b-panel p-5 sm:p-8 xl:px-5 xl:py-9">
        <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-9 sm:gap-x-5 xl:flex-nowrap xl:justify-between xl:gap-x-0">
          {path.tiles.map((tile, index) => (
            <Fragment key={tile.slug}>
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="mt-[88px] hidden h-[2px] min-w-[8px] flex-1 bg-b-edge xl:block"
                />
              ) : null}
              <motion.div
                className="shrink-0"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ ...enter, duration: 0.45, delay: index * 0.05 }}
              >
                <PathTile
                  label={tile.label}
                  grade={tile.grade}
                  art={tile.art}
                  isNew={tile.isNew}
                />
              </motion.div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
