"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  ASSIGNMENTS,
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD,
  CLASS_META,
  CLASS_SIZE,
  COURSE_OPTIONS,
  FLOAT_SHADOW,
  LANGUAGE_OPTIONS,
  type Assignment,
  type AssignmentState,
} from "./teacher-data";

/* ---- card ---------------------------------------------------------------- */

type DueTone = "overdue" | "today" | "normal";

function dueTone(due: string): DueTone {
  const label = due.toLowerCase();
  if (label.includes("overdue")) return "overdue";
  if (label.includes("today")) return "today";
  return "normal";
}

/**
 * #E5484D and #F5A524 are the measured semantic pair. Amber at its raw value
 * fails contrast as 13px text on white, so the dot keeps #F5A524 and the label
 * uses the same hue darkened to #B4770B.
 */
const DUE_STYLES: Record<DueTone, { dot: string; text: string }> = {
  overdue: { dot: "bg-[#E5484D]", text: "text-[#E5484D]" },
  today: { dot: "bg-[#F5A524]", text: "text-[#B4770B]" },
  normal: { dot: "bg-e-faint", text: "text-e-muted" },
};

export interface AssignmentCardProps {
  assignment: Assignment;
  onReview?: (assignment: Assignment) => void;
}

export function AssignmentCard({ assignment, onReview }: AssignmentCardProps) {
  const tone = dueTone(assignment.due);
  const style = DUE_STYLES[tone];
  const percent = Math.round((assignment.submitted / assignment.total) * 100);

  return (
    <article className={cn(CARD, "flex h-full flex-col p-5")}>
      <h4 className="text-[17px] leading-snug font-bold text-e-ink">{assignment.title}</h4>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="rounded-full bg-e-grey-2 px-2.5 py-1 font-mono text-[11px] font-semibold text-e-muted">
          {assignment.language}
        </span>
        <span className={cn("flex items-center gap-1.5 text-[13px] font-semibold", style.text)}>
          <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden="true" />
          {assignment.due}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-e-muted">Submitted</span>
          <span className="font-mono text-[13px] font-bold text-e-ink tabular-nums">
            {assignment.submitted} / {assignment.total}
          </span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-e-grey-2"
          role="progressbar"
          aria-valuenow={assignment.submitted}
          aria-valuemin={0}
          aria-valuemax={assignment.total}
          aria-label={`${assignment.title} submissions`}
        >
          <span className="block h-full rounded-full bg-e-violet" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <dl className="mt-4 space-y-2 border-t border-e-line pt-4 text-[13px]">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-1.5 text-e-muted">
            <span className="grid size-4 place-items-center rounded-full bg-[#0FA968]/12" aria-hidden="true">
              <Check className="size-2.5 text-[#0FA968]" />
            </span>
            Auto-graded
          </dt>
          <dd className="font-mono font-bold text-e-ink tabular-nums">{assignment.autoGraded}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-e-muted">Needs review</dt>
          <dd
            className={cn(
              "font-mono tabular-nums",
              assignment.needsReview > 0 ? "font-bold text-[#B4770B]" : "text-e-faint",
            )}
          >
            {assignment.needsReview > 0 ? assignment.needsReview : "None"}
          </dd>
        </div>
      </dl>

      {assignment.needsReview > 0 ? (
        <button
          type="button"
          onClick={() => onReview?.(assignment)}
          className={cn(BTN_SECONDARY, "mt-4 w-full")}
        >
          Review {assignment.needsReview}
          <span className="sr-only"> submissions for {assignment.title}</span>
        </button>
      ) : null}
    </article>
  );
}

/* ---- manager ------------------------------------------------------------- */

type AssignmentFilter = "all" | AssignmentState;

const FILTERS: { id: AssignmentFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "needs-review", label: "Needs review" },
  { id: "closed", label: "Closed" },
];

export interface AssignmentManagerProps {
  assignments?: Assignment[];
  className?: string;
}

