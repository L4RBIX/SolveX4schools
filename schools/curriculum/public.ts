import type {
  ArenaProblemBlock,
  Localized,
  ChallengeBlock,
  ConceptBlock,
  ExplainBlock,
  FillBlankBlock,
  FindBugBlock,
  Lesson,
  LessonBlock,
  ModifyCodeBlock,
  Month,
  MonthlyAssessment,
  MultipleChoiceBlock,
  PredictionBlock,
  ReflectionBlock,
  ReorderCodeBlock,
  TestCaseBlock,
  TraceCodeBlock,
  Unit,
  VerifyBlock,
  VisualSimulationBlock,
  WorkedExampleBlock,
  WriteCodeBlock,
} from "./types";

/**
 * The learner-facing projection of the curriculum.
 *
 * ## Why this file exists
 *
 * The lesson page is a server component that handed the whole `Lesson` object
 * to a client component. Next serialises client-component props into the RSC
 * payload embedded in the HTML, so every `referenceSolution` and every hidden
 * test case was sitting in the page source. That was provable rather than
 * theoretical: the built `m1.l9.html` contained `abs(n) % 10` — a string whose
 * own type comment reads "Never shown to a learner" — and `m1.l8.html`
 * contained the hidden input `5 100`. The label «Ещё N скрытых теста —
 * скопировать пример недостаточно» was false, and Ctrl+U defeated every code
 * task in the month.
 *
 * So there are now two payloads. This one goes to the browser. The full one
 * never leaves the server: `schools/learning/grade.ts` looks blocks up in the
 * curriculum module directly, which is already how authoritative grading works.
 *
 * ## The rule
 *
 * **Anything that could be used to answer a task is removed here.** Not
 * obfuscated, not moved behind a flag — absent from the object. If a field is
 * needed to *render* a task it stays; if it is needed to *pass* one it goes.
 *
 * The types below are written out variant by variant rather than derived with
 * a mapped `Omit`. That is deliberate: this is a security boundary, and a
 * reader should be able to see exactly which fields cross it without
 * evaluating a conditional type in their head. `publicBlock` below is
 * exhaustive over `BlockType`, so a new block type fails the build here rather
 * than silently defaulting to "ship everything".
 *
 * ## What replaced the reveals
 *
 * Nine of the fourteen block views used to render an answer key back to the
 * learner the moment a verdict arrived. Those keys are gone from this payload,
 * so the reveal now comes from the server in the submit response — and only
 * once the learner has actually earned it. See `revealFor` in
 * `schools/learning/reveal.ts`.
 */

/* -------------------------------------------------------------------------- */
/* Cases                                                                      */
/* -------------------------------------------------------------------------- */

/** A sample the learner is meant to see. Hidden cases never become one. */
export interface PublicCase {
  input: string;
  expectedOutput: string;
}

/**
 * Visible cases, plus how many were withheld.
 *
 * The count is deliberately kept: "there are 3 more tests you cannot see" is
 * true, useful, and impossible to exploit. The old payload shipped their
 * inputs and outputs too, which made the same sentence a lie.
 */
