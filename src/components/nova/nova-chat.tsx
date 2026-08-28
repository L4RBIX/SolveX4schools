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
 */

export interface NovaChatProps {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  /** Curriculum block the learner is on. Nova is useless without it. */
  blockId: string;
  episodeId: string;
  /** Drives the header avatar. */
  onStateChange?: (state: NovaState) => void;
}

interface Message {
  id: string;
  role: "learner" | "nova";
  text: string;
  /** Set on a Nova turn that was capped, in the policy's own wording. */
  note?: string | null;
  failed?: boolean;
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

export function NovaChat({
  open,
  onClose,
  locale,
  blockId,
  episodeId,
  onStateChange,
}: NovaChatProps) {
  const c = COPY[locale];
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const lastSent = useRef<{ text: string; override: boolean } | null>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

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

      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "learner", text },
      ]);
      setDraft("");
      setStreaming(true);
      onStateChange?.("thinking");

      const replyId = crypto.randomUUID();
      let note: string | null = null;

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
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error(String(res.status));

        setMessages((m) => [...m, { id: replyId, role: "nova", text: "" }]);

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
              /* The learner sees the plain sentence the policy supplies — never
                 the level, the reason code or the action name. */
              note = (parsed.explanation as string | null) ?? null;
              /* Said out loud rather than left to be inferred from the prose.
                 A learner told plainly that the model is off knows to ask a
                 teacher; one who is not just thinks Nova is bad at this. */
              setDegraded(parsed.degraded === true);
              onStateChange?.("working");
              setMessages((m) =>
                m.map((x) => (x.id === replyId ? { ...x, note } : x)),
              );
            }
            if (ev === "token") {
              const chunk = parsed.text as string;
              setMessages((m) =>
                m.map((x) => (x.id === replyId ? { ...x, text: x.text + chunk } : x)),
              );
            }
            if (ev === "error") {
              setMessages((m) =>
                m.map((x) => (x.id === replyId ? { ...x, failed: true } : x)),
              );
              onStateChange?.("error");
            }
          }
        }
        onStateChange?.("idle");
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          onStateChange?.("idle");
        } else {
          setMessages((m) => [
            ...m,
            { id: replyId, role: "nova", text: "", failed: true },
          ]);
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

  return (
    <div
      role="dialog"
      aria-label={c.title}
      className={cn(
        "pointer-events-auto flex flex-col overflow-hidden bg-b-panel font-b-sans text-b-fg",
        /* Desktop: a contextual panel on the right. Mobile: a bottom sheet.
           Sides are written out rather than using `inset-x`/`inset-y`: Tailwind
           orders the shorthand AFTER the single-side utilities in the generated
           sheet, so `sm:right-4` silently loses to a base `inset-x-0` and the
           panel renders glued to the viewport edge. */
        "fixed top-auto right-0 bottom-0 left-0 z-[900] h-[86dvh] rounded-t-[20px] border-t-2 border-b-edge",
        "sm:top-4 sm:right-4 sm:bottom-4 sm:left-auto sm:h-auto sm:w-[400px] sm:rounded-[20px] sm:border-2",
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

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-6 text-center text-[15px] leading-6 text-b-fg/40">{c.empty}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex flex-col gap-1.5", m.role === "learner" && "items-end")}>
                {m.note ? (
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