export function AssignmentManager({
  assignments = ASSIGNMENTS,
  className,
}: AssignmentManagerProps) {
  const [items, setItems] = useState<Assignment[]>(assignments);
  const [filter, setFilter] = useState<AssignmentFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const reduceMotion = useReducedMotion();
  const listId = useId();

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const visible = filter === "all" ? items : items.filter((item) => item.state === filter);

  const closeModal = () => {
    setModalOpen(false);
    triggerRef.current?.focus();
  };

  const handleCreate = (assignment: Assignment) => {
    setItems((current) => [assignment, ...current]);
    setFilter("all");
    setToast(`“${assignment.title}” published to ${CLASS_META.name}`);
    closeModal();
  };

  return (
    <section
      id="assignments"
      aria-labelledby="assignments-heading"
      className={cn("flex flex-col gap-4", className)}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h2 id="assignments-heading" className="text-2xl leading-tight font-bold text-e-ink">
            Assignments
          </h2>
          <span className="rounded-full bg-e-grey-2 px-2.5 py-1 font-mono text-[13px] font-semibold text-e-muted tabular-nums">
            {items.length}
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            role="tablist"
            aria-label="Filter assignments"
            className="flex items-center gap-1 self-start rounded-lg border border-e-line bg-e-white p-1"
          >
            {FILTERS.map((item) => {
              const isActive = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={listId}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "relative min-h-9 rounded-md px-3 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150",
                    isActive ? "text-e-violet" : "text-e-muted hover:text-e-ink",
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="assignment-filter-pill"
                      className="absolute inset-0 rounded-md bg-e-violet-soft"
                      transition={reduceMotion ? { duration: 0 } : spring}
                    />
                  ) : null}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>

          <button
            ref={triggerRef}
            id="new-assignment-trigger"
            type="button"
            onClick={() => setModalOpen(true)}
            className={cn(BTN_PRIMARY, "self-start")}
          >
            <Plus className="size-4" aria-hidden="true" />
            New assignment
          </button>
        </div>
      </div>

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

      <ul id={listId} className="grid gap-4 lg:grid-cols-2">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((assignment) => (
            <motion.li
              key={assignment.id}
              layout={!reduceMotion}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.33, 1, 0.68, 1] }}
            >
              <AssignmentCard
                assignment={assignment}
                onReview={(item) => setToast(`Opening ${item.needsReview} submissions to review`)}
              />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {visible.length === 0 ? (
        <p className={cn(CARD, "px-6 py-10 text-center text-[15px] text-e-muted")}>
          No assignments in this view.
        </p>
      ) : null}

      <NewAssignmentModal open={modalOpen} onClose={closeModal} onCreate={handleCreate} />
    </section>
  );
}

/* ---- modal --------------------------------------------------------------- */

interface FormState {
  title: string;
  course: string;
  language: string;
  due: string;
  points: string;
  autoGrade: boolean;
}

type FieldName = "title" | "due" | "points";
type FormErrors = Partial<Record<FieldName, string>>;