function splitCases(
  cases: readonly { input: string; expectedOutput: string; hidden?: boolean }[] | undefined,
): { visibleCases: PublicCase[]; hiddenCaseCount: number } {
  if (!cases) return { visibleCases: [], hiddenCaseCount: 0 };
  const visible = cases.filter((c) => !c.hidden);
  return {
    visibleCases: visible.map((c) => ({ input: c.input, expectedOutput: c.expectedOutput })),
    hiddenCaseCount: cases.length - visible.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Block projections                                                          */
/* -------------------------------------------------------------------------- */

/** Fields every public block keeps. `skillRefs` and provenance are dropped: the
 *  learner does not need them and the teacher console reads them server-side. */
interface PublicBase {
  id: string;
  type: LessonBlock["type"];
  /**
   * True when finishing the lesson does not require this block.
   *
   * This is the ONE thing that crosses from `bank`. The membership itself —
   * which role it plays and the justification naming the sibling tasks that
   * already carry the evidence — is editorial reasoning written for whoever
   * maintains the curriculum, and it names other block ids, so it stays on the
   * server with `skillRefs` and provenance.
   *
   * What crosses is the only part the learner is owed: whether they have to do
   * it. Absent means required, so every block authored before the bank existed
   * projects exactly as it did.
   */
  optional?: true;
}

export type PublicConcept = PublicBase & Pick<ConceptBlock, "title" | "body" | "code"> & { type: "concept" };

export type PublicWorkedExample = PublicBase &
  Pick<WorkedExampleBlock, "title" | "problem" | "steps" | "code" | "result"> & { type: "worked_example" };

/** `answer` removed. Options stay — they are the question, not the answer. */
export type PublicPrediction = PublicBase &
  Pick<PredictionBlock, "prompt" | "code" | "options" | "stdin"> & { type: "prediction" };

/** `correctOptionId` removed. */
export type PublicMultipleChoice = PublicBase &
  Pick<MultipleChoiceBlock, "prompt" | "code" | "options"> & { type: "multiple_choice" };

/**
 * Variable NAMES survive, values do not.
 *
 * `canCheck` needs the names to know which grid cells are required, and the
 * learner needs them as column headings. The values are the answer.
 */
export type PublicTrace = PublicBase &
  Pick<TraceCodeBlock, "prompt" | "code"> & {
    type: "trace_code";
    steps: { line: number; vars: string[] }[];
  };

/** `blanks[].answer` and `alternatives` removed; only the count and ids remain. */
export type PublicFillBlank = PublicBase &
  Pick<FillBlankBlock, "prompt" | "template"> & {
    type: "fill_blank";
    blanks: { id: string }[];
  };

/** `correctOrder` removed. Lines are shuffled deterministically per block id. */
export type PublicReorder = PublicBase &
  Pick<ReorderCodeBlock, "prompt" | "lines"> & { type: "reorder_code" };

/** `buggyLine` and `fixedCode` removed. */
export type PublicFindBug = PublicBase & Pick<FindBugBlock, "prompt" | "code"> & { type: "find_bug" };

/** `breakingInputs` removed — it is literally the answer to "find an input that breaks it". */
export type PublicTestCase = PublicBase & Pick<TestCaseBlock, "prompt" | "code"> & { type: "test_case" };

/** `expectedPoints` removed: the marking rubric is not a hint. */
export type PublicExplain = PublicBase & Pick<ExplainBlock, "prompt"> & { type: "explain" };

export type PublicReflection = PublicBase & Pick<ReflectionBlock, "prompt"> & { type: "reflection" };

export type PublicSimulation = PublicBase &
  Pick<VisualSimulationBlock, "prompt" | "simulation" | "config"> & { type: "visual_simulation" };

/** `referenceSolution` and hidden cases removed. */
export type PublicCodeTask = PublicBase & {
    /* Written out rather than Pick<A & B & C, "prompt">: intersecting three
       blocks whose `type` literals differ collapses the whole intersection to
       `never`, which the compiler reports as a puzzling error on `prompt`. */
    prompt: Localized;
    type: "write_code" | "modify_code" | "challenge";
    starter?: string;
    code?: string;
    visibleCases: PublicCase[];
    hiddenCaseCount: number;
  };

/** `referenceSolution`, hidden cases and `expectedPoints` removed; `code` stays —
 *  a repair task must show the program, which is what `m1.as.b3` lacked. */
export type PublicVerify = PublicBase &
  Pick<VerifyBlock, "prompt" | "mode"> & {
    type: "verify";
    code?: string;
    starter?: string;
    visibleCases: PublicCase[];
    hiddenCaseCount: number;
  };

export type PublicArena = PublicBase & Pick<ArenaProblemBlock, "prompt"> & { type: "arena_problem" };

export type PublicBlock =
  | PublicConcept
  | PublicWorkedExample
  | PublicPrediction
  | PublicMultipleChoice
  | PublicTrace
  | PublicFillBlank
  | PublicReorder
  | PublicFindBug
  | PublicTestCase
  | PublicExplain
  | PublicReflection
  | PublicSimulation
  | PublicCodeTask
  | PublicVerify
  | PublicArena;

export interface PublicLesson {
  id: string;
  title: Lesson["title"];
  blocks: PublicBlock[];
}

export interface PublicAssessment {
  id: string;
  title: MonthlyAssessment["title"];
  minutes: number;
  description: MonthlyAssessment["description"];
  monthIndex: number;
  blocks: PublicBlock[];
}

/* -------------------------------------------------------------------------- */
/* Projection                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Deterministic shuffle for presented order.
 *
 * Used for reorder lines and for option sets. Options needed it for a reason
 * the audit measured: across September's eight option-bearing blocks the
 * correct answer sat FIRST in four of them, so "always click the top one" was
 * a 50% strategy against content that never shuffled. The authored order stays
 * meaningful to whoever writes the block; what a learner sees no longer
 * correlates with it.
 *
 * Shuffling is purely presentational and cannot affect grading: the browser
 * sends back an option id (or the option's own text), and the server checks it
 * against the real key, which never left the server.
 *
 * The audit found the month's only assembly task was presented in the exact
 * reverse of the correct order, so "drag the bottom line to the top, repeat"
 * solved it without reading the code. Seeding from the block id keeps the
 * presentation stable across renders and reloads — a task that reshuffles
 * under the learner's fingers is its own kind of broken — while removing the
 * pattern. `correctOrder` no longer ships, so the ordering carries no
 * information about the answer either way.
 */
function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Project one block, and say whether the learner has to do it.
 *
 * The projection proper is `projectBlock`, which is exhaustive over the block
 * types. `optional` is attached here rather than inside seventeen switch arms —
 * one place to read, and no way for a new block type to acquire the field by
 * being forgotten.
 */
export function publicBlock(block: LessonBlock): PublicBlock {
  const projected = projectBlock(block);
  return block.bank ? { ...projected, optional: true } : projected;
}

/** Project one block. Exhaustive: a new `BlockType` breaks the build here. */
function projectBlock(block: LessonBlock): PublicBlock {
  switch (block.type) {
    case "concept":
      return { id: block.id, type: "concept", title: block.title, body: block.body, code: block.code };

    case "worked_example":
      return {
        id: block.id,
        type: "worked_example",
        title: block.title,
        problem: block.problem,
        steps: block.steps,
        code: block.code,
        result: block.result,
      };

    case "prediction":
      return {
        id: block.id,
        type: "prediction",
        prompt: block.prompt,
        code: block.code,
        stdin: block.stdin,
        options: block.options ? seededShuffle(block.options, block.id) : undefined,
      };

    case "multiple_choice":
      return {
        id: block.id,
        type: "multiple_choice",
        prompt: block.prompt,
        code: block.code,
        options: seededShuffle(block.options, block.id),
      };

    case "trace_code":
      return {
        id: block.id,
        type: "trace_code",
        prompt: block.prompt,
        code: block.code,
        steps: block.steps.map((s) => ({ line: s.line, vars: Object.keys(s.vars) })),
      };

    case "fill_blank":
      return {
        id: block.id,
        type: "fill_blank",
        prompt: block.prompt,
        template: block.template,
        blanks: block.blanks.map((b) => ({ id: b.id })),
      };

    case "reorder_code":
      return {
        id: block.id,
        type: "reorder_code",
        prompt: block.prompt,
        lines: seededShuffle(block.lines, block.id),
      };

    case "find_bug":
      return { id: block.id, type: "find_bug", prompt: block.prompt, code: block.code };

    case "test_case":
      return { id: block.id, type: "test_case", prompt: block.prompt, code: block.code };

    case "explain":
      return { id: block.id, type: "explain", prompt: block.prompt };

    case "reflection":
      return { id: block.id, type: "reflection", prompt: block.prompt };

    case "visual_simulation":
      return {
        id: block.id,
        type: "visual_simulation",
        prompt: block.prompt,
        simulation: block.simulation,
        config: block.config,
      };

    case "write_code":
    case "modify_code":
    case "challenge": {
      const { visibleCases, hiddenCaseCount } = splitCases(block.cases);
      return {
        id: block.id,
        type: block.type,
        prompt: block.prompt,
        starter: "starter" in block ? block.starter : undefined,
        code: "code" in block ? block.code : undefined,
        visibleCases,
        hiddenCaseCount,
      };
    }

    case "verify": {
      const { visibleCases, hiddenCaseCount } = splitCases(block.cases);
      return {
        id: block.id,
        type: "verify",
        prompt: block.prompt,
        mode: block.mode,
        code: block.code,
        starter: block.starter ?? block.code,
        visibleCases,
        hiddenCaseCount,
      };
    }

    case "arena_problem":
      return { id: block.id, type: "arena_problem", prompt: block.prompt };

    default: {
      const exhaustive: never = block;
      void exhaustive;
      throw new Error("unhandled block type in publicBlock");
    }
  }
}

/**
 * Which blocks this learner's track receives.
 *
 * `tracks` was declared on five September blocks and read by nothing, so all
 * three levels received an identical sequence — the differentiation the
 * programme sells did not exist at runtime. Filtering happens here, on the
 * server, so a browser cannot award itself the advanced set by editing a
 * variable, and so the blocks a learner never sees are never sent to them.
 */
export function blocksForTrack<T extends { tracks?: readonly string[] }>(
  blocks: readonly T[],
  track: string,
): T[] {
  return blocks.filter((b) => !b.tracks || b.tracks.includes(track));
}

export function publicLesson(lesson: Lesson, track: string): PublicLesson {
  return {
    id: lesson.id,
    title: lesson.title,
    blocks: blocksForTrack(lesson.blocks, track).map(publicBlock),
  };
}

export function publicAssessment(
  assessment: MonthlyAssessment,
  monthIndex: number,
  track: string,
): PublicAssessment {
  return {
    id: assessment.id,
    title: assessment.title,
    minutes: assessment.minutes,
    description: assessment.description,
    monthIndex,
    blocks: blocksForTrack(assessment.blocks, track).map(publicBlock),
  };
}

/* -------------------------------------------------------------------------- */
/* Month outlines — the home deck and the year roadmap                        */
/* -------------------------------------------------------------------------- */

/**
 * A month with its lesson bodies removed.
 *
 * `/home` and `/program` passed the raw `MONTHS` array straight into two client
 * components, and both routes are statically prerendered — so every September
 * reference solution and every diagnostic justification was sitting in
 * `home.html` and `program.html` as well. Fixing the lesson route alone would
 * have left the same keys on the front page.
 *
 * Those two screens need month and lesson METADATA — names, ids, status, and
 * enough of each block to count how many are tasks. They never render a block.
 * So the blocks survive as `{id, type}` and nothing else: `countTasks` reads
 * `type`, `isLessonReady` reads `blocks.length`, and neither needs a prompt, a
 * solution or a test case to do it.
 *
 * `Month` is structurally assignable to this, so every existing server-side
 * caller of the adapters keeps working unchanged.
 */
export interface BlockOutline {
  id: string;
  type: LessonBlock["type"];
  /**
   * Carried so the month board can quote a total the required path can reach.
   *
   * `monthTaskCount` counts attempt blocks, and with no field to filter on it
   * counted the optional ones too: October advertised 85 tasks where 75 are
   * required. Milder than the in-lesson readout, which had a numerator beside
   * it, but the same lie.
   */
  optional?: true;
}

export interface LessonOutline extends Omit<Lesson, "blocks"> {
  blocks: BlockOutline[];
}

export interface UnitOutline extends Omit<Unit, "lessons"> {
  lessons: LessonOutline[];
}

export interface AssessmentOutline extends Omit<MonthlyAssessment, "blocks"> {
  blocks: BlockOutline[];
}

export interface MonthOutline extends Omit<Month, "units" | "assessment"> {
  units: UnitOutline[];
  assessment: AssessmentOutline | null;
}

function outlineBlocks(blocks: readonly LessonBlock[]): BlockOutline[] {
  return blocks.map((b) => (b.bank ? { id: b.id, type: b.type, optional: true as const } : { id: b.id, type: b.type }));
}

export function monthOutline(month: Month): MonthOutline {
  return {
    ...month,
    units: month.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => ({ ...lesson, blocks: outlineBlocks(lesson.blocks) })),
    })),
    assessment: month.assessment
      ? { ...month.assessment, blocks: outlineBlocks(month.assessment.blocks) }
      : null,
  };
}

