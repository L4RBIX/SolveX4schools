import type { NovaDirective } from "@solvex/learning-intelligence-core";
import type { GrantDecision } from "@solvex/nova-core";
import { PROMPT_MARKERS } from "./prompt";
import { viewsOf, matchesAny } from "./normalize";

/**
 * What came back, judged against what was permitted.
 *
 * The rule this file exists to make true:
 *
 *   The system prompt says "never give full code."
 *   The model gives full code.
 *   The learner does not see it.
 *
 * The third line is the only one that is engineering. The first two are a wish.
 * Every restriction that matters has to survive the model ignoring it, and the
 * only way to arrange that is to look at the text before the learner does.
 *
 * ## Directive-aware, not code-phobic
 *
 * A validator that bans all code would break Nova at level 4, where giving the
 * fix IS the instruction. A validator that bans none is decoration. So the
 * budget comes from the grant: zero lines when `mayIncludeCode` is false or the
 * rung is a question, two when Nova is walking through the reasoning, unbounded
 * at the top of the ladder — plus a shape check that catches a complete
 * September program even when it fits inside the line budget.
 *
 * ## What this is not
 *
 * It is not a jailbreak detector. It never sees the learner's message and does
 * not care what was asked; it only cares what is about to be said. That makes
 * it the one layer that is indifferent to how novel the attack was.
 */

export type ViolationCode =
  /** A credential, a connection string, or a verbatim line of the prompt. */
  | "SYSTEM_SECRET_LEAK"
  /** The engine's own vocabulary — action names, thresholds, field names. */
  | "INTERNAL_POLICY_LEAK"
  /** More code than this rung of the ladder permits. */
  | "FULL_SOLUTION_WHEN_FORBIDDEN"
  /** A diagnosis the evidence does not support. */
  | "UNSUPPORTED_MISCONCEPTION_ASSERTION"
  /** A hidden case's input or expected output, verbatim. */
  | "HIDDEN_TEST_LEAK"
  /** Content that would not be acceptable from a tutor to a fourteen-year-old. */
  | "UNSAFE_CONTENT";

export interface Violation {
  readonly code: ViolationCode;
  /** For the ops log and the dev lab. Never shown to a learner. */
  readonly detail: string;
}

export interface ValidationContext {
  readonly grant: GrantDecision;
  readonly directive: NovaDirective | null;
  /**
   * Strings that must not appear verbatim, supplied by the caller.
   *
   * Hidden case inputs and expected outputs. They are never sent to the model,
   * so a leak should be impossible — which is exactly why the check is here.
   * The guarantee "hidden tests never reach the learner" is worth more when
   * something asserts it than when it rests on nobody having added them to the
   * context object yet.
   */
  readonly forbiddenLiterals?: readonly string[];
}

/** Credentials and connection strings, by shape rather than by value. */
const SECRET_SHAPES: RegExp[] = [
  /\bsk-[a-z0-9]{16,}/i,
  /\bDEEPSEEK_API_KEY\b/i,
  /\bLEARNING_ATTESTATION_SECRET\b/i,
  /\bLEARNING_ADMIN_TOKEN\b/i,
  /\bLEARNING_CRON_SECRET\b/i,
  /\bDATABASE_URL\b/i,
  /\bpostgres(ql)?:\/\/[^\s]+/i,
  /\bBearer\s+[A-Za-z0-9._-]{20,}/,
  /\bauthorization:\s*bearer\b/i,
];

/**
 * The engine's private vocabulary.
 *
 * A learner meeting `REDUCE_ASSISTANCE` has been shown the machinery, and the
 * spec is explicit that raw action names never reach a student. They are also
 * the clearest signal that the model has started narrating its instructions
 * rather than following them.
 */
