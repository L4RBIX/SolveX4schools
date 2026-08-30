"use client";

/**
 * Writes that have not reached the server yet.
 *
 * ## The failure this exists for
 *
 * A finished lesson is written twice: `markLessonComplete` into `localStorage`,
 * which is what makes the gameboard change in the same frame, and
 * `POST /api/learning/complete`, which is the school's record. The second was
 * `void fetch(...).catch(() => {})`. When it failed — a dropped school Wi-Fi, a
 * restarting container, a database blip — the learner saw the board tick over
 * and the school's account of who finished what silently lost a row. The
 * product told a child their work was recorded when it was not.
 *
 * The board must still change instantly, so the answer is not "await the
 * network". It is: keep the thing that failed, and send it again.
 *
 * ## Why a queue and not a retry loop
 *
 * A retry loop inside the request lives as long as the page does, and the
 * completion screen is followed by a navigation more often than not — that is
 * why the original used `keepalive`. A queue survives the navigation, the tab
 * close, the browser restart and the walk home, and it flushes the next time
 * the learner opens a lesson. For a school laptop that loses its connection
 * mid-afternoon, "it lands tomorrow morning" is the correct behaviour and the
 * only one that is actually reachable from a browser.
 *
 * ## Bounded, and honest about it
 *
 * At most `MAX_PENDING` entries, oldest dropped first. An unbounded queue on a
 * shared classroom machine is a way to fill a storage quota and take the
 * gameboard down with it. Dropping the oldest is stated here rather than
 * hidden: a completion that has been failing for fifty lessons is not going to
 * succeed, and the health counters (`save.completion_failures`) are where that
 * shows up as a problem someone can act on.
 *
 * ## Every access is guarded
 *
 * `localStorage` does not merely return null when unavailable — the accessor
 * itself throws in a private window and on a machine configured to block site
 * data, which is common on school hardware. Every call below is wrapped, and a
 * failure degrades to "nothing queued": the learner's session still works, it
 * just cannot be replayed later.
 */

const KEY = "solvex.pending.v1";
const MAX_PENDING = 50;

export interface PendingWrite {
  /** Where it goes. Only same-origin API paths are ever enqueued. */
  url: string;
  /** The JSON body, already serialised, so the queue never re-encodes it. */
  body: string;
  /** When it was first attempted. Kept so a stale queue is recognisable. */
  queuedAt: number;
}

function read(): PendingWrite[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (w): w is PendingWrite =>
        typeof w === "object" &&
        w !== null &&
        typeof (w as PendingWrite).url === "string" &&
        // Same-origin paths only. A queue that will POST anywhere is a queue
        // that will POST a learner's work anywhere the storage was tampered with.
        (w as PendingWrite).url.startsWith("/api/") &&
        typeof (w as PendingWrite).body === "string",
    );
  } catch {
    return [];
  }
}

function write(queue: PendingWrite[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(queue.slice(-MAX_PENDING)));
  } catch {
    /* Blocked or full. The session still works; this write will not be retried. */
  }
}

export function pendingCount(): number {
  if (typeof window === "undefined") return 0;
  return read().length;
}

export function enqueue(url: string, body: string): void {
  if (typeof window === "undefined") return;
  const queue = read();
  queue.push({ url, body, queuedAt: Date.now() });
  write(queue);
}

/**
 * Send everything queued, keeping whatever fails again.
 *
 * Sequential rather than parallel, deliberately: the reason these are queued is
 * usually that the server or the connection is struggling, and eighteen
 * simultaneous retries at 09:00 on the morning after an outage is the worst
 * possible way to greet a recovering box.
 *
 * A 4xx is treated as delivered and dropped. The server has looked at the body
 * and rejected it — an unknown lesson id, impossible counts, an unsatisfied
 * policy — and retrying it forever would mean one bad entry blocks the queue
 * behind it. Only 5xx and network failure are worth another attempt.
 */
export async function flushPending(): Promise<{ sent: number; kept: number }> {
  if (typeof window === "undefined") return { sent: 0, kept: 0 };
  const queue = read();
  if (queue.length === 0) return { sent: 0, kept: 0 };

  const kept: PendingWrite[] = [];
  let sent = 0;

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: item.body,
      });
      if (res.ok || (res.status >= 400 && res.status < 500)) sent += 1;
      else kept.push(item);
    } catch {
      kept.push(item);
    }
  }

  write(kept);
  return { sent, kept: kept.length };
}

/**
 * Post now, queue on failure.
 *
 * `keepalive` is kept from the original: the completion screen is frequently
 * followed by a navigation, and without it the browser cancels the request on
 * unload. Its 64KB body limit is far above anything posted here.
 *
 * Returns whether the server accepted it, so a caller can say so. A caller that
 * does not care can ignore the promise — the queue has the write either way.
 */
export async function postOrQueue(url: string, payload: unknown): Promise<boolean> {
  const body = JSON.stringify(payload);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body,
    });
    if (res.ok) return true;
    /* A 4xx is a refusal, not an outage: the server read the body and said no.
       Queuing it would retry a request that will be refused identically every
       time. It is dropped here and shows up in the server's own logs, which is
       where a malformed client belongs. */
    if (res.status >= 400 && res.status < 500) return false;
  } catch {
    /* Network. Falls through to the queue. */
  }
  enqueue(url, body);
  return false;
}
