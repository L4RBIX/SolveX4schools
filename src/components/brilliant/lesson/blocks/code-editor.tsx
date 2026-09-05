"use client";

import { useEffect, useRef } from "react";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  rectangularSelection,
  crosshairCursor,
  placeholder as cmPlaceholder,
  Decoration,
  type DecorationSet,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentMore,
  indentLess,
  insertNewlineAndIndent,
} from "@codemirror/commands";
import {
  bracketMatching,
  indentUnit,
  syntaxHighlighting,
  HighlightStyle,
  indentOnInput,
  foldGutter,
} from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { cpp } from "@codemirror/lang-cpp";
import { tags as t } from "@lezer/highlight";

/**
 * The C++ editor a fourteen-year-old actually types into.
 *
 * ## What this replaces, and why a textarea was not enough
 *
 * A `<textarea>` with a monospace font. No line numbers, so a diagnostic saying
 * `line 5` was a counting exercise. No highlighting, so `"Сәлем"` and `cout`
 * looked identical. No bracket matching, so a missing `}` was invisible until
 * the compiler said so. And **Tab moved focus out of the editor** — the single
 * most common keystroke in a C++ lesson took the learner to the next button.
 *
 * ## Why CodeMirror 6 and not Monaco
 *
 * Measured, not assumed. Monaco ships its own worker infrastructure and a
 * ~2 MB core before a language service; it is a desktop IDE's editor and this
 * product already spends 57 MB on a compiler. CodeMirror 6 is modular — this
 * file imports exactly seven packages and the C++ grammar — it renders one DOM
 * node per visible line, and it works on a phone, which is where a good part of
 * this class will do their homework. See `docs/DEVELOPMENT.md` for the
 * before/after chunk numbers.
 *
 * ## The Tab decision, in full
 *
 * Inside a code editor Tab MUST indent: that is what every editor a programmer
 * will ever use does, and a learner who cannot indent cannot write a nested
 * `if`. But a Tab that never moves focus is a keyboard trap, and this is a
 * school product where a keyboard is sometimes the only input device.
 *
 * So: Tab indents, Shift+Tab unindents, and **Escape releases the trap** — one
 * press moves focus out of the editor, which is the pattern Monaco, Ace and
 * CodeMirror's own accessibility guidance all use. The instruction is not
 * hidden in documentation: it is rendered under the editor and in the
 * `aria-describedby` text a screen reader announces on focus.
 */

/** Four spaces. The whole curriculum is authored with four. */
export const INDENT = "    ";

/**
 * One compiler error, positioned.
 *
 * `line` is 1-based, as every compiler prints it. `null` means the diagnostic
 * could not be attributed to a line and belongs above the editor as prose
 * instead — never guessed onto line 1, which would point a learner at the
 * `#include` for a mistake three lines down.
 */
export interface EditorDiagnostic {
  line: number | null;
  message: string;
}

/* -------------------------------------------------------------------------- */
/* Theme                                                                      */
/* -------------------------------------------------------------------------- */

/*
 * The product's own dark panel, not `oneDark`.
 *
 * `#12141a` is what `AnswerArea` used and what the Run panel still uses, so the
 * editor and the console below it are one surface rather than two themes
 * stacked. The syntax colours are picked against that ground: a beginner has to
 * read strings and numbers apart at a glance, and the comment colour has to be
 * quiet enough that `// напиши здесь` does not compete with the code.
 */
const theme = EditorView.theme(
  {
    "&": {
      color: "#e8ecf4",
      backgroundColor: "#12141a",
      fontSize: "15px",
      borderRadius: "12px",
    },
    ".cm-content": {
      fontFamily: "var(--font-b-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
      padding: "12px 0",
      caretColor: "#7fd3b4",
      lineHeight: "1.7",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-b-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
      lineHeight: "1.7",
      /* Long lines scroll inside the editor. The page must never scroll
         sideways because a learner pasted a long string. */
      overflow: "auto",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-gutters": {
      backgroundColor: "#12141a",
      color: "#5b6472",
      border: "none",
      paddingRight: "4px",
    },
    ".cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,0.05)", color: "#9aa4b2" },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.035)" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#7fd3b4", borderLeftWidth: "2px" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "rgba(127, 211, 180, 0.25)",
    },
    ".cm-matchingBracket, &.cm-focused .cm-matchingBracket": {
      backgroundColor: "rgba(127, 211, 180, 0.22)",
      outline: "1px solid rgba(127, 211, 180, 0.6)",
    },
    ".cm-nonmatchingBracket": { backgroundColor: "rgba(231, 155, 144, 0.25)" },
    ".cm-placeholder": { color: "rgba(232, 236, 244, 0.35)" },
    /* The line a compiler complained about. A tint plus a left edge, so it is
       legible without colour vision and survives a screenshot. */
    ".cm-diagnostic-line": {
      backgroundColor: "rgba(231, 155, 144, 0.14)",
      boxShadow: "inset 2px 0 0 0 #e79b90",
    },
  },
  { dark: true },
);

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword], color: "#c4a7f5" },
  { tag: [t.typeName, t.standard(t.typeName)], color: "#7fd3b4" },
  { tag: [t.string, t.special(t.string)], color: "#e3c08d" },
  { tag: [t.number, t.bool, t.null], color: "#8fc7f0" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#6b7684", fontStyle: "italic" },
  { tag: [t.processingInstruction, t.meta], color: "#9aa4b2" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "#f0d9a8" },
  { tag: [t.operator, t.punctuation, t.separator, t.bracket], color: "#b6bcc7" },
  { tag: t.invalid, color: "#e79b90" },
]);

