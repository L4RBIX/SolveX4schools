"use client";

import type { LessonBlock } from "@schools/curriculum/types";
import { MultipleChoiceRenderer, PredictionRenderer } from "./choice";
import {
  CodeTaskRenderer,
  FillBlankRenderer,
  FindBugRenderer,
  ReorderCodeRenderer,
} from "./code";
import {
  ConceptRenderer,
  ExplainRenderer,
  ReflectionRenderer,
  TestCaseRenderer,
  TraceCodeRenderer,
  VerifyRenderer,
  VisualSimulationRenderer,
} from "./reading";
import type { BlockProps } from "./types";

export type { BlockProps, BlockResult } from "./types";

/**
 * Block dispatch.
 *
 * The switch is exhaustive over `BlockType` and the `never` in the default arm
 * makes that a compile error rather than a runtime blank: adding a block type
 * without a renderer must not ship as an empty card in front of a student.
 */
export function BlockRenderer(props: BlockProps) {
  const { block } = props;

  switch (block.type) {
    case "concept":
      return <ConceptRenderer {...props} block={block} />;
    case "prediction":
      return <PredictionRenderer {...props} block={block} />;
    case "multiple_choice":
      return <MultipleChoiceRenderer {...props} block={block} />;
    case "trace_code":
      return <TraceCodeRenderer {...props} block={block} />;
    case "fill_blank":
      return <FillBlankRenderer {...props} block={block} />;
    case "reorder_code":
      return <ReorderCodeRenderer {...props} block={block} />;
    case "find_bug":
      return <FindBugRenderer {...props} block={block} />;
    case "write_code":
    case "modify_code":
    case "challenge":
      return <CodeTaskRenderer {...props} block={block} />;
    case "test_case":
      return <TestCaseRenderer {...props} block={block} />;
    case "explain":
      return <ExplainRenderer {...props} block={block} />;
    case "reflection":
      return <ReflectionRenderer {...props} block={block} />;
    case "visual_simulation":
      return <VisualSimulationRenderer {...props} block={block} />;
    case "verify":
      return <VerifyRenderer {...props} block={block} />;
    case "arena_problem":
      // Served by Arena, not the lesson runtime. Reaching here means a lesson
      // embedded one directly, which is a content bug worth seeing.
      return (
        <p className="text-sx-meta text-sx-text-3">
          Arena problem {block.problemId}
        </p>
      );
    default: {
      const exhaustive: never = block;
      void exhaustive;
      return null;
    }
  }
}

/** Blocks the learner acts on, in order. Used for the progress counter. */
export function actionableBlocks(blocks: LessonBlock[]): LessonBlock[] {
  return blocks;
}
