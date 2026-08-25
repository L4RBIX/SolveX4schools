"use client";

import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  Folder,
  FolderOpen,
  Lightbulb,
  LoaderCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RotateCcw,
  Send,
  SquareTerminal,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { CODING_TASK, type CodeFile } from "./lxp-data";
import { TestResults, type TestRow } from "./test-results";

/**
 * Elice coding workspace: file explorer, editable + highlighted Python buffer,
 * task/hint panel, console drawer and a graded test run.
 *
 * Highlighting is a small local tokenizer that builds React nodes — no
 * dangerouslySetInnerHTML anywhere near learner-editable text.
 */

const EASE_OUT_QUINT = [0.23, 1, 0.32, 1] as const;

const KEYWORDS = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await", "break",
  "class", "continue", "def", "del", "elif", "else", "except", "finally",
  "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal",
  "not", "or", "pass", "raise", "return", "try", "while", "with", "yield",
]);

const BUILTINS = new Set([
  "abs", "all", "any", "bool", "dict", "enumerate", "float", "int", "len",
  "list", "max", "min", "print", "range", "reversed", "round", "set",
  "sorted", "str", "sum", "tuple", "type", "zip", "self",
]);

const TOKEN_SOURCE =
  "(#[^\\n]*)|(\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*')|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_][A-Za-z0-9_]*)";

const STRING_CLASS = "text-[#0FA968]";
const NUMBER_CLASS = "text-[#C2410C]";
const COMMENT_CLASS = "text-e-faint italic";

/** Tokenise one line of Python into coloured React nodes. */
function highlightLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = new RegExp(TOKEN_SOURCE, "g");
  let cursor = 0;
  let key = 0;
  let match = regex.exec(line);

  while (match !== null) {
    if (match[0].length === 0) {
      regex.lastIndex += 1;
      match = regex.exec(line);
      continue;
    }
    if (match.index > cursor) nodes.push(line.slice(cursor, match.index));

    const text = match[0];
    let className = "";
    if (match[1]) className = COMMENT_CLASS;
    else if (match[2]) className = STRING_CLASS;
    else if (match[3]) className = NUMBER_CLASS;
    else if (match[4]) {
      if (KEYWORDS.has(text)) className = "text-e-violet";
      else if (BUILTINS.has(text)) className = "text-e-blue";
    }

    if (className) {
      nodes.push(
        <span key={key++} className={className}>
          {text}
        </span>,
      );
    } else {
      nodes.push(text);
    }

    cursor = match.index + text.length;
    match = regex.exec(line);
  }

  if (cursor < line.length) nodes.push(line.slice(cursor));
  return nodes;
}

type RunStatus = "idle" | "running" | "ran" | "grading" | "passed" | "failed";

