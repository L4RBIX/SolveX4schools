"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@schools/curriculum/types";
import { NovaAvatar, type NovaState } from "./nova-avatar";

/**
 * Nova's chat.
 *
 * Closer to Claude or ChatGPT than to a support widget: a header, a
 * conversation, an input. No toolbar, no quick-action grid, no dashboard.
 * Four contextual chips at most, and only where they fit the moment.
 *
 * ## What the panel never shows
 *
 * The engine's own vocabulary. A learner must not read `unattributed_failure`,
 * `independence_weight` or `L4` — those are how the system reasons, not
 * something to hand a fourteen-year-old. The policy frame that arrives before
 * the first token is consumed to set Nova's face and, when help was capped, to
 * show the plain-language explanation the policy itself supplies.
 *
 * ## What it must say before it is asked anything
 *
 * With no model configured, `EchoProvider` streams one fluent in-language
 * coaching sentence, with a typing delay, into the same bubble a real answer
 * uses. There is no marker in it, and there is nothing dishonest about the
 * sentence itself — it is the sentence a tutor without a model can honestly
 * say. What was dishonest was the framing: the only signal that no model exists
 * was a banner written by the `policy` frame, and that frame cannot arrive
 * until the learner has already sent a message. The entire first question
 * therefore looked like a working tutor.
 *
 * So the panel asks `/api/health` when it opens, and the answer is kept for the
 * page rather than for the mount. A learner in a classroom where the key was
 * never set now reads "Nova can ask you a question but cannot write an
 * explanation" before typing, and knows to ask the teacher instead of
 * concluding that the tutor is stupid.
 *
 * ## Screen readers
 *
 * Everything Nova says is announced, and each thing is announced exactly once.
 * The transcript is a polite `log` whose `aria-relevant` is narrowed to
 * `additions`, so a new turn arriving is spoken while the several hundred token
 * updates that fill it in are not — an unnarrowed live region re-reads the
 * whole growing answer on every chunk, which is unusable. The settled outcome
 * is then spoken once by the status line inside it.
 */

/**
 * What is on screen and unchecked, in the shape the route accepts.
 *
 * Mirrors `DraftInput` on the server rather than importing it: that module
 * carries `server-only`, and pulling it into a client component would fail the
 * build. The server re-validates every field anyway — it has to, because this
 * arrives from a browser — so the two shapes agreeing is a convenience for
 * whoever fills this in, not a guarantee anything depends on.
 */
export interface NovaDraft {
  selectedOptionId?: string;
  text?: string;
  blanks?: string[];
  order?: string[];
  line?: number;
  cells?: Record<string, string>;
  code?: string;
}

export interface NovaChatProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  /** Curriculum block the learner is on. Nova is useless without it. */
  blockId: string;
  episodeId: string;
  /**
   * What the learner currently has on screen and has NOT checked.
   *
   * The option clicked, the code being typed, the ordering half-finished. The
   * server cannot see any of it — it lives in this browser until Check is
   * pressed — and it is what «Где ошибка?» is nearly always about.
   *
   * Read at SEND time rather than captured at mount, via a getter: a learner
   * types, then asks, and a value snapshotted when the panel opened would
   * describe the screen as it was several minutes ago.
   *
   * The server treats every field as untrusted, clamps it, and fences it. It
   * never becomes learning evidence.
   */
  currentDraft?: () => NovaDraft | undefined;
  /** Drives the header avatar. */
  onStateChange?: (state: NovaState) => void;
  /**
   * Whether there is a model behind Nova, when the caller already knows.
   *
   * A server component that has the provider in hand should pass it — that is
   * one fewer request and it is correct on first paint. Omitted, the panel asks
   * `/api/health` itself when it opens.
   */
  degraded?: boolean;
}

interface Message {
  id: string;
  role: "learner" | "nova";
  text: string;
  /** Set on a Nova turn that was capped, in the policy's own wording. */
  note?: string | null;
  failed?: boolean;
  /**
   * A turn no model was involved in: the safety gate, or the daily budget
   * ceiling. It is rendered as an ordinary Nova message with none of the
   * hint-level chrome around it.
   *
   * Carried explicitly rather than inferred from `note` being empty. The route
   * happens to send `explanation: null` on both of those paths today, and a
   * panel that depends on that is a panel that starts putting a policy notice
   * over a child's answer to "I don't want to be here any more" the day
   * somebody adds an explanation string.
   */
  plain?: boolean;
}

