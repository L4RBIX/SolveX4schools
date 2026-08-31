"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  ChevronsUpDown,
  Check,
  MessageSquare,
  MoreHorizontal,
  Search,
  SearchX,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  BTN_SECONDARY,
  CARD,
  CLASS_META,
  CLASS_SIZE,
  FLOAT_SHADOW,
  ROSTER,
  STATUS_META,
  STATUS_ORDER,
  type Student,
  type StudentStatus,
} from "./teacher-data";

type SortKey = "progress" | "averageScore" | "submitted";
type SortDirection = "asc" | "desc";
type StatusFilter = StudentStatus | "all";

interface StudentTableProps {
  students?: Student[];
  className?: string;
}

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  ...STATUS_ORDER.map((status) => ({
    id: status as StatusFilter,
    label: STATUS_META[status].label,
  })),
];

const MENU_ITEMS = ["View submissions", "Assign practice", "Message guardian"];
const MENU_WIDTH = 200;

export function StudentTable({ students = ROSTER, className }: StudentTableProps) {
  const tableId = useId();
  const reduceMotion = useReducedMotion();

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selected, setSelected] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim().toLowerCase()), 220);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const visible = useMemo(() => {
    const rows = students.filter((student) => {
      const matchesQuery =
        debounced.length === 0 || student.name.toLowerCase().includes(debounced);
      const matchesFilter = filter === "all" || student.status === filter;
      return matchesQuery && matchesFilter;
    });

    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const delta = a[sortKey] - b[sortKey];
      return sortDir === "asc" ? delta : -delta;
    });
  }, [students, debounced, filter, sortKey, sortDir]);

  const visibleIds = visible.map((student) => student.id);
  const selectedVisible = selected.filter((id) => visibleIds.includes(id));
  const allSelected = visible.length > 0 && selectedVisible.length === visible.length;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "desc" ? "asc" : "desc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  };

  const ariaSort = (key: SortKey): "ascending" | "descending" | "none" =>
    sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  const toggleRow = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const toggleAll = () =>
    setSelected((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );

  return (
    <section aria-labelledby={`${tableId}-heading`} className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <h3 id={`${tableId}-heading`} className="text-[17px] font-bold text-e-ink">
            Roster
          </h3>
          <p className="text-[13px] text-e-muted" role="status" aria-live="polite">
            <span className="font-mono tabular-nums">{visible.length}</span> of{" "}
            <span className="font-mono tabular-nums">{CLASS_SIZE}</span> students
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-11 items-center gap-2 rounded-lg border border-e-line bg-e-white px-3 sm:w-64">
            <Search className="size-4 shrink-0 text-e-faint" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search students by name"
              placeholder="Search students"
              className="w-full bg-transparent text-[15px] text-e-ink outline-none placeholder:text-e-faint"
            />
          </div>

          <div
            role="tablist"
            aria-label="Filter roster by status"
            className="flex items-center gap-1 rounded-lg border border-e-line bg-e-white p-1"
          >
            {FILTERS.map((item) => {
              const isActive = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${tableId}-list`}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "relative min-h-9 rounded-md px-3 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150",
                    isActive ? "text-e-violet" : "text-e-muted hover:text-e-ink",
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="student-status-pill"
                      className="absolute inset-0 rounded-md bg-e-violet-soft"
                      transition={reduceMotion ? { duration: 0 } : spring}
                    />
                  ) : null}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {selectedVisible.length > 0 ? (
          <motion.div
            key="bulk"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.33, 1, 0.68, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-e-violet/30 bg-e-violet-soft px-4 py-3">
              <p className="text-[15px] font-semibold text-e-violet">
                <span className="font-mono tabular-nums">{selectedVisible.length}</span>{" "}
                selected
              </p>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  className={cn(BTN_SECONDARY, "h-10")}
                  onClick={() =>
                    setToast(`Practice set assigned to ${selectedVisible.length} students`)
                  }
                >
                  Assign practice
                </button>
                <button
                  type="button"
                  className={cn(BTN_SECONDARY, "h-10")}
                  onClick={() => setToast(`Exported ${selectedVisible.length} rows as CSV`)}
                >
                  Export
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.p
            role="status"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0FA968]/12 px-3 py-1.5 text-[13px] font-semibold text-[#0FA968]"
          >
            <Check className="size-3.5" aria-hidden="true" />
            {toast}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className={cn(CARD, "overflow-hidden")} id={`${tableId}-list`}>
        {visible.length === 0 ? (
          <EmptyState query={query} onClear={() => setQuery("")} />
        ) : (
          <>
            {/* >=768: real table, its own horizontal scroll container. */}
            {/* `relative` keeps the sr-only labels inside the 900px table anchored
                to this scroll container — otherwise they resolve against the
                initial containing block and widen the whole document. */}
            <div className="relative hidden overflow-x-auto md:block xl:overflow-x-visible">
              <table className="w-full min-w-[900px] border-collapse text-left xl:min-w-0">
                <caption className="sr-only">
                  {CLASS_SIZE} students with unit progress, average score, submitted
                  assignments, last activity and status.
                </caption>
                <thead className="bg-e-white xl:sticky xl:top-16 xl:z-10">
                  <tr className="border-b border-e-line">
                    <th scope="col" className="w-12 px-2">
                      <label className="flex size-11 cursor-pointer items-center justify-center">
                        <span className="sr-only">Select all visible students</span>
                        <SelectAllBox checked={allSelected} some={selectedVisible.length > 0} onChange={toggleAll} />
                      </label>
                    </th>
                    <HeadCell className="min-w-[180px]">Student</HeadCell>
                    <SortableHead
                      label="Progress"
                      sortKey="progress"
                      ariaSort={ariaSort("progress")}
                      active={sortKey === "progress"}
                      dir={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableHead
                      label="Avg. score"
                      sortKey="averageScore"
                      ariaSort={ariaSort("averageScore")}
                      active={sortKey === "averageScore"}
                      dir={sortDir}
                      onSort={toggleSort}
                    />
                    <SortableHead
                      label="Assignments"
                      sortKey="submitted"
                      ariaSort={ariaSort("submitted")}
                      active={sortKey === "submitted"}
                      dir={sortDir}
                      onSort={toggleSort}
                    />
                    <HeadCell>Last active</HeadCell>
                    <HeadCell>Status</HeadCell>
                    <th scope="col" className="px-4 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((student) => (
                    <Row
                      key={student.id}
                      student={student}
                      selected={selected.includes(student.id)}
                      onToggle={() => toggleRow(student.id)}
                      onAction={setToast}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* <768: stacked cards, never a sideways scroll. */}
            <ul className="divide-y divide-e-line md:hidden">
              {visible.map((student) => (
                <MobileRow
                  key={student.id}
                  student={student}
                  selected={selected.includes(student.id)}
                  onToggle={() => toggleRow(student.id)}
                  onAction={setToast}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

/* ---- head cells ---------------------------------------------------------- */

function HeadCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-[13px] font-semibold whitespace-nowrap text-e-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

function SortableHead({
  label,
  sortKey,
  ariaSort,
  active,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  ariaSort: "ascending" | "descending" | "none";
  active: boolean;
  dir: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  return (
    <th scope="col" aria-sort={ariaSort} className="px-4 py-1 whitespace-nowrap">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex h-11 items-center gap-1.5 text-[13px] font-semibold transition-colors duration-150",
          active ? "text-e-ink" : "text-e-muted hover:text-e-ink",
        )}
      >
        {label}
        {active ? (
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              dir === "asc" && "rotate-180",
            )}
            aria-hidden="true"
          />
        ) : (
          <ChevronsUpDown className="size-3.5 text-e-faint" aria-hidden="true" />
        )}
        <span className="sr-only">
          {ariaSort === "none"
            ? ", not sorted, activate to sort descending"
            : `, sorted ${ariaSort}`}
        </span>
      </button>
    </th>
  );
}

function SelectAllBox({
  checked,
  some,
  onChange,
}: {
  checked: boolean;
  some: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !checked && some;
  }, [checked, some]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="size-4 cursor-pointer rounded border-e-line accent-[#6C4FE0]"
    />
  );
}

/* ---- rows ---------------------------------------------------------------- */

function Row({
  student,
  selected,
  onToggle,
  onAction,
}: {
  student: Student;
  selected: boolean;
  onToggle: () => void;
  onAction: (message: string) => void;
}) {
  const meta = STATUS_META[student.status];

  return (
    <tr
      className={cn(
        "h-14 border-b border-e-line transition-colors duration-150 last:border-b-0 hover:bg-e-grey",
        selected && "bg-e-violet-soft/60",
      )}
    >
      <td className="px-2">
        <label className="flex size-11 cursor-pointer items-center justify-center">
          <span className="sr-only">Select {student.name}</span>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="size-4 cursor-pointer rounded border-e-line accent-[#6C4FE0]"
          />
        </label>
      </td>

      <th scope="row" className="px-4 text-left font-normal">
        <span className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold",
              meta.avatarClass,
            )}
            aria-hidden="true"
          >
            {student.initials}
          </span>
          <span className="truncate text-[15px] font-semibold text-e-ink">
            {student.name}
          </span>
        </span>
      </th>

      <td className="px-4">
        <span className="flex items-center gap-3">
          <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-e-grey-2">
            <span
              className={cn("block h-full rounded-full", meta.barClass)}
              style={{ width: `${student.progress}%` }}
            />
          </span>
          <span className="font-mono text-[13px] text-e-ink tabular-nums">
            {student.progress}%
          </span>
        </span>
      </td>

      <td className="px-4 font-mono text-[13px] text-e-ink tabular-nums">
        {student.averageScore}
      </td>

      <td className="px-4 font-mono text-[13px] text-e-muted tabular-nums">
        {student.submitted} / {student.totalAssignments}
      </td>

      <td className="px-4 text-[13px] whitespace-nowrap text-e-muted">
        {student.lastActive}
      </td>

      <td className="px-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap",
            meta.chipClass,
          )}
        >
          <span className={cn("size-1.5 rounded-full", meta.dotClass)} aria-hidden="true" />
          {meta.label}
        </span>
      </td>

      <td className="px-4">
        <span className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onAction(`Message drafted to ${student.name}`)}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-e-muted transition-colors duration-150 hover:bg-e-grey-2 hover:text-e-ink"
          >
            <MessageSquare className="size-4" aria-hidden="true" />
            Message
          </button>
          <OverflowMenu student={student} onAction={onAction} />
        </span>
      </td>
    </tr>
  );
}

function MobileRow({
  student,
  selected,
  onToggle,
  onAction,
}: {
  student: Student;
  selected: boolean;
  onToggle: () => void;
  onAction: (message: string) => void;
}) {
  const meta = STATUS_META[student.status];

  return (
    <li className={cn("p-4", selected && "bg-e-violet-soft/60")}>
      <div className="flex items-center gap-3">
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
          <span className="sr-only">Select {student.name}</span>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="size-4 cursor-pointer rounded border-e-line accent-[#6C4FE0]"
          />
        </label>
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold",
            meta.avatarClass,
          )}
          aria-hidden="true"
        >
          {student.initials}
        </span>
        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-e-ink">
          {student.name}
        </p>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold",
            meta.chipClass,
          )}
        >
          <span className={cn("size-1.5 rounded-full", meta.dotClass)} aria-hidden="true" />
          {meta.label}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 pl-14 text-[13px]">
        <div className="col-span-2 flex items-center gap-3">
          <dt className="sr-only">Progress</dt>
          <dd className="flex flex-1 items-center gap-3">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-e-grey-2">
              <span
                className={cn("block h-full rounded-full", meta.barClass)}
                style={{ width: `${student.progress}%` }}
              />
            </span>
            <span className="font-mono text-e-ink tabular-nums">{student.progress}%</span>
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-e-muted">Avg.</dt>
          <dd className="font-mono text-e-ink tabular-nums">{student.averageScore}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-e-muted">Submitted</dt>
          <dd className="font-mono text-e-ink tabular-nums">
            {student.submitted} / {student.totalAssignments}
          </dd>
        </div>
        <div className="col-span-2 flex items-center gap-1.5">
          <dt className="text-e-muted">Last active</dt>
          <dd className="text-e-muted">{student.lastActive}</dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center gap-1 pl-14">
        <button
          type="button"
          onClick={() => onAction(`Message drafted to ${student.name}`)}
          className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-e-muted transition-colors duration-150 hover:bg-e-grey-2 hover:text-e-ink"
        >
          <MessageSquare className="size-4" aria-hidden="true" />
          Message
        </button>
        <OverflowMenu student={student} onAction={onAction} />
      </div>
    </li>
  );
}

/* ---- overflow menu ------------------------------------------------------- */

function OverflowMenu({
  student,
  onAction,
}: {
  student: Student;
  onAction: (message: string) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const reduceMotion = useReducedMotion();
  const open = position !== null;

  const close = (restoreFocus = true) => {
    setPosition(null);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const toggle = () => {
    if (open) {
      close(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const max = window.innerWidth - MENU_WIDTH - 8;
    setPosition({
      x: Math.min(Math.max(8, rect.right - MENU_WIDTH), Math.max(8, max)),
      y: rect.bottom + 6,
    });
  };

  useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLButtonElement>("button");
    first?.focus();

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setPosition(null);
    };
    const onScroll = () => setPosition(null);

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${student.name}`}
        className="grid size-11 shrink-0 place-items-center rounded-lg text-e-muted transition-colors duration-150 hover:bg-e-grey-2 hover:text-e-ink"
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {position ? (
          <motion.div
            ref={menuRef}
            role="menu"
            aria-label={`Actions for ${student.name}`}
            onKeyDown={onMenuKeyDown}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.33, 1, 0.68, 1] }}
            style={{ left: position.x, top: position.y, width: MENU_WIDTH }}
            className={cn(CARD, FLOAT_SHADOW, "fixed z-50 p-1")}
          >
            {MENU_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                role="menuitem"
                onClick={() => {
                  onAction(`${item}: ${student.name}`);
                  close();
                }}
                className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-[13px] font-medium text-e-ink transition-colors duration-150 hover:bg-e-grey"
              >
                {item}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/* ---- empty state --------------------------------------------------------- */

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-e-grey-2">
        <SearchX className="size-5 text-e-faint" aria-hidden="true" />
      </span>
      <p className="text-[17px] font-bold text-e-ink">No students match this view</p>
      <p className="max-w-sm text-[15px] leading-relaxed text-e-muted">
        {query
          ? `Nothing in ${CLASS_META.name} matches “${query}”.`
          : "No students carry this status right now."}
      </p>
      {query ? (
        <button type="button" onClick={onClear} className={cn(BTN_SECONDARY, "mt-1")}>
          Clear search
        </button>
      ) : null}
    </div>
  );
}
