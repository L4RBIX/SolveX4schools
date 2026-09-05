"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { richText } from "@/lib/rich-text";
import { pluralRu } from "@schools/presentation/labels";
import type { Locale, Localized } from "@schools/curriculum/types";
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
 * The same answer carries `saving_progress`, and the panel used to read the
 * `nova` row and drop the rest on the floor. It is a second banner now: during
 * the store outage the health route was saying "answers are not being saved
 * right now" in both languages while this panel said nothing, and twenty
 * minutes of work goes into a task before anyone finds out it was never
 * written down.
 *
 * ## When there is no answer
 *
 * A 500 from a store whose data directory had gone, a 401 from a session that
 * expired over lunch, a 429 from the limiter and a provider that stopped
 * talking mid-sentence were ONE state — `failed: true` — rendered as one
 * sentence beside one uncapped Retry button. The route has been sending
 * `{ kind, retryable }` on its `error` frame the whole time and this panel read
 * neither field; the HTTP status went into an `Error` message and was thrown
 * away in the catch.
 *
 * They are separated because the ADVICE differs, and the advice is the only
 * part a fourteen-year-old can use. See `FailureKind`. Three rules hold across
 * all of them:
 *
 *   - A failure the server called unretryable does not get a Retry button. A
 *     control that is visible and cannot work reads as the app being broken.
 *   - The second failure in a row changes the wording and takes the button
 *     away. The store outage failed INSTANTLY, so a learner could hold the
 *     button down and stack copies of their own question against a database
 *     that was not coming back this lesson.
 *   - The failure line goes BELOW whatever text arrived, never instead of it.
 *     A hint that streamed two useful sentences and then timed out is still two
 *     useful sentences.
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
  /**
   * The learner's last in-browser C++ compile-and-run, read at send time.
   *
   * Untrusted, like `currentDraft`, and for the same reason: it describes a
   * screen this browser rendered. The server re-derives every field it uses
   * (`parseReportedRun`) and reads no claim of trust from it.
   */
  currentRun?: () => unknown;
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

/**
 * Why a turn produced no answer.
 *
 * Kept apart because each one ends in a different instruction, and the wrong
 * instruction costs a learner the lesson. "Log in again" is the whole repair
 * for an expired session and a dead end for a revoked provider key: that child
 * arrives at a sign-in page which works perfectly and fixes nothing.
 *
 * `auth` is this learner's session and nothing else. The route's `error` frame
 * also uses the word for OUR credential being refused by the provider, and that
 * one maps to `provider` here — same word, opposite advice.
 */
type FailureKind =
  /** The app answered 5xx, or answered with a body it had no frames for. */
  | "server"
  /** This learner's session has expired. Signing in again is the fix. */
  | "auth"
  /** Too many questions, too fast. The limiter usually says for how long. */
  | "rate_limit"
  /** The model refused, or its credential was refused. Never the learner's doing. */
  | "provider"
  /** The model stopped talking, possibly mid-sentence. */
  | "timeout"
  /**
   * The answer arrived, and it stops mid-thought.
   *
   * Not a failure and deliberately not folded into one: the request worked, the
   * model answered, and the answer ran out of room. It is here because the
   * panel had no way to say that at all — a reply cut off at the token ceiling
   * rendered as an ordinary finished hint, and a fourteen-year-old reading a
   * sentence that ends in the middle of a word concludes the tutor is broken,
   * or worse, that the half-sentence was the whole point.
   */
  | "incomplete"
  /** The request never reached the server at all. */
  | "offline"
  /** Stop, or the panel closing. Not a failure — the learner did it on purpose. */
  | "cancelled"
  | "unknown";

interface Failure {
  kind: FailureKind;
  /**
   * Whether pressing Retry could plausibly end differently.
   *
   * From the route's own `error` frame where there is one, and derived from the
   * status otherwise. False hides the button rather than disabling it: a
   * disabled control still asks the learner to work out why.
   */
  retryable: boolean;
  /** Seconds the limiter asked for. 0 when it did not say; only ever set for `rate_limit`. */
  waitSeconds: number;
  /**
   * How many failures in a row this one was, counting from 1.
   *
   * Frozen onto the message rather than read from a live counter, so a bubble
   * that said "try again" does not silently rewrite itself into something
   * sterner while the learner is reading it.
   */
  streak: number;
}

