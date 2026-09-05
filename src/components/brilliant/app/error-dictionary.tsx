"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale, Localized } from "@schools/curriculum/types";
import { L, t } from "@schools/presentation/labels";
import { cn } from "@/lib/utils";
import { richText } from "@/lib/rich-text";

/**
 * The error dictionary section on `/you` — «Жеке қателер журналы» (PDF).
 *
 * ## What it renders, and what it cannot
 *
 * Every sentence on a card comes from one of exactly two places: the
 * curriculum author's explanation of a specific wrong answer, or the learner's
 * own note. This component composes neither. It has no branch that assembles a
 * sentence from a count, which is the difference between "you answered this
 * wrong twice" and "you struggle with types" — and the reason there is no such
 * branch is that the second one is a claim about a child nobody is entitled to
 * make.
 *
 * The failure class never reaches this file. The API does not send it; a card
 * is addressed by an opaque `ref`.
 *
 * ## Why saving is a button and not automatic
 *
 * The programme says the learner begins to collect their own dictionary. A list
 * that fills itself is a report about a child; a list they choose entries for is
 * theirs. The choosing is the pedagogy, so the offer sits beside the entry and
 * nothing is kept until it is pressed.
 */

interface Entry {
  ref: string;
  blockId: string;
  lessonId: string;
  lessonTitle: Localized;
  monthIndex: number;
  justifications: string[];
  occurrences: number;
  lastAt: string | null;
  note: string | null;
  saved: boolean;
}

interface Payload {
  saved: Entry[];
  candidates: Entry[];
}

export function ErrorDictionary({ loc }: { loc: Locale }) {
  const [data, setData] = useState<Payload | null>(null);
  const [failed, setFailed] = useState(false);
  /** The ref currently being written, so only its own button says "saving". */
  const [pending, setPending] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/learning/dictionary");
      if (!res.ok) throw new Error(String(res.status));
      setData((await res.json()) as Payload);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (ref: string, note: string) => {
      setPending(ref);
      setSaveFailed(null);
      try {
        const res = await fetch("/api/learning/dictionary", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ref, note: note.trim() || undefined }),
        });
        if (!res.ok) throw new Error(String(res.status));
        /* Re-read rather than move the card locally. The server decides which
           list an entry belongs in, and a client that also decides is a second
           opinion waiting to disagree with the first. */
        await load();
      } catch {
        setSaveFailed(ref);
      } finally {
        setPending(null);
      }
    },
    [load],
  );

  return (
    <section className="flex flex-col items-stretch gap-6">
      <div className="flex flex-col items-start gap-1">
        <h2 className="text-[20px] leading-[25px] font-bold">{t(L.errorBookTitle, loc)}</h2>
        <p className="text-[14px] leading-[21px] text-b-fg/60">{t(L.errorBookSub, loc)}</p>
      </div>

      {failed ? (
        <p className="text-b-fg/60">{t(L.errorBookLoadFailed, loc)}</p>
      ) : data === null ? (
        <div
          aria-hidden="true"
          className="h-32 animate-pulse rounded-[20px] border-2 border-b-fg/10 bg-b-fg/[0.03]"
        />
      ) : (
        <div className="flex flex-col gap-6">
          {data.saved.length === 0 ? (
            <p className="text-b-fg/60">{t(L.errorBookEmpty, loc)}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.saved.map((entry) => (
                <li key={entry.ref}>
                  <EntryCard entry={entry} loc={loc} />
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3">
            <h3 className="text-[14px] leading-[21px] font-semibold tracking-wide text-b-fg/50 uppercase">
              {t(L.errorBookOffer, loc)}
            </h3>
            {data.candidates.length === 0 ? (
              <p className="text-b-fg/50">{t(L.errorBookNoOffer, loc)}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.candidates.map((entry) => (
                  <li key={entry.ref}>
                    <EntryCard
                      entry={entry}
                      loc={loc}
                      onSave={(note) => void save(entry.ref, note)}
                      saving={pending === entry.ref}
                      failed={saveFailed === entry.ref}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * One mistake.
 *
 * A saved entry is a card and nothing else. A candidate carries the offer: an
 * optional field for the learner's own words, and the button that keeps it.
 */
function EntryCard({
  entry,
  loc,
  onSave,
  saving,
  failed,
}: {
  entry: Entry;
  loc: Locale;
  onSave?: (note: string) => void;
  saving?: boolean;
  failed?: boolean;
}) {
  const [note, setNote] = useState("");
  const noteId = `note-${entry.ref}`;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border-2 bg-b-bg px-5 py-4",
        entry.saved ? "border-b-fg/20" : "border-b-fg/10",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[14px] leading-5 text-b-fg/60">{entry.lessonTitle[loc]}</span>
        {/* A count of something that happened. Never rendered as a rate, and
            omitted entirely once the raw events have aged out rather than
            shown as a zero that reads like a measurement. */}
        {entry.occurrences > 0 ? (
          <span className="text-[13px] leading-5 text-b-fg/40 tabular-nums">
            {t(L.errorBookSeen(entry.occurrences), loc)}
          </span>
        ) : null}
      </div>

      {/* The author's words, verbatim. Authored in Kazakh and shown as written:
          a Russian sentence nobody wrote would be an invention, which is the
          one thing this surface may not contain. */}
      {entry.justifications.map((text) => (
        <p key={text} className="text-[15px] leading-6 text-b-fg/85">
          {richText(text)}
        </p>
      ))}

      {/* The learner's own words, once they have written any. */}
      {entry.note ? (
        <p className="border-l-2 border-b-fg/20 pl-3 text-[15px] leading-6 text-b-fg/70 italic">
          {entry.note}
        </p>
      ) : null}

      {onSave ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={noteId} className="text-[13px] leading-5 text-b-fg/50">
            {t(L.errorBookNote, loc)}
          </label>
          <textarea
            id={noteId}
            rows={2}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t(L.errorBookNotePlaceholder, loc)}
            className="w-full resize-y rounded-xl border-2 border-b-fg/15 bg-transparent px-3 py-2 text-[15px] leading-6 text-b-fg placeholder:text-b-fg/30 focus:border-b-fg/40 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave(note)}
              className={cn(
                "h-10 shrink-0 rounded-full border-2 border-b-fg/20 px-5 text-[14px] font-medium transition-colors",
                saving ? "cursor-default text-b-fg/40" : "cursor-pointer hover:border-b-fg/40",
              )}
            >
              {t(saving ? L.errorBookSaving : L.errorBookSave, loc)}
            </button>
            {failed ? (
              <span className="text-[13px] text-b-warn-edge">{t(L.errorBookSaveFailed, loc)}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
