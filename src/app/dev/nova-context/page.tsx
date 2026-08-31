"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * What Nova is actually told.
 *
 * The one page that answers "why did it say that?" without guessing. It runs
 * the real pipeline — the same enforcement, the same context builder, the same
 * prompt assembly the hint route uses — and stops before the provider, so it
 * costs nothing and writes nothing.
 *
 * ## Why this page exists
 *
 * The defect this whole phase was about was invisible from the outside. Nova
 * answered «Где ошибка?» with something generic, and there was no way to see
 * whether the cause was a bad prompt, a missing fact, a capped hint level or a
 * model having a bad day. They look identical in a chat bubble and they need
 * completely different fixes.
 *
 * So the payload is shown verbatim, unredacted. That is not carelessness: the
 * claim `tests/nova/privacy-context.test.ts` makes is that nothing needing
 * redaction is in there, and a debug view that hid things would make that claim
 * uncheckable by eye. If a hidden test or a reference solution ever appears on
 * this page, the test suite is wrong and you have just found out.
 */

const BLOCKS = [
  { id: "m1.l1.b2", label: "m1.l1.b2 · prediction · print(\"2 + 2\")" },
  { id: "m1.l6.b2a", label: "m1.l6.b2a · multiple choice · boundaries" },
  { id: "m1.l6.b3s", label: "m1.l6.b3s · code · leap year" },
  { id: "m1.as.b1", label: "m1.as.b1 · ASSESSMENT" },
];

interface Result {
  subjectId: string;
  episodeId: string;
  taskKind: string;
  safety: { verdict: string; reason: string; mayCallModel: boolean };
  context: Record<string, unknown>;
  decision: Record<string, unknown> | null;
  learnerState: Record<string, unknown> | null;
  payload: { role: string; content: string }[];
  payloadChars: number;
}

export default function NovaContextLab() {
  const [blockId, setBlockId] = useState(BLOCKS[0].id);
  const [message, setMessage] = useState("Где ошибка?");
  const [level, setLevel] = useState(1);
  const [locale, setLocale] = useState<"kk" | "ru">("ru");
  const [draft, setDraft] = useState('{"selectedOptionId": "\\"2 + 2\\""}');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      let parsedDraft: unknown = undefined;
      if (draft.trim()) {
        try {
          parsedDraft = JSON.parse(draft);
        } catch {
          /* A malformed draft is the most likely thing to be wrong on this
             page, and it must not look like a server failure. */
          setError("The draft is not valid JSON.");
          setBusy(false);
          return;
        }
      }
      const res = await fetch("/api/dev/nova-context", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          blockId,
          message,
          requestedLevel: level,
          locale,
          draft: parsedDraft,
        }),
      });
      if (!res.ok) {
        setError(`HTTP ${res.status}`);
        return;
      }
      setResult((await res.json()) as Result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [blockId, message, level, locale, draft]);

  useEffect(() => {
    void run();
    // Once, on open. Every other run is a deliberate press.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-[13px] text-b-fg/60">
          block
          <select
            value={blockId}
            onChange={(e) => setBlockId(e.target.value)}
            className="h-10 rounded-[8px] border-2 border-b-edge bg-b-dark px-3 font-b-mono text-[13px]"
          >
            {BLOCKS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[13px] text-b-fg/60">
          requested level
          <input
            type="number"
            min={0}
            max={4}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="h-10 w-24 rounded-[8px] border-2 border-b-edge bg-b-dark px-3 font-b-mono"
          />
        </label>

        <label className="flex flex-col gap-1 text-[13px] text-b-fg/60">
          locale
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as "kk" | "ru")}
            className="h-10 rounded-[8px] border-2 border-b-edge bg-b-dark px-3"
          >
            <option value="kk">kk</option>
            <option value="ru">ru</option>
          </select>
        </label>

        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="h-10 rounded-full bg-b-blue px-6 text-[14px] font-medium disabled:opacity-40"
        >
          {busy ? "…" : "Build"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1 text-[13px] text-b-fg/60">
          learner message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="rounded-[8px] border-2 border-b-edge bg-b-dark p-3 text-[14px]"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-b-fg/60">
          draft — what is on screen, unchecked (JSON, untrusted)
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            className="rounded-[8px] border-2 border-b-edge bg-b-dark p-3 font-b-mono text-[13px]"
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-[8px] border-2 border-b-warn px-4 py-2 text-[14px] text-b-warn-icon">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="flex flex-col gap-6">
          <Row label="task kind">{result.taskKind}</Row>
          <Row label="safety">
            {result.safety.verdict} · {result.safety.reason} ·{" "}
            {result.safety.mayCallModel ? "model would be called" : "NO model call"}
          </Row>
          <Row label="payload size">{result.payloadChars} characters</Row>

          <Section title="assistance — what the server decided before any prompt existed">
            <Json value={(result.context as { assistance?: unknown }).assistance} />
          </Section>

          <Section title="current interaction — what the platform can prove, and what the browser claims">
            <Json value={(result.context as { interaction?: unknown }).interaction} />
          </Section>

          <Section title="intelligence — relevant skills, recent evidence, directive">
            <Json value={(result.context as { intelligence?: unknown }).intelligence} />
          </Section>

          <Section title="curriculum">
            <Json value={(result.context as { curriculum?: unknown }).curriculum} />
          </Section>

          <Section title="decision engine">
            <Json value={result.decision} />
          </Section>

          <Section title="learner state (persisted projection)">
            <Json value={result.learnerState} />
          </Section>

          <Section title="MODEL PAYLOAD — verbatim, exactly what DeepSeek would receive">
            {result.payload.map((m, i) => (
              <div key={i} className="mb-4">
                <p className="mb-1 text-[12px] font-bold tracking-wide text-b-warn-icon uppercase">
                  {m.role} · {m.content.length} chars
                </p>
                <pre className="overflow-x-auto rounded-[8px] border border-b-edge bg-b-dark p-3 font-b-mono text-[12px] leading-5 whitespace-pre-wrap">
                  {m.content}
                </pre>
              </div>
            ))}
          </Section>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-[13px]">
      <span className="text-b-fg/40">{label}: </span>
      <span className="font-b-mono">{children}</span>
    </p>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="rounded-[12px] border-2 border-b-edge">
      <summary className="cursor-pointer px-4 py-3 text-[13px] font-bold tracking-wide uppercase">
        {title}
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

function Json({ value }: { value: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-[8px] bg-b-dark p-3 font-b-mono text-[12px] leading-5">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
