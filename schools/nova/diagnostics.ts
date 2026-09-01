/**
 * Reading a compiler at a fourteen-year-old.
 *
 * ## Why this is a new job and not a translated one
 *
 * Python failed at RUN time, with a named exception and a traceback whose last
 * line was the whole answer: `ZeroDivisionError: division by zero`. A learner
 * who could not read English could still recognise the shape, and Nova's job
 * was to explain a concept.
 *
 * C++ fails at COMPILE time, before anything runs, in a paragraph of English
 * that a beginner in Kazakhstan cannot parse:
 *
 *     main.cpp:5:19: error: expected ';' after expression
 *         cout << a + b
 *                      ^
 *                      ;
 *
 * Three things about that are hostile at once. It is English. It names a column.
 * And — the one that costs the most hours — **the line it blames need not be
 * the line that is wrong**. A parser reports where it NOTICED, which is not
 * where the mistake HAPPENED, and the distance between the two is not a
 * constant anyone can teach.
 *
 * ## The offset rule this file used to state, and why it was wrong
 *
 * Until this was measured, the entry below asserted that the semicolon "is
 * almost always at the END OF THE LINE ABOVE the line the compiler names" and
 * told Nova the fix was "usually one line earlier". That is one compiler's
 * habit written down as a law, and it made Nova name the wrong line to a
 * learner reading real browser output. Measured on this course's own engines,
 * on one program each (`int a = 5` with no semicolon, then an `if`):
 *
 *     Clang 8 / browser   main.cpp:4:14: error: expected ';' at end of declaration
 *     GCC 14.1 / judge    main.cpp:5:5:  error: expected ',' or ';' before 'if'
 *
 * Same defect, same source, two different line numbers — 4 and 5. Any fixed
 * offset is therefore wrong for one of the two buttons the learner can press,
 * and "one line earlier" was wrong for the browser, which is the engine that
 * produced the text they are looking at when they open this panel.
 *
 * The replacement is not a better offset. It is to stop having one: Nova is
 * given the real stderr and the learner's real source on every turn, and it is
 * told to read the line the compiler named AND its neighbour and say which one
 * is actually unfinished.
 *
 * So translating the diagnostic is the single most valuable thing this tutor
 * gained in the migration, and it is not a thing the Python prompt had any
 * shape for.
 *
 * ## Matching the SHAPE, not one compiler's wording
 *
 * Two engines run the learner's code and they phrase everything differently:
 * Clang 8.0.1 in the browser, GCC 14.1 on the judge (see
 * `docs/cpp17/CPP17_JUDGE_PARITY.md`). Clang says `use of undeclared
 * identifier 'x'`; GCC says `'x' was not declared in this scope`. A pattern
 * written against whichever one the author had open recognises half the errors
 * a learner meets and silently nothing on the other half — and which half
 * depends on whether they pressed Run or Submit, which is the worst possible
 * axis for a tutor's usefulness to vary along.
 *
 * Every family below therefore carries patterns for both, and the test suite
 * feeds it both compilers' real text.
 *
 * ## What crosses into the prompt
 *
 * Only the KIND. `recogniseDiagnostics` reads the learner's stderr, which is
 * learner-controlled text; what it returns is a member of a closed union
 * declared here, and `diagnosticPromptLines` renders constants. No substring of
 * the learner's output reaches the system message through this file. The
 * diagnostic text itself still travels — fenced, in the user turn, as
 * `program_stderr` — exactly as it did before.
 *
 * The worst a learner achieves by printing `error: expected ';'` on stderr is
 * that Nova is handed a paragraph about semicolons it did not need. That is a
 * wasted hundred characters, not an injection.
 */

/**
 * The families a September learner actually meets.
 *
 * Closed on purpose. A `Record` over the union below means a family added here
 * without an explanation fails to compile rather than rendering as nothing.
 */
