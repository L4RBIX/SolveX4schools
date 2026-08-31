"use client";

import { Check, ChevronDown, LoaderCircle, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Submission result panel for the coding workspace: a pass count, a segmented
 * summary bar, one row per test case, and a feedback strip.
 */

export type TestState = "pending" | "running" | "passed" | "failed";

export interface TestRow {
  id: string;
  name: string;
  expected: string;
  received: string;
  runtimeMs: number;
  state: TestState;
}

export interface TestResultsProps {
  rows: TestRow[];
  className?: string;
}

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

const SEGMENT: Record<TestState, string> = {
  pending: "bg-e-grey-2",
  running: "bg-e-violet-2",
  passed: "bg-[#0FA968]",
  failed: "bg-[#E5484D]",
};

export function TestResults({ rows, className }: TestResultsProps) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const passed = rows.filter((row) => row.state === "passed").length;
  const failed = rows.filter((row) => row.state === "failed").length;
  const settled = rows.every(
    (row) => row.state === "passed" || row.state === "failed",
  );

  const summary = settled
    ? failed === 0
      ? `All ${rows.length} tests passed. Submitted for grading.`
      : `${failed} test${failed === 1 ? "" : "s"} failed. Check the loop bounds.`
    : `Running tests: ${passed} of ${rows.length} passed so far.`;

  return (
    <section
      className={cn("rounded-xl border border-e-line bg-e-white p-4", className)}
      aria-label="Test results"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[17px] font-bold text-e-ink">Tests</h3>
        <span className="text-[13px] font-semibold text-e-muted">
          {passed} / {rows.length} passed
        </span>
      </div>

      <div className="mt-3 flex h-1.5 gap-1" aria-hidden="true">
        {rows.map((row) => (
          <span
            key={row.id}
            className={cn("flex-1 rounded-full transition-colors duration-300", SEGMENT[row.state])}
          />
        ))}
      </div>

      <ul className="mt-3 flex flex-col">
        {rows.map((row) => {
          const open = overrides[row.id] ?? row.state === "failed";
          const expandable = row.state === "failed";

          return (
            <li key={row.id} className="border-b border-e-line last:border-b-0">
              <RowHeader
                row={row}
                open={open}
                expandable={expandable}
                onToggle={() =>
                  setOverrides((current) => ({ ...current, [row.id]: !open }))
                }
              />

              <AnimatePresence initial={false}>
                {expandable && open ? (
                  <Diff expected={row.expected} received={row.received} />
                ) : null}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      {settled ? (
        <p
          className={cn(
            "mt-3 rounded-lg px-3 py-2.5 text-[13px] leading-[1.5] font-semibold",
            failed === 0
              ? "bg-[#0FA968]/10 text-[#0A7F4E]"
              : "bg-[#E5484D]/10 text-[#B4292D]",
          )}
        >
          {failed === 0
            ? "All tests passed. Submitted for grading."
            : `${failed} test${failed === 1 ? "" : "s"} failed. Check the loop bounds.`}
        </p>
      ) : null}

      <p role="status" aria-live="polite" className="sr-only">
        {summary}
      </p>
    </section>
  );
}

function RowHeader({
  row,
  open,
  expandable,
  onToggle,
}: {
  row: TestRow;
  open: boolean;
  expandable: boolean;
  onToggle: () => void;
}) {
  const content = (
    <>
      <StateIcon state={row.state} />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-left text-[14px]",
          row.state === "pending" ? "text-e-faint" : "text-e-ink",
        )}
      >
        {row.name}
      </span>
      <span className="shrink-0 font-mono text-[12px] text-e-faint">
        {row.state === "pending" ? "—" : `${row.runtimeMs} ms`}
      </span>
      {expandable ? (
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-e-faint transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      ) : null}
    </>
  );

  if (!expandable) {
    return (
      <div className="flex min-h-[44px] items-center gap-3 py-2">{content}</div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex min-h-[44px] w-full items-center gap-3 py-2 text-left"
    >
      {content}
      <span className="sr-only">
        {open ? "Hide" : "Show"} the difference for {row.name}
      </span>
    </button>
  );
}

function Diff({ expected, received }: { expected: string; received: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.26, ease: EASE_OUT_QUINT }}
      className="overflow-hidden"
    >
      <div className="grid gap-2 pb-3 sm:grid-cols-2">
        <DiffBlock label="Expected" value={expected} />
        <DiffBlock label="Received" value={received} />
      </div>
    </motion.div>
  );
}

function DiffBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-[#E5484D] bg-e-grey py-2 pl-3">
      <p className="text-[12px] font-semibold text-e-faint">{label}</p>
      <p className="mt-0.5 font-mono text-[13px] break-all text-e-ink">{value}</p>
    </div>
  );
}

function StateIcon({ state }: { state: TestState }) {
  if (state === "passed") {
    return (
      <span
        className="grid size-5 shrink-0 place-items-center rounded-full bg-[#0FA968]"
        aria-hidden="true"
      >
        <Check className="size-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span
        className="grid size-5 shrink-0 place-items-center rounded-full bg-[#E5484D]"
        aria-hidden="true"
      >
        <X className="size-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (state === "running") {
    return (
      <LoaderCircle
        className="size-5 shrink-0 animate-spin text-e-violet"
        aria-hidden="true"
      />
    );
  }
  return (
    <span
      className="block size-5 shrink-0 rounded-full border border-e-line"
      aria-hidden="true"
    />
  );
}