const COPY: Record<Locale, Record<string, string>> = {
  kk: {
    title: "Nova AI",
    subtitle: "SolveX4Schools көмекшісі",
    placeholder: "Не түсінбедің?",
    send: "Жіберу",
    stop: "Тоқтату",
    retry: "Қайталау",
    close: "Жабу",
    empty: "Бір нәрсе жасап көрдің бе? Сонда көмектесе аламын.",
    thinking: "Ойлануда…",
    failed: "Жауап алынбады. Қайта көріңіз.",
    hint: "Ішара",
    explain: "Түсіндір",
    why: "Неге қате?",
    check: "Қалай тексерем?",
    override: "Жай айтып жібер",
    degraded:
      "Тіл моделі қосылмаған: Nova сұрақ қоя алады, бірақ түсіндірме жаза алмайды.",
  },
  ru: {
    title: "Nova AI",
    subtitle: "Помощник SolveX4Schools",
    placeholder: "Что непонятно?",
    send: "Отправить",
    stop: "Остановить",
    retry: "Повторить",
    close: "Закрыть",
    empty: "Попробовал что-нибудь? Тогда смогу помочь.",
    thinking: "Думает…",
    failed: "Ответ не получен. Попробуйте ещё раз.",
    hint: "Подсказка",
    explain: "Объясни",
    why: "Почему ошибка?",
    check: "Как проверить?",
    override: "Просто скажи",
    degraded:
      "Языковая модель не подключена: Nova может задать вопрос, но не напишет объяснение.",
  },
};

/* -------------------------------------------------------------------------- */

/**
 * The last thing `/api/health` said about Nova, for this page load.
 *
 * Module scope on purpose. The panel unmounts with the lesson, and a learner
 * moving between blocks would otherwise re-ask the same question and watch the
 * banner appear a beat late every time. Written only from the browser — never
 * during render — so the copy of this module that Next renders on the server is
 * never touched and one learner's answer can never leak into another's request.
 *
 * `null` means "not asked yet, or the question failed", which is deliberately
 * not the same as `false`.
 */
let novaDegraded: boolean | null = null;

interface HealthPayload {
  view?: string;
  nova?: { detail?: { degraded?: unknown } };
  capabilities?: { id?: string; status?: string }[];
}

/**
 * Is there a model behind Nova?
 *
 * Both projections of the health route answer it: a teacher (and an anonymous
 * caller, which is what this is) gets the `nova` capability with a status, an
 * admin gets the whole check. Neither shape carries a provider name to this
 * panel, and neither needs to — the learner is told what Nova can do, never
 * which vendor is missing.
 */
async function probeNova(signal: AbortSignal): Promise<boolean | null> {
  try {
    const res = await fetch("/api/health", { cache: "no-store", signal });
    /* The route answers 503 whenever anything at all is degraded — which is
       exactly the case being asked about — so the body is read regardless of
       the status code. Gating on `res.ok` would make this report "no idea" in
       precisely the situation it exists for. */
    const body = (await res.json()) as HealthPayload;
    if (body.view === "admin") return body.nova?.detail?.degraded === true;
    return (body.capabilities ?? []).some((c) => c.id === "nova" && c.status !== "ok");
  } catch {
    /* Unknown, not broken. A health check that did not answer is evidence
       about the network, not about the model, and a banner that cries wolf on a
       dropped request would teach a class to ignore it. The `policy` frame
       settles the question on the first message either way. */
    return null;
  }
}

/* -------------------------------------------------------------------------- */