/**
 * Failures in a row after which Retry stops being offered.
 *
 * Two, because the second one is the evidence. The first failure is a bad
 * minute on a school connection and pressing the button is the right thing to
 * do; the second in a row means the thing that broke is not the kind of thing a
 * button fixes, and during the store incident it failed instantly — fast enough
 * for a bored fourteen-year-old to stack six copies of their own question in
 * the transcript before deciding the whole platform was broken.
 */
const REPEAT_LIMIT = 2;

interface Message {
  id: string;
  role: "learner" | "nova";
  text: string;
  /** Why this turn has no answer, or no complete one. Absent means it is fine. */
  failure?: Failure;
}

/**
 * Everything the panel says in its own voice.
 *
 * `as const satisfies` rather than a plain annotation, and that is not
 * decoration: `COPY[locale]` is then the UNION of the two objects, so a key
 * present in one language and missing from the other is a compile error at
 * every use site instead of the word `undefined` appearing on a child's screen.
 * Half the strings below were added in one sitting; the type is what makes
 * "both languages, always" structural rather than a thing to remember.
 *
 * Register: the panel speaks to one fourteen-year-old, informally, and every
 * failure line ends in something to DO. The Russian avoids gendered past-tense
 * verbs, because the panel does not know who is reading it.
 */
const COPY = {
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
    hint: "Ішара",
    explain: "Түсіндір",
    why: "Неге қате?",
    check: "Қалай тексерем?",
    override: "Жай айтып жібер",
    degraded:
      "Тіл моделі қосылмаған: Nova сұрақ қоя алады, бірақ түсіндірме жаза алмайды.",
    /* The panel's own sentence about the ledger, used only where the health
       route has none to lend: its admin projection answers in English and names
       environment variables, which is an operator's line, not a learner's. */
    savingDown:
      "Жауаптарың қазір сақталмай тұр. Сабақты жалғастыра бер, бірақ мұғаліміңе айт.",
    failUnknown: "Жауап алынбады. Себебі белгісіз — сұрағыңды басқаша жазып көрші.",
    failServer:
      "Жүйе жауап бермей тұр. Бұл сенің қатең емес — тапсырманы жалғастыра бер де, мұғаліміңе айт.",
    failAuth: "Сессияң аяқталып қалыпты. Қайта кіріп, сұрағыңды тағы жіберші.",
    failRate: "Тым көп сұрақ қойдың. Сәл күте тұрып, қайта жіберші.",
    failProvider:
      "Nova қазір жауап бере алмайды. Бұл сенің қатең емес — жұмысыңды жалғастыра бер, мұғаліміңе айт.",
    failTimeout: "Жауап тым ұзаққа созылып кетті. Сұрағыңды қысқарақ қылып, қайта жіберші.",
    /* Says the ONE thing the learner cannot see for themselves: the text above
       is not the whole answer. It does not apologise and it does not blame the
       connection — the reply ran out of room, which is ours, not theirs. */
    failIncomplete:
      "Жауап осы жерде үзіліп қалды. Жоғарыда жазылғаны дұрыс — қалғанын білу үшін нақтырақ сұрақ қойып көрші.",
    failOffline: "Интернет байланысы үзілген сияқты. Байланысты тексеріп, қайта жіберші.",
    failStopped: "Жауап тоқтатылды.",
    /* Adds the one thing the sentence above it does not have, and repeats none
       of it: two of these in a row is not two bad seconds, and the button is
       about to disappear from under the learner's finger. */
    failStreak: "Қатарынан екінші рет. Қайта басу көмектеспейді — әзірге өзің жалғастыра тұр.",
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
    hint: "Подсказка",
    explain: "Объясни",
    why: "Почему ошибка?",
    check: "Как проверить?",
    override: "Просто скажи",
    degraded:
      "Языковая модель не подключена: Nova может задать вопрос, но не напишет объяснение.",
    savingDown:
      "Твои ответы сейчас не сохраняются. Урок можно продолжать, но скажи учителю.",
    failUnknown: "Ответ не получен. Причина неизвестна — попробуй задать вопрос иначе.",
    failServer:
      "Система не отвечает. Это не твоя ошибка — продолжай задание и скажи учителю.",
    failAuth: "Сессия закончилась. Войди заново и отправь вопрос ещё раз.",
    failRate: "Слишком много вопросов подряд. Подожди немного и отправь снова.",
    failProvider:
      "Nova сейчас не может ответить. Это не твоя ошибка — продолжай работать и скажи учителю.",
    failTimeout: "Ответ занял слишком много времени. Задай вопрос покороче и отправь снова.",
    failIncomplete:
      "Ответ оборвался на середине. То, что выше, — верное, а чтобы узнать остальное, спроси чуть конкретнее.",
    failOffline: "Похоже, пропало соединение. Проверь интернет и отправь снова.",
    failStopped: "Ответ остановлен.",
    failStreak:
      "Это уже второй раз подряд. Нажимать снова не поможет — пока продолжай без подсказок.",
  },
} as const satisfies Record<Locale, Record<string, string>>;