/* -------------------------------------------------------------------------- */
/* Diagnostics                                                                */
/* -------------------------------------------------------------------------- */

const setDiagnostics = new Compartment();

function diagnosticExtension(diagnostics: readonly EditorDiagnostic[]): Extension {
  const lines = diagnostics
    .map((d) => d.line)
    .filter((l): l is number => typeof l === "number" && l > 0);
  if (lines.length === 0) return [];

  const mark = Decoration.line({ class: "cm-diagnostic-line" });
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = this.build(view);
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.viewportChanged) this.decorations = this.build(u.view);
      }
      build(view: EditorView): DecorationSet {
        const total = view.state.doc.lines;
        return Decoration.set(
          lines
            /* A diagnostic can name a line the learner has since deleted. Drop
               it rather than throwing inside a view plugin, which would take
               the whole editor down over a stale error message. */
            .filter((n) => n <= total)
            .map((n) => mark.range(view.state.doc.line(n).from)),
          true,
        );
      }
    },
    { decorations: (v) => v.decorations },
  );
}

/* -------------------------------------------------------------------------- */
/* The component                                                              */
/* -------------------------------------------------------------------------- */

export interface CodeEditorProps {
  value: string;
  onChange: (next: string) => void;
  /** Settled work is not editable. The verdict border is drawn by the caller. */
  readOnly?: boolean;
  /** Accessible name — the task, not "code editor". */
  ariaLabel: string;
  /** Rendered under the editor AND announced on focus. Explains Tab/Escape. */
  keyboardHint: string;
  placeholder?: string;
  diagnostics?: readonly EditorDiagnostic[];
  minLines?: number;
}

export default function CodeEditor({
  value,
  onChange,
  readOnly = false,
  ariaLabel,
  keyboardHint,
  placeholder,
  diagnostics = [],
  minLines = 8,
}: CodeEditorProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const view = useRef<EditorView | null>(null);
  /* The latest `onChange` without re-creating the editor on every render — a
     new EditorState per keystroke would lose the cursor, which is the defect
     this whole component exists to avoid. */
  const emit = useRef(onChange);
  emit.current = onChange;

  const editable = new Compartment();

  useEffect(() => {
    if (!host.current || view.current) return;

    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          foldGutter(),
          history(),
          drawSelection(),
          rectangularSelection(),
          crosshairCursor(),
          bracketMatching(),
          closeBrackets(),
          indentOnInput(),
          indentUnit.of(INDENT),
          EditorState.tabSize.of(4),
          cpp(),
          syntaxHighlighting(highlight),
          theme,
          EditorView.lineWrapping,
          placeholder ? cmPlaceholder(placeholder) : [],
          setDiagnostics.of(diagnosticExtension(diagnostics)),
          editable.of([
            EditorView.editable.of(!readOnly),
            EditorState.readOnly.of(readOnly),
          ]),
          keymap.of([
            /*
             * Tab, and the escape hatch that keeps it from being a trap.
             *
             * Before `defaultKeymap`, so these win. `indentMore` on a selection
             * indents every line in it, which is what Shift+Tab's mirror needs
             * to be useful when a learner wraps a block in an `if`.
             */
            {
              key: "Tab",
              preventDefault: true,
              run: indentMore,
              shift: indentLess,
            },
            {
              key: "Escape",
              preventDefault: true,
              run: (target) => {
                /* Focus leaves the editor, so the NEXT Tab moves through the
                   page as it would anywhere else. Blur rather than a manual
                   focus jump: the browser then continues from the editor's
                   place in the document order, which is what a keyboard user
                   expects and what `next` and `previous` both rely on. */
                target.contentDOM.blur();
                return true;
              },
            },
            {
              /* Enter keeps the current indentation and adds one level after an
                 opening brace — `indentOnInput` plus the language's own indent
                 rules. Without this a learner typing `if (x) {` and pressing
                 Enter lands at column 0. */
              key: "Enter",
              run: insertNewlineAndIndent,
            },
            ...closeBracketsKeymap,
            ...historyKeymap,
            ...defaultKeymap,
          ]),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) emit.current(u.state.doc.toString());
          }),
          EditorView.contentAttributes.of({
            "aria-label": ariaLabel,
            /* Announced when focus enters, so the Tab contract is heard rather
               than discovered. */
            "aria-description": keyboardHint,
          }),
          EditorView.theme({ ".cm-content": { minHeight: `${minLines * 1.7}em` } }),
        ],
      }),
    });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
    /* Mount once. Every prop that can change afterwards is applied through the
       effects below, which is what keeps the cursor and the undo history. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The document, when the caller replaces it (a reset, a restored draft, a
     different block). Guarded by a comparison: writing the same text back would
     collapse the selection on every keystroke. */
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const current = v.state.doc.toString();
    if (current === value) return;
    v.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value]);

  useEffect(() => {
    const v = view.current;
    if (!v) return;
    v.dispatch({
      effects: editable.reconfigure([
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly),
      ]),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  useEffect(() => {
    const v = view.current;
    if (!v) return;
    v.dispatch({ effects: setDiagnostics.reconfigure(diagnosticExtension(diagnostics)) });
  }, [diagnostics]);

  return <div ref={host} className="cm-host w-full" />;
}