export function NovaChat({
  open,
  onClose,
  locale,
  blockId,
  episodeId,
  onStateChange,
  degraded: degradedProp,
  currentDraft,
}: NovaChatProps) {
  const c = COPY[locale];
  const [messages, setMessages] = useState<Message[]>([]);
  /* The transcript, readable from inside `ask` without making it a dependency.
     Listing `messages` on the callback would rebuild it on every streamed token
     — several hundred times per answer — and each rebuild would re-run the
     effects that depend on it. */
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;
  /* Same reason, and one more: the caller passes an inline arrow, so its
     identity changes on every render of the lesson. Listing it as a dependency
     would rebuild `ask` constantly; capturing it once would freeze the panel to
     the screen as it was at mount. A ref read at send time is the only shape
     that gives Nova the learner's ACTUAL current answer. */
  const draftRef = useRef(currentDraft);
  draftRef.current = currentDraft;
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  /** What the health probe found. Seeded from the page's answer, if it has one. */
  const [probed, setProbed] = useState<boolean | null>(() => novaDegraded);
  /** What the last `policy` frame said. Fresher than either of the above. */
  const [reported, setReported] = useState<boolean | null>(null);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const lastSent = useRef<{ text: string; override: boolean } | null>(null);

  /* Freshest first: a turn that actually reached a provider beats what the
     caller knew at render time, which beats the panel's own probe, which beats
     nothing at all. */
  const degraded = reported ?? degradedProp ?? probed ?? false;

  /**
   * Focus, both ways.
   *
   * Moving into the textarea on open was already right. Putting it back was
   * missing, and on a phone the panel covers 86dvh — so a keyboard user who
   * closed it landed at the top of the document and had to tab back through the
   * whole lesson to reach the block they were working on.
   */
  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement | null;
      input.current?.focus();
      return;
    }
    restoreFocus.current?.focus();
    restoreFocus.current = null;
  }, [open]);

  /**
   * Escape closes it, and Tab stays inside it.
   *
   * The panel claims `aria-modal`, and that claim has to be true: it tells a
   * screen reader that the lesson behind is inert, so a Tab that walks out of
   * the panel walks into content the reader has been told is not there. The
   * listener is on the document rather than the panel because focus can be
   * anywhere when a learner reaches for Escape — including nowhere at all, on a
   * phone, where the sheet is most of the screen and the close button is a
   * 36px target at the top.
   */
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;

      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && panel.current.contains(active);

      if (event.shiftKey && (!inside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* Asked when the panel opens rather than on mount: the lesson mounts this for
     every learner and most of them never open it, and eighteen students × one
     health check per block is load the pilot's single box does not need. */
  useEffect(() => {
    if (!open || degradedProp !== undefined || probed !== null) return;
    const controller = new AbortController();
    void probeNova(controller.signal).then((verdict) => {
      if (verdict === null || controller.signal.aborted) return;
      novaDegraded = verdict;
      setProbed(verdict);
    });
    return () => controller.abort();
  }, [open, degradedProp, probed]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Closing the panel must not leave a request running against a lesson the
  // learner has moved on from.
  useEffect(() => {
    if (!open) abort.current?.abort();
  }, [open]);

  const ask = useCallback(
    async (text: string, override = false) => {
      if (!text.trim() || streaming) return;

      lastSent.current = { text, override };
      const controller = new AbortController();
      abort.current = controller;

      const replyId = crypto.randomUUID();
      const patch = (next: Partial<Message>) =>
        setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, ...next } : x)));

      /* Both turns are appended together, before the request leaves. The reply
         bubble used to be created only once response headers came back, so on a
         school connection the panel showed the learner's own message and then
         nothing at all for however long the model took to start — which reads
         as a send that failed, and gets sent again. */
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "learner", text },
        { id: replyId, role: "nova", text: "" },
      ]);
      setDraft("");
      setStreaming(true);
      onStateChange?.("thinking");

      try {
        const res = await fetch("/api/nova/hint", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            blockId,
            episodeId,
            message: text,
            requestedLevel: override ? 4 : 1,
            override,
            locale,
            draft: draftRef.current?.(),
            /* The conversation, from this tab and nowhere else. The server
               bounds it to three exchanges; sending more just wastes the
               request. Sliced here too so a long session does not put a
               megabyte on a school connection. */
            history: messagesRef.current
              .filter((m) => m.text.trim())
              .slice(-6)
              .map((m) => ({ role: m.role === "learner" ? "user" : "assistant", text: m.text })),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error(String(res.status));

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const ev = frame.match(/^event: (.+)$/m)?.[1];
            const data = frame.match(/^data: (.+)$/m)?.[1];
            if (!ev || !data) continue;
            const parsed = JSON.parse(data) as Record<string, unknown>;

            if (ev === "policy") {
              /*
               * Two of this route's frames answer without a model at all: the
               * safety gate, and the daily budget ceiling. Both are marked in
               * band — `safety` and `limited` — and both are shown as ordinary
               * Nova messages, because that is what they are. A child who typed
               * something about being hurt must not get a policy notice pinned
               * above the answer, and a class that has used up the day's hints
               * is being told so by the sentence itself.
               */
              const noModelCalled = parsed.safety === true || parsed.limited === true;

              /* The learner sees the plain sentence the policy supplies — never
                 the level, the reason code or the action name. */
              const note = (parsed.explanation as string | null) ?? null;
              patch({ note, plain: noModelCalled });

              if (!noModelCalled) {
                /* Said out loud rather than left to be inferred from the prose.
                   A learner told plainly that the model is off knows to ask a
                   teacher; one who is not just thinks Nova is bad at this.

                   Skipped for the two deterministic frames, and that is the
                   point of reading them: the budget one reports `degraded: true`
                   because no model was behind THAT answer, and letting it raise
                   the banner would tell a whole class the tutor was never
                   connected on the afternoon they simply ran out of hints. */
                const off = parsed.degraded === true;
                novaDegraded = off;
                setReported(off);
              }

              onStateChange?.("working");
            }
            if (ev === "token") {
              const chunk = parsed.text as string;
              setMessages((m) =>
                m.map((x) => (x.id === replyId ? { ...x, text: x.text + chunk } : x)),
              );
            }
            if (ev === "error") {
              patch({ failed: true });
              onStateChange?.("error");
            }
          }
        }
        onStateChange?.("idle");
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          /* Stop, or the panel closing. Whatever arrived stays — a learner who
             stopped a hint half way still gets to read the half they have — but
             an empty bubble left saying "thinking…" for the rest of the lesson
             is a spinner that never resolves. */
          setMessages((m) => m.filter((x) => x.id !== replyId || x.text.length > 0));
          onStateChange?.("idle");
        } else {
          patch({ failed: true });
          onStateChange?.("error");
        }
      } finally {
        setStreaming(false);
        abort.current = null;
      }
    },
    [blockId, episodeId, locale, streaming, onStateChange],
  );

  if (!open) return null;

  const chips = [
    { label: c.hint, text: c.hint },
    { label: c.explain, text: c.explain },
    { label: c.why, text: c.why },
    { label: c.check, text: c.check },
  ];

  /*
   * What a screen reader hears when the answer settles.
   *
   * Empty while the tokens are arriving: the log has already announced the turn
   * and its "thinking…" placeholder, and announcing the answer as it grows
   * would re-read the whole thing several hundred times. One sentence, once,
   * when there is something complete to say.
   *
   * Read off the LAST message rather than the last Nova one, which is what
   * keeps a stopped question quiet: aborting removes the empty reply bubble, so
   * the transcript ends on the learner's own line and the previous answer is
   * not read out a second time.
   */
  const last = messages[messages.length - 1];
  const settled =
    streaming || last === undefined || last.role !== "nova"
      ? ""
      : last.failed
        ? c.failed
        : last.text;

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={c.title}
      className={cn(
        "pointer-events-auto flex flex-col overflow-hidden bg-b-panel font-b-sans text-b-fg",
        /* Every side is written out rather than using `inset-x` / `inset-y`.
           Tailwind orders the shorthand AFTER the single-side utilities in the
           generated sheet, so a breakpoint-prefixed side silently loses to a
           base `inset-x-0` and the panel renders glued to the viewport edge.
           That bit us once; keep the long form. */
        /* Two layouts, and the breakpoint between them is a product decision.
         *
         * Below `lg` Nova is a bottom sheet over the lesson, because a 340px
         * panel beside a 768px lesson leaves the task in a strip too narrow to
         * read a code block in — and the lesson is what the learner came for.
         *
         * At `lg` and above it is the LEFT half of a real split: the lesson
         * pane's own left inset moves by the same variable, so the lesson
         * genuinely contracts and its content re-centres in what is left. Nova
         * is beside the work, never on top of it, and nothing is covered.
         *
         * Left rather than right, deliberately. The trigger lives bottom-left,
         * so the panel arrives from where the learner tapped — a chat that
         * opens on the opposite side of the screen from its own button reads as
         * two unrelated things. */
        "fixed top-auto right-0 bottom-0 left-0 z-[900] h-[86dvh] rounded-t-[20px] border-t-2 border-b-edge",
        "lg:top-16 lg:right-auto lg:bottom-8 lg:left-8 lg:h-auto lg:w-[var(--sx-nova-w)] lg:rounded-[24px] lg:border-2",
        "shadow-[0_16px_48px_rgba(0,0,0,0.45)]",
      )}
    >
      <header className="flex items-center gap-3 border-b border-b-fg/10 px-4 py-3">
        <NovaAvatar state={streaming ? "working" : "idle"} size={36} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-5 font-semibold">{c.title}</p>
          <p className="text-[12px] leading-4 text-b-fg/50">
            {streaming ? c.thinking : c.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={c.close}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-b-fg/50 transition-colors hover:bg-b-fg/10 hover:text-b-fg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      {degraded ? (
        <p
          role="status"
          className="border-b border-b-warn-edge/30 bg-b-warn-fill/20 px-4 py-2 text-[13px] leading-5 text-b-warn-edge"
        >
          {c.degraded}
        </p>
      ) : null}

      <div
        ref={scroller}
        /* `additions` only. The default relevance includes text changes, and
           every one of the several hundred token updates that fill an answer in
           is a text change — a polite region set that way re-reads the entire
           growing paragraph on each one, which is worse than silence. */
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        <p className="sr-only" role="status">
          {settled}
        </p>
        {messages.length === 0 ? (
          <p className="mt-6 text-center text-[15px] leading-6 text-b-fg/40">{c.empty}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex flex-col gap-1.5", m.role === "learner" && "items-end")}>
                {m.note && !m.plain ? (
                  <p className="max-w-[85%] rounded-[12px] border border-b-warn/30 bg-b-warn/10 px-3 py-2 text-[13px] leading-5 text-b-warn-icon">
                    {m.note}
                  </p>
                ) : null}
                {m.failed ? (
                  <div className="flex items-center gap-3">
                    <p className="text-[14px] text-b-fg/50">{c.failed}</p>
                    <button
                      type="button"
                      onClick={() => lastSent.current && ask(lastSent.current.text, lastSent.current.override)}
                      className="cursor-pointer rounded-full border border-b-fg/20 px-3 py-1 text-[13px] text-b-fg/80 hover:border-b-fg/40"
                    >
                      {c.retry}
                    </button>
                  </div>
                ) : m.text ? (
                  <p
                    className={cn(
                      "max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[15px] leading-[22px] whitespace-pre-wrap",
                      m.role === "learner"
                        ? "bg-b-blue text-b-fg"
                        : "bg-b-fg/[0.07] text-b-fg/90",
                    )}
                  >
                    {/* Plain text. Model output is untrusted, so it is never
                        rendered as markup — no HTML, no scripts, no links the
                        model chose. */}
                    {m.text}
                  </p>
                ) : (
                  <span className="text-[14px] text-b-fg/30">{c.thinking}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => ask(chip.text)}
              className="cursor-pointer rounded-full border border-b-fg/15 px-3 py-1.5 text-[13px] text-b-fg/70 transition-colors hover:border-b-fg/35 hover:text-b-fg"
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="flex items-end gap-2 border-t border-b-fg/10 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(draft);
        }}
      >
        <textarea
          ref={input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter breaks the line. The draft is never
            // cleared on failure — losing what a learner typed is worse than
            // the failure itself.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void ask(draft);
            }
          }}
          rows={1}
          placeholder={c.placeholder}
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-[12px] border border-b-fg/15 bg-b-bg px-3 py-2.5 text-[15px] leading-6 text-b-fg placeholder:text-b-fg/30 focus:border-b-blue focus:outline-none"
        />
        {streaming ? (
          <button
            type="button"
            onClick={() => abort.current?.abort()}
            className="h-11 shrink-0 cursor-pointer rounded-[12px] border border-b-fg/20 px-4 text-[14px] font-medium text-b-fg/80 hover:border-b-fg/40"
          >
            {c.stop}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim()}
            className="h-11 shrink-0 cursor-pointer rounded-[12px] bg-b-blue px-4 text-[14px] font-medium text-b-fg disabled:cursor-default disabled:opacity-30"
          >
            {c.send}
          </button>
        )}
      </form>
    </div>
  );
}