export function monthOutlines(months: readonly Month[]): MonthOutline[] {
  return months.map(monthOutline);
}

/**
 * Every string that must never appear in a browser payload.
 *
 * Used by the build-output test (`tests/school/payload-privacy.test.ts`) to
 * assert the boundary actually holds against the rendered HTML, rather than
 * trusting that this module is wired in everywhere it should be.
 */
export function secretStringsOf(block: LessonBlock): string[] {
  const out: string[] = [];
  if ("referenceSolution" in block && typeof block.referenceSolution === "string") {
    out.push(block.referenceSolution);
  }
  if ("fixedCode" in block && typeof block.fixedCode === "string") out.push(block.fixedCode);
  const caseValues = new Set<string>();
  if ("cases" in block && Array.isArray(block.cases)) {
    for (const c of block.cases) {
      if (!c.hidden) continue;
      out.push(c.input, c.expectedOutput);
      caseValues.add(c.input);
      caseValues.add(c.expectedOutput);
    }
  }
  if (block.type === "fill_blank") {
    for (const b of block.blanks) {
      out.push(b.answer);
      if (b.alternatives) out.push(...b.alternatives);
    }
  }
  if (block.type === "test_case") out.push(...block.breakingInputs);
  if (block.type === "trace_code") {
    for (const s of block.steps) out.push(...Object.values(s.vars));
  }
  /* Bank membership is editorial reasoning that names the sibling tasks already
     carrying this one's evidence — a map to where an equivalent answer lives,
     written for whoever maintains the curriculum. `publicBlock` sends only the
     boolean, and this is the net that would notice if some future call site
     stopped doing that. Adding it here rather than trusting the projection is
     the lesson of the original leak: the defect was never the collector, it was
     a call site that did not use it. */
  if (block.bank) out.push(block.bank.why);
  if (block.diagnosticMapping) {
    for (const entry of Object.values(block.diagnosticMapping)) out.push(entry.justification);
  }

  /*
   * Two filters, and both exist because a false sentinel is worse than none: it
   * trains whoever reads the failure to disbelieve the test.
   *
   * Short or generic strings ("0", "yes") appear all over a page for innocent
   * reasons, so only distinctive ones qualify.
   *
   * And a hidden case's OUTPUT is frequently a token the task is obliged to
   * publish — m1.l6.b2b tells the learner in the prompt to print "discount" and
   * shows it in a visible sample, so the same word arriving as a hidden
   * expectation is not a secret. What is genuinely hidden there is the PAIRING
   * of input to output, which no string search can express; `hiddenCaseCount`
   * is what holds that line. Anything already on the question surface is
   * therefore excused — but only for case values. A reference solution, a
   * repaired program, a blank answer, a breaking input, a trace value or a
   * justification is never excused, whatever else it resembles.
   */
  const surface = [
    ...Object.values(("prompt" in block ? block.prompt : {}) as Record<string, string>),
    ...("cases" in block && Array.isArray(block.cases)
      ? block.cases.filter((c) => !c.hidden).flatMap((c) => [c.input, c.expectedOutput])
      : []),
  ].join("\n");

  return out.filter((value) => {
    if (value.trim().length < 8) return false;
    if (caseValues.has(value) && surface.includes(value)) return false;
    return true;
  });
}
