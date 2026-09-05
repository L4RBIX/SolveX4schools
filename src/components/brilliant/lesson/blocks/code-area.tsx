"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { LessonVerdict } from "../lesson-verdict";
import type { EditorDiagnostic } from "./code-editor";

/**
 * The code surface a task renders — CodeMirror when it has loaded, a plain
 * editable field until then.
 *
 * ## Why it is loaded this way
 *
 * The editor is ~120 KB of JavaScript that only matters on a lesson page with a
 * code task, and it cannot render on the server: CodeMirror measures the DOM to
 * lay out its gutter. `ssr: false` keeps it out of the server render and out of
 * every other route's bundle; the fallback is a real `<textarea>` with the same
 * value and the same `onChange`, so a learner on a slow school connection can
 * start typing before the editor arrives and keeps what they typed when it does.
 *
 * The fallback is deliberately NOT a spinner. A skeleton where the code should
 * be is the same screen as a broken page to a fourteen-year-old, and this
 * product has already shipped one of those.
 */
const CodeEditor = dynamic(() => import("./code-editor"), {
  ssr: false,
  loading: () => null,
});

export interface CodeAreaProps {
  value: string;
  onChange: (next: string) => void;
  verdict: LessonVerdict;
  /** Settled work: correct or unmeasured. Wrong and partial stay editable. */
  locked: boolean;
  ariaLabel: string;
  keyboardHint: string;
  diagnostics?: readonly EditorDiagnostic[];
  minLines?: number;
}

export function CodeArea({
  value,
  onChange,
  verdict,
  locked,
  ariaLabel,
  keyboardHint,
  diagnostics,
  minLines = 8,
}: CodeAreaProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div
        className={cn(
          "w-full overflow-hidden rounded-[12px] border-2 bg-[#12141a]",
          "transition-colors duration-100",
          "focus-within:border-b-sched-edge-on",
          !locked && "border-b-fg/15",
          locked && verdict === "correct" && "border-b-ok-edge",
          locked && verdict === "unmeasured" && "border-b-lock-edge",
          locked && verdict !== "correct" && verdict !== "unmeasured" && "border-b-lock-edge",
        )}
      >
        <CodeEditor
          value={value}
          onChange={onChange}
          readOnly={locked}
          ariaLabel={ariaLabel}
          keyboardHint={keyboardHint}
          diagnostics={diagnostics}
          minLines={minLines}
        />
        {/*
         * The fallback, and the reason it is a sibling rather than a `loading`
         * component: `next/dynamic`'s loading slot unmounts the moment the
         * chunk lands, which would throw away anything typed into it. This one
         * is hidden by CSS once the editor exists (`.cm-host` is present), so
         * the value is shared state and nothing is lost either way.
         */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={locked}
          spellCheck={false}
          aria-label={ariaLabel}
          rows={Math.max(minLines, value.split("\n").length + 1)}
          className={cn(
            "block w-full resize-y bg-transparent p-4 font-b-mono text-[15px] leading-[26px] text-[#e8ecf4]",
            "focus:outline-none disabled:opacity-70",
            "[.cm-host~&]:hidden",
          )}
        />
      </div>
      <p className="text-[13px] leading-5 text-b-fg/40">{keyboardHint}</p>
    </div>
  );
}