export type CompilerDiagnosticKind =
  /** `expected ';' after expression` — the line named is where the parser stopped. */
  | "missing_semicolon"
  /** `use of undeclared identifier 'x'` — never declared, or out of scope now. */
  | "undeclared_identifier"
  /** `cout` with no `using namespace std;` or no `#include <iostream>`. */
  | "std_name_unqualified"
  /** `expected '}'` — the braces do not balance. */
  | "unbalanced_braces"
  /** `invalid operands to binary expression` — the types do not go together. */
  | "invalid_operands"
  /** `no matching function for call to 'max'` — the two-different-types trap. */
  | "no_matching_function"
  /** `cout <<` of something with no `operator<<`, or `cin >>` of something with no `>>`. */
  | "no_stream_operator"
  /** Initialising a variable from a value of an unrelated type: `int x = "5";`. */
  | "bad_initialisation"
  /** `undefined reference to 'main'` — the link step, not the compile step. */
  | "missing_main"
  /** `if (a = b)` — assignment where a comparison was meant. A warning, and the real bug. */
  | "assignment_in_condition"
  /** A variable read before anything was put in it. */
  | "uninitialised_variable";

export interface Cpp17Diagnostic {
  readonly kind: CompilerDiagnosticKind;
  /**
   * Both engines' phrasings of the same failure.
   *
   * Written against the message text rather than against a whole diagnostic
   * block, so a matcher does not depend on the `file:line:col:` prefix that
   * differs between the browser (`main.cpp`) and the judge.
   */
  readonly shapes: readonly RegExp[];
  /**
   * What is actually wrong, in one line, for the model.
   *
   * The truth, not the compiler's phrasing. Where those differ — and for the
   * first family they differ badly — this is the one that helps.
   */
  readonly meaning: string;
  /**
   * How to teach it without handing the fix over.
   *
   * A rung of the ladder still applies on top of this; these lines say what to
   * point AT, never how much to say. The hint ceiling above them decides that,
   * and it decided it on the server before this text existed.
   */
  readonly teach: string;
}

/**
 * The table.
 *
 * Order matters only for readability — every family is tested against the text
 * and any number may match at once, which is the common case: one missing
 * semicolon typically produces `expected ';'` and then a cascade of undeclared
 * identifiers behind it. Reporting both is correct, and the `teach` line for
 * the cascade says so.
 */