/**
 * One failure, in the learner's language, ending in something to do.
 *
 * The sentence carries the WHOLE instruction, because the Retry button is not
 * always there to carry half of it: an expired session and a revoked provider
 * key both render with no button at all, so "log in again" and "keep working,
 * tell your teacher" have to be in the text or they are nowhere.
 */
function failureCopy(failure: Failure, locale: Locale): string {
  const c = COPY[locale];
  switch (failure.kind) {
    case "server":
      return c.failServer;
    case "auth":
      return c.failAuth;
    case "rate_limit":
      /* The limiter's own number when it gave one — six seconds and ninety
         seconds are different afternoons, and "try again later" covers both
         badly. Static, deliberately: a ticking countdown lives inside a live
         region and would be read aloud once a second, which is the thing the
         `aria-relevant` narrowing at the transcript exists to prevent. */
      if (failure.waitSeconds <= 0) return c.failRate;
      return locale === "kk"
        ? `Тым көп сұрақ қойдың. ${failure.waitSeconds} секунд күте тұрып, қайта жіберші.`
        : `Слишком много вопросов подряд. Подожди ${failure.waitSeconds} ` +
            `${pluralRu(failure.waitSeconds, "секунду", "секунды", "секунд")} и отправь снова.`;
    case "provider":
      return c.failProvider;
    case "timeout":
      return c.failTimeout;
    case "incomplete":
      return c.failIncomplete;
    case "offline":
      return c.failOffline;
    case "cancelled":
      return c.failStopped;
    case "unknown":
      return c.failUnknown;
  }
}

/**
 * An HTTP status, before a single byte of the body is parsed.
 *
 * Parsing first is what this panel used to do by accident — `throw new
 * Error(String(res.status))` and then a catch that looked at neither — and the
 * body is exactly what is missing when it matters: every 500 during the store
 * incident arrived EMPTY.
 *
 * Everything below 500 that is not a session or a limiter answer is reported as
 * unretryable on purpose. A 404 for a block id and a 400 for a malformed body
 * are properties of the request, and the panel would rebuild the identical
 * request; the button would be a lie with a spinner on it.
 */
function httpFailure(status: number): { kind: FailureKind; retryable: boolean } {
  if (status === 401 || status === 403) return { kind: "auth", retryable: false };
  if (status === 429) return { kind: "rate_limit", retryable: true };
  if (status >= 500) return { kind: "server", retryable: true };
  return { kind: "unknown", retryable: false };
}

/**
 * How long the limiter wants, from whichever half of its answer survived.
 *
 * The route sends the number twice — the `retry-after` header and
 * `retryAfterSeconds` in the body — so the header is read first and the body is
 * only opened if it said nothing. Reading a body is failure-prone in precisely
 * the situation this module is being hardened for, so it is guarded and a
 * missing number degrades to the wording without one.
 */