const EMPTY_FORM: FormState = {
  title: "",
  course: COURSE_OPTIONS[0],
  language: LANGUAGE_OPTIONS[0],
  due: "",
  points: "100",
  autoGrade: true,
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function validate(field: FieldName, form: FormState): string | undefined {
  if (field === "title") {
    if (!form.title.trim()) return "Give the assignment a title.";
    if (form.title.trim().length < 3) return "Titles need at least 3 characters.";
    return undefined;
  }
  if (field === "due") {
    return form.due ? undefined : "Pick a due date.";
  }
  const points = Number(form.points);
  if (!form.points.trim() || Number.isNaN(points)) return "Points must be a number.";
  if (points < 1 || points > 100) return "Points must be between 1 and 100.";
  return undefined;
}

function NewAssignmentModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (assignment: Assignment) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const fieldId = useId();

  const refs: Record<FieldName, React.RefObject<HTMLInputElement | null>> = {
    title: useRef<HTMLInputElement>(null),
    due: useRef<HTMLInputElement>(null),
    points: useRef<HTMLInputElement>(null),
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setErrors({});
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => refs.title.current?.focus(), 60);

    // Bound on the document rather than the dialog: the dialog lives in a
    // portal outside the React root, so delegated key events are not reliable.
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onEscape);
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /** Tab trapping only — Escape is handled by the document listener above. */
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const blurField = (field: FieldName) =>
    setErrors((current) => ({ ...current, [field]: validate(field, form) }));

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: FormErrors = {
      title: validate("title", form),
      due: validate("due", form),
      points: validate("points", form),
    };
    setErrors(next);

    const firstInvalid = (["title", "due", "points"] as FieldName[]).find((field) => next[field]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }

    const dueDate = new Date(`${form.due}T23:59`);
    onCreate({
      id: `a-${Date.now()}`,
      title: form.title.trim(),
      language: form.language,
      due: `Due ${dueDate.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })}`,
      submitted: 0,
      total: CLASS_SIZE,
      autoGraded: 0,
      needsReview: 0,
      state: "open",
    });
  };

  if (!mounted || !open) return null;

  /*
    Deliberately not wrapped in AnimatePresence: inside a portal its exit pass
    left the dismissed overlay mounted at opacity 0, swallowing every click on
    the page underneath. The dialog animates in and unmounts instantly.
  */
  return createPortal(
    <div className="fixed inset-0 z-[60] font-e-sans text-e-ink">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(25,31,40,0.45)]"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center sm:p-4">
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${fieldId}-title`}
          onKeyDown={onKeyDown}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            FLOAT_SHADOW,
            "relative flex max-h-full w-full flex-col overflow-hidden bg-e-white",
            "max-sm:h-full sm:max-w-[560px] sm:rounded-[20px]",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-e-line px-6 py-5">
            <div>
              <h3 id={`${fieldId}-title`} className="text-[17px] font-bold text-e-ink">
                New assignment
              </h3>
              <p className="mt-0.5 text-[13px] text-e-muted">
                Publishes to {CLASS_META.name} · {CLASS_SIZE} students
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mt-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-lg text-e-muted transition-colors duration-150 hover:bg-e-grey hover:text-e-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <Field
                id={`${fieldId}-name`}
                label="Title"
                error={errors.title}
                errorId={`${fieldId}-name-error`}
              >
                <input
                  ref={refs.title}
                  id={`${fieldId}-name`}
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  onBlur={() => blurField("title")}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? `${fieldId}-name-error` : undefined}
                  className={inputClass(Boolean(errors.title))}
                />
              </Field>

              <Field id={`${fieldId}-course`} label="Course">
                <select
                  id={`${fieldId}-course`}
                  value={form.course}
                  onChange={(event) => setForm({ ...form, course: event.target.value })}
                  className={inputClass(false)}
                >
                  {COURSE_OPTIONS.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id={`${fieldId}-language`} label="Language">
                  <select
                    id={`${fieldId}-language`}
                    value={form.language}
                    onChange={(event) => setForm({ ...form, language: event.target.value })}
                    className={inputClass(false)}
                  >
                    {LANGUAGE_OPTIONS.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  id={`${fieldId}-due`}
                  label="Due date"
                  error={errors.due}
                  errorId={`${fieldId}-due-error`}
                >
                  <input
                    ref={refs.due}
                    id={`${fieldId}-due`}
                    type="date"
                    value={form.due}
                    onChange={(event) => setForm({ ...form, due: event.target.value })}
                    onBlur={() => blurField("due")}
                    aria-invalid={Boolean(errors.due)}
                    aria-describedby={errors.due ? `${fieldId}-due-error` : undefined}
                    className={inputClass(Boolean(errors.due))}
                  />
                </Field>
              </div>

              <Field
                id={`${fieldId}-points`}
                label="Points"
                hint="1–100"
                error={errors.points}
                errorId={`${fieldId}-points-error`}
              >
                <input
                  ref={refs.points}
                  id={`${fieldId}-points`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  value={form.points}
                  onChange={(event) => setForm({ ...form, points: event.target.value })}
                  onBlur={() => blurField("points")}
                  aria-invalid={Boolean(errors.points)}
                  aria-describedby={errors.points ? `${fieldId}-points-error` : undefined}
                  className={cn(inputClass(Boolean(errors.points)), "font-mono tabular-nums")}
                />
              </Field>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-e-line bg-e-grey px-4 py-3">
                <span id={`${fieldId}-autograde`} className="text-[15px] font-medium text-e-ink">
                  Auto-grade with test cases
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.autoGrade}
                  aria-labelledby={`${fieldId}-autograde`}
                  onClick={() => setForm({ ...form, autoGrade: !form.autoGrade })}
                  className="relative grid h-11 w-12 shrink-0 place-items-center rounded-lg"
                >
                  <span
                    className={cn(
                      "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors duration-200",
                      form.autoGrade ? "bg-e-violet" : "bg-e-grey-2",
                    )}
                  >
                    <motion.span
                      layout={!reduceMotion}
                      transition={reduceMotion ? { duration: 0 } : spring}
                      className={cn(
                        "size-5 rounded-full bg-e-white shadow-sm",
                        form.autoGrade && "ml-auto",
                      )}
                    />
                  </span>
                </button>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-e-line bg-e-white px-6 py-4">
              <button type="button" onClick={onClose} className={BTN_SECONDARY}>
                Cancel
              </button>
              <button type="submit" className={BTN_PRIMARY}>
                Create assignment
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>,
    document.body,
  );
}

function inputClass(invalid: boolean) {
  return cn(
    "h-11 w-full rounded-lg border bg-e-white px-3 text-[15px] text-e-ink outline-none transition-colors duration-150 placeholder:text-e-faint focus:border-e-violet",
    invalid ? "border-[#E5484D]" : "border-e-line",
  );
}

function Field({
  id,
  label,
  hint,
  error,
  errorId,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  errorId?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-baseline gap-2 text-[13px] font-semibold text-e-ink"
      >
        {label}
        {hint ? <span className="font-normal text-e-faint">{hint}</span> : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] font-medium text-[#E5484D]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