export const COMPILER_DIAGNOSTICS: readonly Cpp17Diagnostic[] = [
  {
    kind: "missing_semicolon",
    shapes: [
      /* Clang: expected ';' after expression / after return statement / at end of declaration.
         GCC:   expected ';' before '}' token / before 'return' / before 'cout'. */
      /expected\s+['‘"]?;['’"]?\s+(after|before|at\s+end)/i,
      /* GCC's OTHER phrasing, for a declaration that was not finished:
         `expected ',' or ';' before 'if'`. This is real judge output — see the
         fixtures — and it matched nothing here until it was measured, so a
         learner who pressed Submit on the single most common September typo
         got no explanation of it at all. */
      /expected\s+['‘"]?,['’"]?\s+or\s+['‘"]?;['’"]?\s+(after|before|at\s+end)/i,
      /expected\s+initializer\s+before\s+['‘"]?\w+['’"]?/i,
    ],
    meaning:
      "A statement is not finished; every C++ statement ends in a semicolon. Where the compiler " +
      "POINTS and where the semicolon BELONGS are different things and the gap is not fixed: it " +
      "reads on until the text stops making sense, stopping on the unfinished line or the next one.",
    teach:
      "Use the stderr you were actually given and their real code: check the line the compiler " +
      "named AND the one just before it, and say which does not end in a semicolon. Never apply a " +
      "fixed line offset. No corrected line unless your level allows code.",
  },
  {
    kind: "undeclared_identifier",
    shapes: [
      // Clang
      /use\s+of\s+undeclared\s+identifier/i,
      // GCC
      /['‘"]?\w+['’"]?\s+was\s+not\s+declared\s+in\s+this\s+scope/i,
      /['‘"]?\w+['’"]?\s+undeclared\s+\(first\s+use/i,
    ],
    meaning:
      "A name is used that the compiler has never been told about. Three causes, in the order " +
      "they actually happen: it was never declared with a type; it is spelled differently here " +
      "than where it was declared; or it was declared inside a { } block that has already ended, " +
      "so it does not exist at this line any more.",
    teach:
      "Ask them to find where that name is first given a type. Scope is the cause a beginner " +
      "never guesses, so if the declaration is inside an if or a block, point at the closing brace.",
  },
  {
    kind: "std_name_unqualified",
    shapes: [
      // GCC's phrasing for cout/cin/endl specifically.
      /['‘"]?(cout|cin|endl|string|vector)['’"]?\s+was\s+not\s+declared\s+in\s+this\s+scope/i,
      // Clang's, including its "did you mean 'std::cout'?" note.
      /use\s+of\s+undeclared\s+identifier\s+['‘"](cout|cin|endl|string|vector)['’"]/i,
      /did\s+you\s+mean\s+['‘"]std::/i,
      /is\s+defined\s+in\s+header\s+['‘"]?</i,
      /did\s+you\s+forget\s+to\s+['‘"]?#\s*include/i,
      /no\s+member\s+named\s+['‘"]\w+['’"]\s+in\s+namespace\s+['‘"]?std/i,
      // Both, when the header is the real problem.
      /['‘"]?iostream['’"]?:?\s*No\s+such\s+file/i,
      /fatal\s+error:\s*\w+(\.h)?:\s*No\s+such\s+file\s+or\s+directory/i,
    ],
    meaning:
      "The name exists in C++ but not here: either `using namespace std;` is missing from the " +
      "top of the file, or `#include <iostream>` is. Both are part of the frame the course GIVES " +
      "them, so the usual cause is that a line of the frame was deleted or mistyped, not that " +
      "they need to learn namespaces.",
    teach:
      "Point at the first two lines of their file and ask what is different from the frame they " +
      "were given. Do not teach namespaces — that is not what this month is about.",
  },
  {
    kind: "unbalanced_braces",
    shapes: [
      /expected\s+['‘"]?\}['’"]?/i,
      /expected\s+declaration/i,
      /expected\s+unqualified-id\s+at\s+end\s+of\s+input/i,
      /expected\s+['‘"]?\}['’"]?\s+at\s+end\s+of\s+input/i,
      /(to\s+match\s+this|matching)\s+['‘"]?\{/i,
      /at\s+end\s+of\s+input/i,
    ],
    meaning:
      "The { and } do not pair up. The line named is usually where the compiler RAN OUT of " +
      "program, not where the pairing broke — but both engines then print `note: to match this " +
      "'{'`, and THAT names the brace that was never closed.",
    teach:
      "If the 'to match this' note is in the stderr you were given, use the line IT names: the " +
      "compiler already found the unclosed brace, so do not guess past it. Otherwise have them " +
      "count braces from the top, or read the indentation for the first line that surprises them.",
  },
  {
    kind: "invalid_operands",
    shapes: [
      // Clang
      /invalid\s+operands\s+to\s+binary\s+expression/i,
      // GCC
      /invalid\s+operands\s+of\s+types?\s+.*\s+to\s+binary\s+['‘"]?operator/i,
      /no\s+match\s+for\s+['‘"]?operator[+\-*/%]/i,
      /invalid\s+conversion\s+from/i,
      /cannot\s+convert\s+['‘"].+['’"]\s+to\s+['‘"]/i,
      /* `"5" + 5`, which is the trap this family exists for and is NOT what a
         Python learner expects. It is not a type error at all — it is pointer
         arithmetic on a string literal, so it builds and prints rubbish — and
         Clang says so under its own warning name rather than under any of the
         phrasings above. */
      /-Wstring-plus-int/,
      /adding\s+['‘"]?\w+['’"]?\s+to\s+a\s+string\s+does\s+not\s+append/i,
    ],
    meaning:
      "Two values of types that have no such operation between them. In September this is nearly " +
      "always text meeting a number. C++ will not convert for them the way Python did — and the " +
      'worst case is `"5" + 5`, which is NOT an error: it is arithmetic on the address of the ' +
      "text, so it builds, runs, and prints rubbish or nothing.",
    teach:
      "Ask what TYPE each side of the operator holds. Naming the two types out loud is usually " +
      "the whole hint; the vocabulary word is the type of a variable.",
  },
  {
    kind: "no_matching_function",
    shapes: [
      /no\s+matching\s+function\s+for\s+call\s+to/i,
      /no\s+matching\s+(constructor|member\s+function)/i,
      /candidate\s+(template\s+)?ignored:\s+deduced\s+conflicting\s+types/i,
      /deduced\s+conflicting\s+types\s+for\s+parameter/i,
      /no\s+matching\s+function\s+for\s+call\s+to\s+['‘"]?(max|min)/i,
    ],
    meaning:
      "A function was called with argument types it does not accept. The one that bites this " +
      "course is max/min with TWO DIFFERENT TYPES — max(a, b) where a is int and b is double " +
      "does not compile, because both arguments must be the same type. The compiler explains " +
      "this as 'deduced conflicting types', which tells a beginner nothing.",
    teach:
      "Name the two types they passed and say the function needs them to match. Do not explain " +
      "templates — the learner has not been taught them and will not be this year.",
  },
  {
    kind: "no_stream_operator",
    shapes: [
      /no\s+match\s+for\s+['‘"]?operator(<<|>>)/i,
      /invalid\s+operands\s+to\s+binary\s+expression\s+\(['‘"]?std::(ostream|istream|basic_)/i,
      /no\s+viable\s+overloaded\s+['‘"]?operator(<<|>>)/i,
    ],
    meaning:
      "cout << or cin >> was handed something it does not know how to print or read. Usually the " +
      "arrows point the wrong way (cin << instead of cin >>), or a whole expression is missing " +
      "its parentheses.",
    teach:
      "Ask which direction the arrows should point: << pushes INTO cout, >> pulls OUT of cin. " +
      "That picture fixes it more reliably than the diagnostic does.",
  },
  {
    kind: "bad_initialisation",
    shapes: [
      /cannot\s+initialize\s+a\s+variable\s+of\s+type/i,
      /invalid\s+conversion\s+from\s+['‘"]const\s+char\s?\*['’"]/i,
      /incompatible\s+(integer|pointer)\s+to\s+/i,
      /narrowing\s+conversion/i,
    ],
    meaning:
      "A variable was given a starting value of an unrelated type — int x = \"5\"; is the classic. " +
      "In Python the name simply took whatever it was given; in C++ the type is fixed at the " +
      "declaration and the value has to fit it.",
    teach:
      "Point at the declared type and at the value, and ask whether those are the same kind of " +
      "thing. This is the moment declared types finally make sense to a beginner; use it.",
  },
  {
    kind: "missing_main",
    shapes: [
      /undefined\s+(reference|symbol)\s*(to\s+)?:?\s*[`'‘"]?_?main\b/i,
      /entry\s+point\s+not\s+found/i,
      /entry\s+symbol\s+not\s+defined/i,
      /['‘"]?main['’"]?\s+must\s+return\s+['‘"]?int/i,
    ],
    meaning:
      "The program compiled but there is nothing to start: int main() is missing, misspelled, or " +
      "declared with a different return type. This comes from the LINKER, after compiling, which " +
      "is why it names no line at all.",
    teach:
      "Say that this one has no line number because it is about the whole program, and point at " +
      "the int main() line of the frame.",
  },
  {
    kind: "assignment_in_condition",
    shapes: [
      /using\s+the\s+result\s+of\s+an\s+assignment\s+as\s+a\s+condition/i,
      /suggest\s+parentheses\s+around\s+assignment\s+used\s+as\s+truth\s+value/i,
      /-Wparentheses/,
    ],
    meaning:
      "if (a = b) assigns instead of comparing. It COMPILES — this is a warning, not an error — " +
      "so the program runs and quietly does the wrong thing, which is worse than not building.",
    teach:
      "One = puts a value in; two == asks a question. Ask them to read their condition out loud " +
      "as a question and see whether it is one.",
  },
  {
    kind: "uninitialised_variable",
    shapes: [
      /is\s+uninitialized\s+when\s+used\s+here/i,
      /may\s+be\s+used\s+uninitialized/i,
      /-Wuninitialized/,
    ],
    meaning:
      "A variable was declared but nothing was ever put in it before it was read. C++ does not " +
      "start it at zero; it holds whatever was in that memory, so the program produces a " +
      "different wrong answer each run. Again a warning, so it builds and runs.",
    teach:
      "Ask what value they think is in it at that line, and where it was put there. The answer " +
      "'nowhere' is the bug.",
  },
];

/** Header for the section. Exported so `PROMPT_MARKERS` can reuse it. */
export const DIAGNOSTIC_PROMPT_HEADING =
  "THE COMPILER SAID SOMETHING — what it means, and what it is lying about";

/**
 * How many families are explained on one turn.
 *
 * One missing semicolon can produce a dozen diagnostics, and a prompt that
 * explains all of them has spent its budget teaching the model about a cascade
 * instead of telling it to look at the first error. Three is enough to
 * distinguish "a semicolon and its wreckage" from "two unrelated problems".
 */
const MAX_EXPLAINED = 3;

/**
 * Which families this text contains.
 *
 * Returns kinds in table order and never duplicates. The input is the learner's
 * own stderr and NOTHING from it is returned — the output is drawn entirely
 * from the closed union above, which is what makes it safe to render into the
 * trusted half of the prompt.
 */
export function recogniseDiagnostics(text: string | null | undefined): CompilerDiagnosticKind[] {
  if (typeof text !== "string" || !text.trim()) return [];
  /* Bounded before matching. stderr is already clamped upstream, but a regex
     list run over an unbounded string on a request path a learner is waiting on
     is a cost nobody has budgeted, and the diagnostics are at the front. */
  const window = text.slice(0, 4000);
  const found: CompilerDiagnosticKind[] = [];
  for (const d of COMPILER_DIAGNOSTICS) {
    if (d.shapes.some((s) => s.test(window))) found.push(d.kind);
  }
  return found;
}

/**
 * True when this looks like a compiler talking rather than a program.
 *
 * Used to decide whether the section is worth its characters at all: a run that
 * printed a stack of its own text to stderr is not a compile failure, and the
 * status the browser reported is the better signal. This is the backstop for
 * the case where it is absent.
 */
export function looksLikeCompilerOutput(text: string | null | undefined): boolean {
  if (typeof text !== "string") return false;
  return /(^|\n)[^\n]*\b(error|warning|fatal error)\s*:/i.test(text.slice(0, 4000));
}

/**
 * The families, said to the model.
 *
 * Constants only. Every character returned here is declared in this file, so
 * the section carries the system message's authority without carrying anything
 * the learner wrote.
 */
export function diagnosticPromptLines(kinds: readonly CompilerDiagnosticKind[]): string[] {
  if (!kinds.length) return [];
  const byKind = new Map(COMPILER_DIAGNOSTICS.map((d) => [d.kind, d]));
  const lines: string[] = [
    "",
    DIAGNOSTIC_PROMPT_HEADING,
    "- The learner cannot read this diagnostic. It is English, it names a column, and it is",
    "  the reason they opened this panel. Translating it into their language, in one or two",
    "  sentences, is the most useful thing you can do on this turn.",
    "- Explain the FIRST error only. Everything after it is usually wreckage from that one.",
    "- Use the line number from the diagnostic IN FRONT OF YOU, never one you calculate. A",
    "  compiler names where it NOTICED, not always where the mistake is, and the two engines",
    "  stop in different places on the same file. Read their code at that line and around it.",
    "- Never say 'compilation error' and stop. Say what the compiler wanted at that point.",
  ];

  for (const kind of kinds.slice(0, MAX_EXPLAINED)) {
    const d = byKind.get(kind);
    if (!d) continue;
    lines.push(`- ${d.meaning}`, `  ${d.teach}`);
  }

  if (kinds.length > MAX_EXPLAINED) {
    lines.push(
      "- There are more errors than that. Do not list them. Fix the first and the rest",
      "  usually go with it; say so, because a wall of red is what makes a beginner give up.",
    );
  }

  return lines;
}