async function retryAfterSeconds(res: Response): Promise<number> {
  const header = Number(res.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return Math.ceil(header);
  try {
    const body = (await res.json()) as { retryAfterSeconds?: unknown };
    const seconds = Number(body.retryAfterSeconds);
    return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 0;
  } catch {
    return 0;
  }
}

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

/**
 * Whether the ledger is accepting work, in the words to say so.
 *
 * `undefined` is "this page has not had a health answer yet", which is what the
 * effect below reads as "ask"; `null` is "asked, and saving is fine". Held in
 * both languages rather than resolved at the fetch, so a learner switching the
 * interface language does not get a Kazakh banner in a Russian lesson.
 */
let savingDown: Localized | null | undefined;

interface HealthPayload {
  view?: string;
  nova?: { detail?: { degraded?: unknown } };
  database?: { status?: string };
  capabilities?: { id?: string; status?: string; message?: { kk?: string; ru?: string } }[];
}

interface HealthVerdict {
  /** Is there a model behind Nova? */
  novaDegraded: boolean;
  /** The sentence to put over the transcript, or `null` while work is being saved. */
  savingDown: Localized | null;
}

/** The panel's own wording, for the projections that lend it none. */
const ownSavingCopy = (): Localized => ({ kk: COPY.kk.savingDown, ru: COPY.ru.savingDown });

/**
 * The two things `/api/health` knows that this panel needs.
 *
 * **Is there a model behind Nova?** Both projections answer it: a teacher (and
 * an anonymous caller, which is what this is) gets the `nova` capability with a
 * status, an admin gets the whole check. Neither shape carries a provider name
 * here, and neither needs to — the learner is told what Nova can do, never
 * which vendor is missing.
 *
 * **Is the work being saved?** The teacher projection has carried
 * `saving_progress` and a localised sentence for it all along, and this panel
 * threw it away with the rest of the body. It is the more urgent of the two
 * questions: a tutor that cannot explain is a worse lesson, a ledger that is
 * not writing is a lost one, and the learner needs to know before the twenty
 * minutes go in, not after.
 */
async function probeHealth(signal: AbortSignal): Promise<HealthVerdict | null> {
  try {
    const res = await fetch("/api/health", { cache: "no-store", signal });
    /* The route answers 503 whenever anything at all is degraded — which is
       exactly the case being asked about — so the body is read regardless of
       the status code. Gating on `res.ok` would make this report "no idea" in
       precisely the situation it exists for. */
    const body = (await res.json()) as HealthPayload;

    if (body.view === "admin") {
      return {
        novaDegraded: body.nova?.detail?.degraded === true,
        /* The admin projection has no sentence to borrow: its `problems` are
           English, name environment variables and are written for whoever can
           fix them. Putting one of those in front of a child would be worse
           than the outage. */
        savingDown: body.database?.status === "down" ? ownSavingCopy() : null,
      };
    }

    const capabilities = body.capabilities ?? [];
    const saving = capabilities.find((c) => c.id === "saving_progress");
    return {
      novaDegraded: capabilities.some((c) => c.id === "nova" && c.status !== "ok"),
      savingDown:
        saving !== undefined && saving.status !== "ok"
          ? /* The route's own wording, because it is the sentence a teacher is
               reading on the status page at the same moment — two different
               explanations of one outage is how a class ends up arguing about
               whose screen is right. Its own copy only fills a gap. */
            {
              kk: saving.message?.kk ?? COPY.kk.savingDown,
              ru: saving.message?.ru ?? COPY.ru.savingDown,
            }
          : null,
    };
  } catch {
    /* Unknown, not broken. A health check that did not answer is evidence
       about the network, not about the model, and a banner that cries wolf on a
       dropped request would teach a class to ignore it. The `policy` frame
       settles both questions on the first message either way. */
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
  currentRun,
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
  const runRef = useRef(currentRun);
  runRef.current = currentRun;
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  /** What the health probe found. Seeded from the page's answer, if it has one. */
  const [probed, setProbed] = useState<boolean | null>(() => novaDegraded);
  /** The banner about the ledger, in both languages, or null while it is fine. */
  const [saving, setSaving] = useState<Localized | null>(() => savingDown ?? null);
  /**
   * The policy's own sentence about what the learner has to do next.
   *
   * Deliberately NOT a message. It is a condition — help is closed until you
   * try again, this is the monthly check, this answer will not count as yours —
   * and conditions do not belong in a transcript: pinned above each turn they
   * read as Nova opening twice, and they accumulate, so scrolling back through
   * a lesson shows the state machine talking to itself.
   *
   * Living outside `messages` also settles two things by construction rather
   * than by care. It is never sent back to the model, because `history` is
   * built from `messages`. And it cannot be mistaken for something Nova said,
   * because Nova did not say it.
   *
   * Cleared the moment the learner sends anything, which is the "transient"
   * part: the sentence exists to be acted on, and the act of asking again is
   * the learner acting.
   */
  const [status, setStatus] = useState<string | null>(null);

  /** What the last `policy` frame said. Fresher than either of the above. */
  const [reported, setReported] = useState<boolean | null>(null);
  /**
   * Failures in a row, across questions rather than per bubble.
   *
   * A ref, because nothing renders from it directly — the count is frozen onto
   * the failure it produced — and because a state update here would rebuild
   * `ask` in the middle of a stream.
   */
  const streak = useRef(0);
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
     health check per block is load the pilot's single box does not need.

     Asked even when the caller already answered the Nova question, which it did
     not used to be. `degradedProp` says whether a model exists; it says nothing
     about whether the ledger is accepting work, and that second answer is the
     one a learner needs before spending a lesson on a task. Still one request
     per page load: `savingDown` stops being `undefined` the moment an answer
     lands — `null` included — and closing the panel aborts one in flight. */
  useEffect(() => {
    if (!open || savingDown !== undefined) return;
    const controller = new AbortController();
    void probeHealth(controller.signal).then((verdict) => {
      if (verdict === null || controller.signal.aborted) return;
      novaDegraded = verdict.novaDegraded;
      savingDown = verdict.savingDown;
      setProbed(verdict.novaDegraded);
      setSaving(verdict.savingDown);
    });
    return () => controller.abort();
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

      /* The condition from the previous turn stops applying the moment the
         learner does something about it. Cleared here rather than when the next
         `policy` frame arrives, so it does not linger over the seconds a
         fourteen-year-old spends watching the reply stream in. */
      setStatus(null);

      lastSent.current = { text, override };
      const controller = new AbortController();
      abort.current = controller;

      const replyId = crypto.randomUUID();
      const patch = (next: Partial<Message>) =>
        setMessages((m) => m.map((x) => (x.id === replyId ? { ...x, ...next } : x)));

      /**
       * This turn failed, and the panel now says which way.
       *
       * The streak is counted here rather than per kind: what a learner is
       * doing when they press Retry four times is not four problems, it is one
       * problem and four presses, and the second press against a store that is
       * not coming back this lesson has to stop being the obvious thing to do.
       *
       * `cancelled` deliberately never comes through here. Pressing Stop is not
       * a failure, and counting it would take the button away from a learner
       * for changing their mind twice.
       */
      const fail = (kind: FailureKind, retryable: boolean, waitSeconds = 0) => {
        streak.current += 1;
        patch({ failure: { kind, retryable, waitSeconds, streak: streak.current } });
        onStateChange?.("error");
      };
      /* Whether the stream ended in an `error` frame. The loop below cannot
         `throw` on one — the frames after it, and the tokens already shown,
         still belong to this turn — so the outcome is carried out by hand. */
      let errored = false;

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
            lastRun: runRef.current?.(),
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

        if (!res.ok) {
          /* Read, rather than stringified into an `Error` and lost in the catch
             — which is what happened here for the whole of the incident, and is
             why a dead store and an expired session produced the same sentence.
             The body is not consulted first: during the outage every 500 came
             back with nothing in it at all. */
          const { kind, retryable } = httpFailure(res.status);
          fail(kind, retryable, kind === "rate_limit" ? await retryAfterSeconds(res) : 0);
          return;
        }
        if (!res.body) {
          /* A 200 with no stream behind it. Indistinguishable from the server
             dying between the headers and the first frame, so it is told as the
             same thing. */
          fail("server", true);
          return;
        }

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
               * Three of this route's frames answer without a model at all: the
               * safety gate, the daily budget ceiling, and the store-down
               * sentence the route streams when the ledger will not open. All
               * three are marked in band — `safety`, `limited`, `storeDown` —
               * and all three are shown as ordinary Nova messages, because that
               * is what they are. A child who typed something about being hurt
               * must not get a policy notice pinned above the answer, and a
               * class that has used up the day's hints is being told so by the
               * sentence itself.
               */
              const noModelCalled =
                parsed.safety === true || parsed.limited === true || parsed.storeDown === true;

              if (parsed.storeDown === true) {
                /* The freshest possible answer to "is my work being saved", and
                   it outranks the health probe: the route has just tried to
                   reach the ledger on this learner's behalf and could not. A
                   panel opened before the outage started would otherwise carry
                   a banner-free header through the whole of it. Never cleared
                   by a later success — a hint that came back proves a model
                   answered, not that anything was written down. */
                savingDown = ownSavingCopy();
                setSaving(savingDown);
              }

              /* The learner sees the plain sentence the policy supplies — never
                 the level, the reason code or the action name.
                 The route sends one only when it changes what they do next, and
                 says how to show it. Anything else was the ladder describing
                 itself and is no longer on the wire. */
              /* A frame no model answered — the safety gate, the daily budget
                 ceiling, the store-down sentence — IS the message, and the
                 route sends it as the streamed text with no explanation
                 alongside. The three carry no policy notice, so there is
                 nothing to raise here and raising one would put a caption over
                 a child's answer about being hurt. */
              if (!noModelCalled) {
                setStatus((parsed.explanation as string | null) ?? null);
              }

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
            /*
             * The answer is real, and it is not all of it.
             *
             * Handled apart from `error` because it IS apart: nothing failed,
             * so `errored` stays false and the failure streak is untouched. A
             * cut-off hint that a learner can still read must not spend one of
             * the two presses that the store-outage cap exists to ration, and
             * `streak: 0` here is the same choice the Stop path makes for the
             * same reason — text arrived, so the button stays.
             *
             * Patched onto the reply rather than appended to its text: the
             * panel already renders the failure line under the message and
             * never instead of it, so the half-answer keeps its shape and gets
             * a caption, in the learner's language, saying it stops early.
             */
            if (ev === "incomplete") {
              patch({
                failure: { kind: "incomplete", retryable: true, waitSeconds: 0, streak: 0 },
              });
            }
            if (ev === "error") {
              errored = true;
              /*
               * The route's vocabulary, translated into what a learner can do.
               *
               * `auth` here is OUR credential being refused by the provider —
               * a revoked key, an expired billing account — and it must never
               * become "log in again", which would send a child to a sign-in
               * page that works perfectly and fixes nothing. The learner's own
               * session failing is a 401 on the response, handled above, and it
               * is the only thing that says that sentence.
               *
               * `retryable` is taken from the frame rather than guessed. It is
               * false for a refused credential and for a timeout: the first
               * fails identically on every press, and the second would be
               * another thirty seconds of a fourteen-year-old watching a
               * spinner for the same question. The timeout copy asks for a
               * shorter question instead, which is the thing that changes the
               * outcome.
               */
              const kind: FailureKind =
                parsed.kind === "timeout"
                  ? "timeout"
                  : parsed.kind === "auth" ||
                      parsed.kind === "rate_limit" ||
                      parsed.kind === "upstream"
                    ? "provider"
                    : "unknown";
              fail(kind, parsed.retryable === true);
            }
          }
        }
        /* A turn that got through resets the count. The cap is about failures
           IN A ROW — one bad minute on a school connection must not take the
           Retry button away for the rest of the lesson. */
        if (!errored) streak.current = 0;
        onStateChange?.("idle");
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          /* Stop, or the panel closing. Whatever arrived stays — a learner who
             stopped a hint half way still gets to read the half they have — and
             it is now MARKED as stopped, with the Retry that goes with it,
             rather than left looking like a hint that simply ended early. An
             empty bubble is still dropped: "thinking…" for the rest of the
             lesson is a spinner that never resolves. */
          setMessages((m) =>
            m.flatMap((x) =>
              x.id !== replyId
                ? [x]
                : x.text.length > 0
                  ? [
                      {
                        ...x,
                        failure: {
                          kind: "cancelled" as const,
                          retryable: true,
                          waitSeconds: 0,
                          streak: 0,
                        },
                      },
                    ]
                  : [],
            ),
          );
          onStateChange?.("idle");
        } else if (err instanceof TypeError) {
          /* What `fetch` throws when the request never got an HTTP response at
             all: a dropped connection, a captive portal, a school Wi-Fi that
             went away mid-answer. Worth its own sentence — "check your
             connection" is something a learner can act on in ten seconds, and
             it is the most likely failure in the room this ships to. A
             `SyntaxError` from a half-written frame is a different thing and
             falls through to the honest "no idea". */
          fail("offline", true);
        } else {
          fail("unknown", true);
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
      : last.failure
        ? /* What arrived AND why it stopped, in that order and in one
             utterance. A hint that streamed two sentences before the provider
             died is still two useful sentences, and reading a screen reader
             only "no answer" robs it of them — which is exactly what the
             sighted panel used to do by rendering the failure INSTEAD of the
             text. */
          [
            last.text,
            failureCopy(last.failure, locale),
            last.failure.streak >= REPEAT_LIMIT ? c.failStreak : "",
          ]
            .filter((part) => part.trim() !== "")
            .join(" ")
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

      {/* Saving first, above the tutor's own banner, because it is the more
          expensive thing to learn late: a Nova that cannot explain costs a
          learner one hint, a ledger that is not writing costs them the lesson.
          Both are `status` rather than `alert` — neither interrupts what a
          screen reader is in the middle of, and both are read on arrival. */}
      {saving ? (
        <p
          role="status"
          className="border-b border-b-warn-edge/30 bg-b-warn-fill/20 px-4 py-2 text-[13px] leading-5 text-b-warn-edge"
        >
          {saving[locale]}
        </p>
      ) : null}

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
            {messages.map((m) => {
              /* Retry belongs to the LAST turn and to nothing else. Every
                 failed bubble used to carry its own button while `lastSent`
                 held only the most recent question — so pressing Retry on a
                 failure from five minutes ago silently asked something else,
                 and the answer arrived under the wrong question. */
              const offerRetry =
                m.failure !== undefined &&
                m.failure.retryable &&
                m.failure.streak < REPEAT_LIMIT &&
                m.id === last.id &&
                !streaming;

              return (
                <div key={m.id} className={cn("flex flex-col gap-1.5", m.role === "learner" && "items-end")}>
                  {/* The text first and the failure under it, never one instead
                      of the other. A mid-stream timeout used to ERASE the
                      sentences the learner had already read. */}
                  {m.text ? (
                    <p
                      className={cn(
                        "max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[15px] leading-[22px] whitespace-pre-wrap",
                        m.role === "learner"
                          ? "bg-b-blue text-b-fg"
                          : "bg-b-fg/[0.07] text-b-fg/90",
                      )}
                    >
                      {/* Model output is untrusted, so it is never rendered as
                          HTML: `richText` reads three marks out of the text and
                          emits exactly three elements — `<code>`, `<strong>`
                          and a fenced `<span>` — each with a fixed class list
                          and plain-text children. No attribute, URL or tag ever
                          comes from the model, which is the property that
                          comment was protecting. What it was costing was Nova's
                          own prose: it writes `cout` and **bold** the way the
                          lesson does, and the learner was reading the
                          punctuation. */}
                      {richText(m.text)}
                    </p>
                  ) : m.failure ? null : (
                    <span className="text-[14px] text-b-fg/30">{c.thinking}</span>
                  )}
                  {m.failure ? (
                    <div className="flex max-w-[85%] flex-col items-start gap-1.5">
                      <p className="text-[14px] leading-5 text-b-fg/55">
                        {failureCopy(m.failure, locale)}
                      </p>
                      {m.failure.streak >= REPEAT_LIMIT ? (
                        /* The second one in a row, said plainly and with no
                           button under it. Anything else here is the panel
                           inviting a child to keep pressing at an outage. */
                        <p className="text-[13px] leading-5 text-b-fg/40">{c.failStreak}</p>
                      ) : null}
                      {offerRetry ? (
                        <button
                          type="button"
                          onClick={() => lastSent.current && ask(lastSent.current.text, lastSent.current.override)}
                          className="cursor-pointer rounded-full border border-b-fg/20 px-3 py-1 text-[13px] text-b-fg/80 hover:border-b-fg/40"
                        >
                          {c.retry}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
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

      {/* The policy's condition, by the composer rather than in the transcript.
          `polite` because it accompanies an answer the learner is already
          reading — `assertive` would interrupt a screen reader mid-sentence to
          deliver the less important of the two. */}
      {status ? (
        <p
          /* Named so a test can tell this apart from a Nova turn. Scraping the
             panel's paragraphs cannot: this is deliberately ON SCREEN, and the
             property under test is that it is not IN THE TRANSCRIPT. */
          data-nova-status="policy"
          aria-live="polite"
          className="px-4 pb-1 text-[13px] leading-5 text-b-fg/45"
        >
          {status}
        </p>
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