const INTERNAL_VOCABULARY: RegExp[] = [
  /\b(REDUCE_ASSISTANCE|REMEDIATE|DIAGNOSE|STRENGTHEN|CHALLENGE)\b/,
  /\bNovaDirective\b/i,
  /\b(maxHintLevel|grantHintLevel|mayIncludeCode|mayNameMisconception|mustNotSay)\b/i,
  /\b(capped_by_directive|opening_rung|no_attempt_since_last_hint|one_rung_at_a_time|attempt_required|unproductive_struggle_override|learner_override)\b/,
  /\b(independence_weight|learner_skill_state|source_trust|sourceTrust|failure_attributed|learning_action_outcomes)\b/,
  /\bstruggle_class\b/,
  /\bsystem prompt\b/i,
  /\b(системн(ый|ые)\s+промпт|жүйелік\s+нұсқау)/i,
];

/**
 * A diagnosis stated as fact about the learner's mind.
 *
 * Only second-person claims about UNDERSTANDING are matched. Describing what
 * the code does — "your loop stops one step early" — is the entire job and must
 * never trip this. The difference is whether the sentence is about the program
 * or about the person.
 */
const DIAGNOSTIC_ASSERTION: RegExp[] = [
  /\byou\s+(don'?t|do\s+not|didn'?t|did\s+not)\s+(understand|know|get|grasp)\b/,
  /\byou\s+(clearly|obviously|evidently)\s+(don'?t|do\s+not)\b/,
  /\byour\s+problem\s+is\s+that\s+you\b/,
  /\byou\s+(are|'re)\s+confus(ed|ing)\s+\w+\s+(with|and)\b/,
  /\byou\s+(always|keep)\s+(forget|mix|confus)/,
  /\byou\s+(have|'ve)\s+(a\s+)?misconception\b/,
  /\bты\s+не\s+(понимаешь|знаешь|усвоил|разобрался)/,
  /\bтвоя\s+(проблема|ошибка)\s+в\s+том,?\s+что\s+ты\s+не\b/,
  /\bты\s+(всегда|постоянно)\s+(путаешь|забываешь)/,
  /\bты\s+(явно|очевидно)\s+не\s+(понимаешь|знаешь)/,
  /\bсен\s+(түсінбейсің|білмейсің|ұқпадың)/,
  /\bсенің\s+(мәселең|қатең)\s+—?\s*сен\s+.*(түсінбе|білме)/,
  /\bсен\s+(әрқашан|үнемі)\s+(шатастырасың|ұмытасың)/,
];

/** Output-side harm check. Narrow: this judges Nova, not the learner. */
const UNSAFE_OUTPUT: RegExp[] = [
  /\b(kill|hurt)\s+yourself\b/,
  /\byou\s+should\s+(die|give\s+up\s+on\s+life)\b/,
  /\bhere'?s?\s+how\s+to\s+(make|build)\s+(a\s+)?(bomb|explosive)\b/,
  /\bporn|\berotic\s+(story|roleplay)\b/,
  /(убей|убить)\s+себя/,
  /как\s+(сделать|собрать)\s+бомбу/,
  /порно/,
];

/**
 * A C++ line, recognised by shape.
 *
 * ## What this replaced, and why the old one had gone blind
 *
 * This was a Python matcher: `print(`, `def `, `elif`, a colon at the end of a
 * block header. Against a C++17 course it recognises almost nothing a model
 * would actually hand over — `cout << a + b;` matched none of its alternatives —
 * so the code-line budget, which is the mechanism that stops a level-1 hint
 * containing the answer, was counting zero lines in every reply. The ceiling was
 * still computed, still logged, and enforced nothing.
 *
 * ## Conservative in the same direction as before
 *
 * It counts lines that are unambiguously STATEMENTS, so prose that happens to
 * contain the word `int` is not code and a fenced block of real statements is.
 * The C++ signals that carry that weight:
 *
 *   - a stream statement — `cout << x;`, `cin >> a >> b;`
 *   - a declaration with a type — `int n;`, `long long s = 0;`, `double x = 1.5;`
 *   - a block header with a parenthesised condition — `if (a > b) {`, `while (n) {`
 *   - a function definition or a `return`
 *   - a preprocessor directive or `using namespace`
 *   - a plain assignment or compound assignment ending in `;`
 *
 * The trailing `;` is required on the statement forms and is what keeps the
 * false-positive rate near where the Python version had it: a sentence about a
 * variable does not end in a semicolon, and Kazakh and Russian prose never does.
 *
 * A block header is matched WITHOUT a semicolon, because `if (a > b) {` is a
 * line of the answer whether or not the brace is on it. `for (...)` is included
 * for the same reason even though September never teaches it — the validator's
 * job is to notice code, not to agree with the syllabus.
 */
const CPP_LINE = new RegExp(
  [
    "^\\s*(?:",
    /* Streams. The workhorse: nearly every line of a September answer is one. */
    "(?:std::)?c(?:out|err)\\s*<<.*;\\s*$",
    "|(?:std::)?cin\\s*>>.*;\\s*$",
    /* A declaration with a real type, optionally initialised. `unsigned`,
       `const` and `std::` prefixes are tolerated so a model that writes them
       does not slip under the budget. */
    "|(?:const\\s+)?(?:unsigned\\s+)?(?:int|long\\s+long|long|short|double|float|char|bool|auto|string|std::string|vector<[^>]*>|std::vector<[^>]*>)\\s+[A-Za-z_][^;]*;\\s*$",
    /* Block headers.
       Neither a semicolon nor a closing brace is required, and the line is not
       anchored at the end: `if (a % b == 0) cout << "YES";` is one line, it is
       the September acceptance bar's own shape, and an alternative that
       insisted on `) {` at the end of the line missed it entirely. */
    "|(?:if|else\\s+if|while|for|switch|do)\\s*\\(",
    "|else\\s*\\{?\\s*$",
    /* A function definition, including `int main()`. */
    "|(?:[A-Za-z_]\\w*\\s+)+[A-Za-z_]\\w*\\s*\\([^;]*\\)\\s*\\{\\s*$",
    /* return, with or without a value. */
    "|return\\b[^;]*;\\s*$",
    /* The frame's own lines. */
    "|#\\s*include\\b",
    "|using\\s+namespace\\s+\\w+\\s*;\\s*$",
    /* Assignment and compound assignment. */
    "|[A-Za-z_]\\w*\\s*(?:\\[[^\\]]*\\])?\\s*(?:[+\\-*/%]?=|\\+\\+|--)\\s*[^=].*;\\s*$",
    "|[A-Za-z_]\\w*\\s*(?:\\+\\+|--)\\s*;\\s*$",
    ")",
  ].join(""),
);

/**
 * Lines that are code but carry no answer.
 *
 * A bare comment, a closing brace or bracket, a lone `else {`, and — new for
 * C++ — the two lines of ceremony every single September program on screen
 * already contains. `#include <iostream>` and `using namespace std;` are the
 * frame the course GIVES the learner; counting them against the hint budget
 * would mean a tutor could not quote the code already in front of them, which
 * is the opposite of the thing the budget protects.
 *
 * `int main() {`, `return 0;` and the closing brace are trivial for the same
 * reason — they are on screen, given, and identical in every program.
 */
const TRIVIAL_LINE =
  /^\s*(?:\/\/.*|\/\*.*|\*.*|\)|\]|\};?|\{|else\s*\{?|#\s*include\s*<(?:iostream|bits\/stdc\+\+\.h)>|using\s+namespace\s+std\s*;|int\s+main\s*\(\s*\)\s*\{?|return\s+0\s*;)\s*$/;

interface CodeShape {
  /** Non-trivial statement lines, inside fences and out. */
  readonly lines: number;
  /** A whole runnable program for this curriculum: it reads AND it reports. */
  readonly wholeProgram: boolean;
  readonly fenced: boolean;
}

export function inspectCode(text: string): CodeShape {
  const fenced = /```/.test(text);

  /* Fenced content is the strong signal, but a model told not to use fences
     will simply indent instead, so every line is examined either way. */
  const lines = text
    .split("\n")
    .filter((l) => CPP_LINE.test(l) && !TRIVIAL_LINE.test(l));

  const body = lines.join("\n");
  /*
   * A finished task, recognised by what it DOES rather than by how long it is.
   *
   * The September shape is: read something, and report something. Three lines
   * that do both are a complete answer to nearly every task in the month, and
   * the line budget says nothing about that — which is why this check exists
   * separately from the count.
   *
   * `int main` counts on its own for the same reason it did in Python for
   * `def`: a reply that contains a whole `main` has handed over a program, not
   * pointed at a line. The frame is on the learner's screen already, so a model
   * that reproduces it is reproducing it around something.
   *
   * The `cin`/`cout` pair is the direct translation of the old
   * `input()` + `print()` test and catches the answer given WITHOUT the frame,
   * which is the commoner leak: the learner has the frame, so the two body
   * lines are the whole thing they were missing.
   */
  const reads = /\b(?:std::)?cin\s*>>/.test(body);
  const reports = /\b(?:std::)?cout\s*<</.test(body);
  const hasMain = /\bint\s+main\s*\(/.test(body);
  const wholeProgram = (reads && reports) || hasMain;

  return { lines: lines.length, wholeProgram, fenced };
}

/**
 * How much code this rung may contain.
 *
 * Zero is not "no code fences"; it is no statement lines at all. Level 2 and 3
 * are naming a concept and walking through reasoning, both of which sometimes
 * need one line to point at — two is the allowance for that plus the line it is
 * being compared to. Level 4 is "give the fix, and explain why", which is
 * unbounded by definition.
 */
export function codeLineBudget(grant: GrantDecision): number {
  if (!grant.mayIncludeCode) return 0;
  if (grant.granted <= 1) return 0;
  if (grant.granted <= 3) return 2;
  return Number.POSITIVE_INFINITY;
}

export function validateOutput(text: string, ctx: ValidationContext): Violation[] {
  const violations: Violation[] = [];
  if (!text.trim()) return violations;

  for (const shape of SECRET_SHAPES) {
    const m = shape.exec(text);
    if (m) {
      violations.push({ code: "SYSTEM_SECRET_LEAK", detail: `matched ${shape.source}` });
      break;
    }
  }

  /* Verbatim prompt text. The markers are exported by `prompt.ts` rather than
     restated here, so a section renamed there cannot leave this check quietly
     matching nothing. */
  for (const marker of PROMPT_MARKERS) {
    if (text.includes(marker)) {
      violations.push({ code: "SYSTEM_SECRET_LEAK", detail: `prompt marker: ${marker}` });
      break;
    }
  }

  for (const p of INTERNAL_VOCABULARY) {
    if (p.test(text)) {
      violations.push({ code: "INTERNAL_POLICY_LEAK", detail: `matched ${p.source}` });
      break;
    }
  }

  for (const literal of ctx.forbiddenLiterals ?? []) {
    /* Short literals are skipped. A hidden expected output of `4` would match
       every arithmetic explanation Nova ever gives. */
    if (literal.trim().length >= 6 && text.includes(literal)) {
      violations.push({ code: "HIDDEN_TEST_LEAK", detail: "verbatim hidden-case literal" });
      break;
    }
  }

  const budget = codeLineBudget(ctx.grant);
  const code = inspectCode(text);
  if (code.lines > budget) {
    violations.push({
      code: "FULL_SOLUTION_WHEN_FORBIDDEN",
      detail: `${code.lines} code lines, budget ${budget} at level ${ctx.grant.granted}`,
    });
  } else if (code.wholeProgram && ctx.grant.granted < 4) {
    /* Under budget and still a complete answer. Three lines that read input,
       compute and print it are a finished September task; the line count says
       nothing about that, the shape does. */
    violations.push({
      code: "FULL_SOLUTION_WHEN_FORBIDDEN",
      detail: `complete program shape at level ${ctx.grant.granted}`,
    });
  }

  const mayName = ctx.directive?.mayNameMisconception === true && !!ctx.directive?.namedMisconception;
  if (!mayName) {
    for (const p of DIAGNOSTIC_ASSERTION) {
      if (p.test(text.toLowerCase())) {
        violations.push({
          code: "UNSUPPORTED_MISCONCEPTION_ASSERTION",
          detail: `matched ${p.source}`,
        });
        break;
      }
    }
  }

  if (matchesAny(viewsOf(text).all, UNSAFE_OUTPUT)) {
    violations.push({ code: "UNSAFE_CONTENT", detail: "unsafe output family" });
  }

  return violations;
}