export function CodeEditor() {
  const reduce = useReducedMotion();
  const files = CODING_TASK.files;

  const [buffers, setBuffers] = useState<Record<string, string>>(() =>
    Object.fromEntries(files.map((file) => [file.id, file.content])),
  );
  const [openIds, setOpenIds] = useState<string[]>(["main"]);
  const [activeId, setActiveId] = useState<string | null>("main");
  const [folderOpen, setFolderOpen] = useState(true);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [tests, setTests] = useState<TestRow[] | null>(null);
  const [hints, setHints] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    timers.current.push(setTimeout(fn, delay));
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    const node = consoleRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [consoleLines]);

  const activeFile = useMemo(
    () => files.find((file) => file.id === activeId) ?? null,
    [activeId, files],
  );

  const dirty = useMemo(
    () =>
      Object.fromEntries(
        files.map((file) => [file.id, buffers[file.id] !== file.content]),
      ) as Record<string, boolean>,
    [buffers, files],
  );

  const openFile = (id: string) => {
    setOpenIds((current) => (current.includes(id) ? current : [...current, id]));
    setActiveId(id);
    setDrawerOpen(false);
  };

  const closeFile = (id: string) => {
    setOpenIds((current) => {
      const next = current.filter((openId) => openId !== id);
      if (id === activeId) setActiveId(next[next.length - 1] ?? null);
      return next;
    });
  };

  const run = () => {
    clearTimers();
    setTests(null);
    setConsoleLines([]);
    setConsoleOpen(true);
    setStatus("running");

    if (reduce) {
      setConsoleLines(CODING_TASK.consoleOutput);
      setStatus("ran");
      return;
    }

    CODING_TASK.consoleOutput.forEach((line, index) => {
      schedule(
        () => setConsoleLines((current) => [...current, line]),
        (index + 1) * 200,
      );
    });
    schedule(() => setStatus("ran"), CODING_TASK.consoleOutput.length * 200 + 120);
  };

  const submit = () => {
    clearTimers();
    setConsoleOpen(true);
    setStatus("grading");

    const pending: TestRow[] = CODING_TASK.tests.map((test) => ({
      id: test.id,
      name: test.name,
      expected: test.expected,
      received: test.received,
      runtimeMs: test.runtimeMs,
      state: "pending",
    }));
    const settled: TestRow[] = CODING_TASK.tests.map((test, index) => ({
      ...pending[index],
      state: test.passes ? "passed" : "failed",
    }));
    const allPassed = CODING_TASK.tests.every((test) => test.passes);
    const resultLines = [
      "$ pytest tests/test_moves.py -q",
      ...CODING_TASK.tests.map(
        (test) =>
          `${test.passes ? "PASS" : "FAIL"}  ${test.name} (${test.runtimeMs} ms)`,
      ),
    ];

    if (reduce) {
      setTests(settled);
      setConsoleLines(resultLines);
      setStatus(allPassed ? "passed" : "failed");
      return;
    }

    setTests(pending);
    setConsoleLines([resultLines[0]]);

    CODING_TASK.tests.forEach((test, index) => {
      schedule(
        () =>
          setTests((current) =>
            current
              ? current.map((row) =>
                  row.id === test.id ? { ...row, state: "running" } : row,
                )
              : current,
          ),
        index * 280 + 140,
      );
      schedule(() => {
        setTests((current) =>
          current
            ? current.map((row) =>
                row.id === test.id
                  ? { ...row, state: test.passes ? "passed" : "failed" }
                  : row,
              )
            : current,
        );
        setConsoleLines((current) => [...current, resultLines[index + 1]]);
      }, index * 280 + 420);
    });

    schedule(
      () => setStatus(allPassed ? "passed" : "failed"),
      CODING_TASK.tests.length * 280 + 520,
    );
  };

  const reset = () => {
    clearTimers();
    setBuffers(Object.fromEntries(files.map((file) => [file.id, file.content])));
    setConsoleLines([]);
    setConsoleOpen(false);
    setTests(null);
    setStatus("idle");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1440px] min-w-0 flex-col gap-4 lg:h-[calc(100vh-8.5rem)]">
      <div
        className={cn(
          "grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_290px]",
          explorerOpen
            ? "xl:grid-cols-[210px_minmax(0,1fr)_300px]"
            : "xl:grid-cols-[52px_minmax(0,1fr)_300px]",
        )}
      >
        {/* Explorer — its own column from xl, a drawer below that */}
        <div className="hidden min-h-0 min-w-0 xl:block">
          <Explorer
            files={files}
            activeId={activeId}
            dirty={dirty}
            folderOpen={folderOpen}
            collapsed={!explorerOpen}
            onToggleFolder={() => setFolderOpen((value) => !value)}
            onToggleCollapse={() => setExplorerOpen((value) => !value)}
            onOpen={openFile}
          />
        </div>

        {/* Editor */}
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-e-line bg-e-white">
          <div className="flex items-center gap-1 border-b border-e-line bg-e-grey pr-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Show files"
              className="flex min-h-[44px] shrink-0 items-center gap-2 border-r border-e-line px-3 text-[13px] font-semibold text-e-muted transition-colors hover:text-e-ink xl:hidden"
            >
              <FolderOpen className="size-4" aria-hidden="true" />
              Files
            </button>

            <ul className="flex min-w-0 flex-1 overflow-x-auto">
              {openIds.map((id) => {
                const file = files.find((item) => item.id === id);
                if (!file) return null;
                const active = id === activeId;
                return (
                  <li key={id} className="shrink-0">
                    <span
                      className={cn(
                        "flex min-h-[44px] items-center gap-2 border-r border-e-line pr-1 pl-3 text-[13px]",
                        active
                          ? "bg-e-white font-semibold text-e-ink"
                          : "text-e-muted hover:text-e-ink",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveId(id)}
                        aria-current={active ? "true" : undefined}
                        className="flex items-center gap-2 py-2"
                      >
                        <FileCode2 className="size-3.5 text-e-faint" aria-hidden="true" />
                        {file.name}
                        {dirty[id] ? (
                          <span
                            className="size-1.5 rounded-full bg-e-violet"
                            aria-label="Unsaved changes"
                          />
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => closeFile(id)}
                        aria-label={`Close ${file.name}`}
                        className="grid size-11 place-items-center rounded-md text-e-faint transition-colors hover:bg-e-grey-2 hover:text-e-ink"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>

            {activeFile?.readOnly ? (
              <span className="shrink-0 rounded-full bg-e-grey-2 px-2.5 py-1 text-[11px] font-semibold text-e-muted">
                Read-only
              </span>
            ) : null}
          </div>

          {activeFile ? (
            <Buffer
              file={activeFile}
              value={buffers[activeFile.id] ?? ""}
              onChange={(next) =>
                setBuffers((current) => ({ ...current, [activeFile.id]: next }))
              }
              onRun={run}
            />
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <p className="text-[15px] text-e-muted">
                No file open. Pick one from the explorer.
              </p>
            </div>
          )}

          <ConsoleDrawer
            ref={consoleRef}
            open={consoleOpen}
            lines={consoleLines}
            busy={status === "running" || status === "grading"}
            onToggle={() => setConsoleOpen((value) => !value)}
          />

          {tests ? (
            <div className="max-h-[220px] shrink-0 overflow-y-auto border-t border-e-line">
              <TestResults rows={tests} className="rounded-none border-0" />
            </div>
          ) : null}
        </div>

        {/* Task + hints */}
        <div className="flex min-w-0 flex-col gap-4 overflow-y-auto md:min-h-0">
          <TaskCard />
          <HintCard
            revealed={hints}
            total={CODING_TASK.hints.length}
            onReveal={() => setHints((value) => Math.min(value + 1, CODING_TASK.hints.length))}
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-e-line bg-e-white/95 p-3 backdrop-blur">
        <button
          type="button"
          onClick={run}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-e-line bg-e-white px-5 text-[15px] font-semibold text-e-ink transition-colors duration-200 hover:bg-e-grey"
        >
          <Play className="size-4" aria-hidden="true" />
          Run
        </button>
        <button
          type="button"
          onClick={submit}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-e-violet px-6 text-[15px] font-semibold text-e-white transition-colors duration-200 hover:bg-e-violet-2"
        >
          <Send className="size-4" aria-hidden="true" />
          Submit
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-[15px] font-semibold text-e-muted transition-colors duration-200 hover:text-e-ink"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset
        </button>
        <StatusChip status={status} tests={tests} />
      </div>

      {/* Mobile / tablet file drawer */}
      <FileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Explorer
          files={files}
          activeId={activeId}
          dirty={dirty}
          folderOpen={folderOpen}
          collapsed={false}
          onToggleFolder={() => setFolderOpen((value) => !value)}
          onOpen={openFile}
        />
      </FileDrawer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

interface ExplorerProps {
  files: CodeFile[];
  activeId: string | null;
  dirty: Record<string, boolean>;
  folderOpen: boolean;
  collapsed: boolean;
  onToggleFolder: () => void;
  onToggleCollapse?: () => void;
  onOpen: (id: string) => void;
}

function Explorer({
  files,
  activeId,
  dirty,
  folderOpen,
  collapsed,
  onToggleFolder,
  onToggleCollapse,
  onOpen,
}: ExplorerProps) {
  const rootFiles = files.filter((file) => file.folder === "");
  const folders = Array.from(
    new Set(files.filter((file) => file.folder !== "").map((file) => file.folder)),
  );

  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-center rounded-xl border border-e-line bg-e-white py-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand file explorer"
          aria-expanded={false}
          className="grid size-11 place-items-center rounded-lg text-e-muted transition-colors hover:bg-e-grey hover:text-e-ink"
        >
          <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-e-line bg-e-white">
      <div className="flex min-h-[44px] items-center gap-2 border-b border-e-line px-3">
        <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-e-ink">
          {CODING_TASK.projectName}
        </span>
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse file explorer"
            aria-expanded
            className="grid size-11 shrink-0 place-items-center rounded-lg text-e-faint transition-colors hover:bg-e-grey hover:text-e-ink"
          >
            <PanelLeftClose className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Project files">
        <ul className="flex flex-col gap-0.5">
          {rootFiles.map((file) => (
            <li key={file.id}>
              <FileRow
                file={file}
                active={file.id === activeId}
                dirty={Boolean(dirty[file.id])}
                onOpen={onOpen}
              />
            </li>
          ))}

          {folders.map((folder) => (
            <li key={folder}>
              <button
                type="button"
                onClick={onToggleFolder}
                aria-expanded={folderOpen}
                className="flex min-h-[36px] w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-e-ink transition-colors hover:bg-e-grey"
              >
                {folderOpen ? (
                  <ChevronDown className="size-3.5 shrink-0 text-e-faint" aria-hidden="true" />
                ) : (
                  <ChevronRight className="size-3.5 shrink-0 text-e-faint" aria-hidden="true" />
                )}
                {folderOpen ? (
                  <FolderOpen className="size-4 shrink-0 text-e-violet" aria-hidden="true" />
                ) : (
                  <Folder className="size-4 shrink-0 text-e-faint" aria-hidden="true" />
                )}
                <span className="truncate">{folder}/</span>
              </button>

              <AnimatePresence initial={false}>
                {folderOpen ? (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: EASE_OUT_QUINT }}
                    className="overflow-hidden pl-4"
                  >
                    {files
                      .filter((file) => file.folder === folder)
                      .map((file) => (
                        <li key={file.id}>
                          <FileRow
                            file={file}
                            active={file.id === activeId}
                            dirty={Boolean(dirty[file.id])}
                            onOpen={onOpen}
                          />
                        </li>
                      ))}
                  </motion.ul>
                ) : null}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function FileRow({
  file,
  active,
  dirty,
  onOpen,
}: {
  file: CodeFile;
  active: boolean;
  dirty: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(file.id)}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex min-h-[36px] w-full items-center gap-2 rounded-r-lg py-1.5 pr-2 pl-2 text-left text-[13px] transition-colors duration-200",
        active
          ? "border-l-2 border-e-violet bg-e-violet-soft font-semibold text-e-violet"
          : "border-l-2 border-transparent text-e-ink hover:bg-e-grey",
      )}
    >
      <FileCode2
        className={cn("size-4 shrink-0", active ? "text-e-violet" : "text-e-faint")}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">{file.name}</span>
      {dirty ? (
        <span className="size-1.5 shrink-0 rounded-full bg-e-violet" aria-label="Unsaved changes" />
      ) : null}
    </button>
  );
}

/* -------------------------------------------------------------------------- */

function Buffer({
  file,
  value,
  onChange,
  onRun,
}: {
  file: CodeFile;
  value: string;
  onChange: (next: string) => void;
  onRun: () => void;
}) {
  const lines = value.split("\n");
  const fieldId = useId();

  return (
    <div className="relative min-h-0 flex-1 overflow-auto bg-e-white">
      <div className="flex min-h-full w-max min-w-full">
        <div
          aria-hidden="true"
          className="sticky left-0 z-10 shrink-0 border-r border-e-line bg-e-grey px-3 py-3 text-right font-mono text-[13px] leading-[22px] text-e-faint select-none"
        >
          {lines.map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>

        <div className="relative min-h-full flex-1">
          <pre
            aria-hidden={file.readOnly ? undefined : "true"}
            className="px-4 py-3 font-mono text-[13px] leading-[22px] whitespace-pre text-e-ink"
          >
            {lines.map((line, index) => (
              <span key={index}>
                {highlightLine(line)}
                {"\n"}
              </span>
            ))}
          </pre>

          {file.readOnly ? null : (
            <>
              <label htmlFor={fieldId} className="sr-only">
                {file.name} source code
              </label>
              <textarea
                id={fieldId}
                value={value}
                spellCheck={false}
                wrap="off"
                autoCapitalize="off"
                autoCorrect="off"
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    onRun();
                  }
                }}
                className="absolute inset-0 size-full resize-none overflow-hidden bg-transparent px-4 py-3 font-mono text-[13px] leading-[22px] whitespace-pre text-transparent caret-e-ink outline-none selection:bg-e-violet/20"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

interface ConsoleDrawerProps {
  open: boolean;
  lines: string[];
  busy: boolean;
  onToggle: () => void;
  ref: React.Ref<HTMLDivElement>;
}

function ConsoleDrawer({ open, lines, busy, onToggle, ref }: ConsoleDrawerProps) {
  const reduce = useReducedMotion();
  const panelId = useId();

  return (
    <div className="shrink-0 border-t border-e-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-[44px] w-full items-center gap-2 px-3 text-[13px] font-semibold text-e-muted transition-colors hover:text-e-ink"
      >
        <SquareTerminal className="size-4" aria-hidden="true" />
        Console
        {busy ? (
          <LoaderCircle className="size-3.5 animate-spin text-e-violet" aria-hidden="true" />
        ) : null}
        <ChevronDown
          className={cn("ml-auto size-4 transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: EASE_OUT_QUINT }}
            className="overflow-hidden"
          >
            <div
              ref={ref}
              className="max-h-[140px] overflow-auto bg-e-dark px-4 py-3 font-mono text-[12px] leading-[20px] text-[#5BE49B]"
              aria-live="polite"
            >
              {lines.length === 0 ? (
                <p className="text-white/40">Press Run to execute main.py.</p>
              ) : (
                lines.map((line, index) => (
                  <p key={`${index}-${line}`} className="whitespace-pre-wrap">
                    {line}
                  </p>
                ))
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function TaskCard() {
  return (
    <section className="rounded-xl border border-e-line bg-e-white p-5">
      <p className="text-[13px] font-semibold text-e-violet">{CODING_TASK.language}</p>
      <h2 className="mt-1 text-[17px] font-bold text-e-ink">{CODING_TASK.title}</h2>
      <p className="mt-2 text-[15px] leading-[1.6] text-e-muted">{CODING_TASK.statement}</p>

      <h3 className="mt-4 text-[13px] font-bold tracking-[0.04em] text-e-faint uppercase">
        Constraints
      </h3>
      <ul className="mt-2 flex flex-col gap-1.5">
        {CODING_TASK.constraints.map((constraint) => (
          <li key={constraint} className="flex gap-2 text-[13px] text-e-muted">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-e-faint" aria-hidden="true" />
            <span className="font-mono">{constraint}</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-4 text-[13px] font-bold tracking-[0.04em] text-e-faint uppercase">
        Example
      </h3>
      <dl className="mt-2 overflow-hidden rounded-lg border border-e-line">
        <div className="flex gap-3 border-b border-e-line bg-e-grey px-3 py-2">
          <dt className="w-16 shrink-0 text-[12px] font-semibold text-e-faint">Input</dt>
          <dd className="min-w-0 font-mono text-[13px] break-all text-e-ink">
            {CODING_TASK.example.input}
          </dd>
        </div>
        <div className="flex gap-3 px-3 py-2">
          <dt className="w-16 shrink-0 text-[12px] font-semibold text-e-faint">Output</dt>
          <dd className="min-w-0 font-mono text-[13px] break-all text-e-ink">
            {CODING_TASK.example.output}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function HintCard({
  revealed,
  total,
  onReveal,
}: {
  revealed: number;
  total: number;
  onReveal: () => void;
}) {
  const reduce = useReducedMotion();
  const done = revealed >= total;

  return (
    <section className="rounded-xl border border-e-violet/25 bg-e-violet-soft p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-e-violet text-e-white">
          <Lightbulb className="size-4" aria-hidden="true" />
        </span>
        <h2 className="text-[17px] font-bold text-e-ink">AI hint</h2>
        <span className="ml-auto text-[13px] text-e-muted">
          {revealed} / {total}
        </span>
      </div>

      <p className="mt-2 text-[13px] leading-[1.6] text-e-muted">
        Each press gives you one more, and each one is more specific than the last.
      </p>

      <ul className="mt-3 flex flex-col gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {CODING_TASK.hints.slice(0, revealed).map((hint, index) => (
            <motion.li
              key={hint}
              initial={reduce ? false : { opacity: 0, y: 8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: reduce ? 0 : 0.3, ease: EASE_OUT_QUINT }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-e-violet/20 bg-e-white p-3">
                <p className="text-[12px] font-bold text-e-violet">Hint {index + 1}</p>
                <p className="mt-1 font-mono text-[13px] leading-[1.6] text-e-ink">{hint}</p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <button
        type="button"
        onClick={onReveal}
        disabled={done}
        className={cn(
          "mt-3 flex min-h-[44px] w-full items-center justify-center rounded-lg px-5 text-[15px] font-semibold transition-colors duration-200",
          done
            ? "cursor-not-allowed bg-e-grey-2 text-e-faint"
            : "bg-e-violet text-e-white hover:bg-e-violet-2",
        )}
      >
        {done ? "No hints left" : revealed === 0 ? "Get a hint" : "Next hint"}
      </button>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function StatusChip({ status, tests }: { status: RunStatus; tests: TestRow[] | null }) {
  const failed = tests?.filter((row) => row.state === "failed").length ?? 0;

  const map: Record<RunStatus, { label: string; className: string; busy?: boolean }> = {
    idle: { label: "Not run yet", className: "bg-e-grey-2 text-e-muted" },
    running: { label: "Running…", className: "bg-e-violet-soft text-e-violet", busy: true },
    ran: { label: "Ran · exit 0", className: "bg-[#0FA968]/10 text-[#0A7F4E]" },
    grading: { label: "Grading…", className: "bg-e-violet-soft text-e-violet", busy: true },
    passed: { label: "All tests passed", className: "bg-[#0FA968]/10 text-[#0A7F4E]" },
    failed: {
      label: `${failed} test${failed === 1 ? "" : "s"} failed`,
      className: "bg-[#E5484D]/10 text-[#B4292D]",
    },
  };

  const chip = map[status];

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "ml-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-semibold",
        chip.className,
      )}
    >
      {chip.busy ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : null}
      {chip.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */

function FileDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <motion.button
            type="button"
            aria-label="Close file list"
            onClick={onClose}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-e-ink/40"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Project files"
            tabIndex={-1}
            initial={reduce ? false : { x: -280 }}
            animate={{ x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: -280 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: EASE_OUT_QUINT }}
            className="absolute inset-y-0 left-0 w-[260px] max-w-[85vw] bg-e-white p-3 outline-none"
          >
            <button
              type="button"
              onClick={onClose}
              className="mb-2 flex min-h-[44px] w-full items-center justify-between rounded-lg px-2 text-[13px] font-semibold text-e-muted hover:text-e-ink"
            >
              Close
              <X className="size-4" aria-hidden="true" />
            </button>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
