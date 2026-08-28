/**
 * The main thread's half of local Python execution.
 *
 * The worker owns CPython; this file owns the WORKER — when it is created, when
 * it is killed, and what a learner is told when it is. That split is the whole
 * design, because every limit this product enforces locally is enforced by
 * killing a thread that cannot be asked to stop:
 *
 * - **Time limit.** There is no cooperative interrupt without a
 *   `SharedArrayBuffer` interrupt buffer, which needs COOP/COEP headers this
 *   deployment does not send. `while True: pass` will run until the tab closes.
 *   So the timer lives here, and it fires `terminate()`.
 * - **Output cap.** The worker stops ACCOUNTING at the ceiling — memory is
 *   bounded there — but it still cannot stop Python. It escalates, and the kill
 *   happens here.
 * - **A broken interpreter.** A WASM heap that has hit its limit, or a Pyodide
 *   that unwound through its own harness, is not something to keep running
 *   lessons on.
 *
 * In all three cases the worker is replaced, not reused, and the replacement is
 * started immediately so the learner's next press is not waiting on it.
 *
 * ## Why the worker is injected
 *
 * `createWorker` is a constructor parameter with a browser default. Node has no
 * `Worker` and no WASM Pyodide, so without that seam nothing in this file could
 * be asserted at all — the terminate-and-replace path, the run-id bookkeeping
 * that stops a dead worker's late message from answering the next press, the
 * status mapping. With it, all of that is ordinary unit-testable code and only
 * the Python itself needs a browser.
 */

import {
  LOCAL_LIMITS,
  type LocalExecutionStatus,
  type LocalRunRequest,
  type LocalRunResult,
} from "@schools/execution/trust";
import { DEFAULT_PYODIDE_BASE_URL, type WorkerInbound, type WorkerOutbound } from "./worker";

/* -------------------------------------------------------------------------- */
/* The seam                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The slice of `Worker` this file uses.
 *
 * A real `Worker` satisfies it structurally, so the browser default needs no
 * cast; a test fake satisfies it with four members. `onerror` is typed as
 * `ErrorEvent` rather than `Event` precisely so the real `Worker` stays
 * assignable — the DOM's own signature is narrower than `Event`.
 */
export interface RunnerWorker {
  postMessage(message: WorkerInbound): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

/**
 * What the UI needs to know before it draws a Run button.
 *
 * `loading` is a first-class value rather than "not ready yet" because a 13 MB
 * CPython download on a shared school connection is a visible event, and the
 * honest thing to show is «Python дайындалып жатыр…» rather than a Run button
 * that appears to do nothing for eight seconds.
 */
export type RunnerPhase =
  /** Nothing has been downloaded. Nothing will be, until someone asks. */
  | "idle"
  | "loading"
  | "ready"
  /** Pyodide did not start. Retryable — the next `ensureReady` tries again. */
  | "unavailable";

export interface RunnerStatus {
  phase: RunnerPhase;
  /** e.g. `"314.0.6"`. Null until the runtime has answered for itself. */
  pyodideVersion: string | null;
  /** The interpreter's own `platform.python_version()`, not a written-down pin. */
  pythonVersion: string | null;
  /** Why boot failed, if it did. Never a statement about the learner's code. */
  error: string | null;
}

/**
 * The state before anything has been asked for — and the answer on the server,
 * where there is no browser to load a runtime into. Frozen and shared so a
 * server render and the first client render agree by identity.
 */
export const IDLE_STATUS: RunnerStatus = Object.freeze({
  phase: "idle" as const,
  pyodideVersion: null,
  pythonVersion: null,
  error: null,
});

export interface PythonRunnerOptions {
  createWorker?: () => RunnerWorker;
  /** Where `public/pyodide/` is served from. Only a `basePath` would change it. */
  baseUrl?: string;
  timeLimitMs?: number;
  maxOutputBytes?: number;
}

/* -------------------------------------------------------------------------- */
/* The runner                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * How long a boot may take before we stop waiting for it.
 *
 * There was no such limit, and its absence was a hang rather than a slow path.
 * `boot_failed` covers a fetch that FAILS; nothing covered one that simply
 * never answers — a school connection that drops mid-download of a 13 MB WASM
 * file, a proxy that accepts the request and holds it open, a tab throttled to
 * death in the background. In every one of those the worker sends nothing at
 * all, `ensureReady()` waits on a promise no one will settle, and because
 * `run()` serialises behind it the Run button spins for the rest of the lesson.
 *
 * Thirty seconds is chosen against the real download rather than as a round
 * number: ~13 MB of runtime over a slow school link is tens of seconds on the
 * first visit, and cutting a boot that WOULD have succeeded is the worse
 * failure — it turns a slow lesson into a broken one. After the first visit the
 * files are in the HTTP cache and boot is a second or two.
 */
const BOOT_TIMEOUT_MS = 30_000;

interface Pending {
  id: number;
  startedAt: number;
  timer: ReturnType<typeof setTimeout>;
  stdout: string;
  stderr: string;
  settle: (result: LocalRunResult) => void;
}

export class PythonRunner {
  private readonly createWorker: () => RunnerWorker;
  private readonly baseUrl: string;
  private readonly timeLimitMs: number;
  private readonly maxOutputBytes: number;

  private worker: RunnerWorker | null = null;
  private phase: RunnerPhase = "idle";
  private pyodideVersion: string | null = null;
  private pythonVersion: string | null = null;
  private error: string | null = null;
  private disposed = false;
  /**
   * The frozen answer `status()` hands out.
   *
   * Cached rather than built on demand because React's `useSyncExternalStore`
   * compares snapshots by identity: a `status()` that returned a fresh object
   * every call would look like a change on every render and loop forever.
   */
  private snapshot: RunnerStatus = IDLE_STATUS;

  /** Resolvers waiting on the current boot. Settled with "did it work". */
  private bootWaiters: ((ready: boolean) => void)[] = [];
  /** Fires if the worker never answers `ready` or `boot_failed`. */
  private bootTimer: ReturnType<typeof setTimeout> | null = null;
  private pending: Pending | null = null;
  private nextRunId = 1;
  /** Serialises runs. One interpreter, one program at a time. */
  private queue: Promise<void> = Promise.resolve();
  private readonly listeners = new Set<() => void>();

  constructor(options: PythonRunnerOptions = {}) {
    this.createWorker = options.createWorker ?? defaultWorkerFactory;
    this.baseUrl = options.baseUrl ?? DEFAULT_PYODIDE_BASE_URL;
    this.timeLimitMs = options.timeLimitMs ?? LOCAL_LIMITS.timeLimitMs;
    this.maxOutputBytes = options.maxOutputBytes ?? LOCAL_LIMITS.maxOutputBytes;
  }

  status(): RunnerStatus {
    return this.snapshot;
  }

  /** Notified whenever `status()` would return something different. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Download and initialise CPython, if that has not already happened.
   *
   * Resolves `true` when the runtime is usable and `false` when it is not; it
   * never rejects, because "Pyodide would not start" is a state the lesson has
   * to render, not an exception for a `catch` somewhere to swallow.
   *
   * This is what makes the load LAZY. Nothing in this module runs on import, so
   * a learner who opens `/home` downloads nothing; the first call comes from a
   * coding block mounting or from the first press of Run.
   */
  ensureReady(): Promise<boolean> {
    if (this.disposed) return Promise.resolve(false);
    if (this.phase === "ready" && this.worker) return Promise.resolve(true);

    if (!this.worker) {
      /* A previous `unavailable` is not permanent. School Wi-Fi comes back, and
         a learner who presses Run again deserves a second attempt rather than a
         lesson that is broken for the rest of the hour. */
      this.spawn();
    }
    return new Promise<boolean>((resolve) => this.bootWaiters.push(resolve));
  }

  /**
   * Run the learner's program.
   *
   * Never throws and never rejects: every failure — including ours — is a
   * `LocalRunResult` with an honest status, because the caller is a Run button
   * and there is no sensible thing for it to do with an exception.
   */
  async run(request: LocalRunRequest): Promise<LocalRunResult> {
    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await this.runExclusive(request);
    } finally {
      release();
    }
  }

  /** Kill the worker and forget the runtime. The next `ensureReady` rebuilds. */
  dispose(): void {
    this.disposed = true;
    if (this.bootTimer !== null) {
      clearTimeout(this.bootTimer);
      this.bootTimer = null;
    }
    this.teardown();
    this.setPhase("idle");
    this.listeners.clear();
  }

  /* ---------------------------------------------------------------------- */

  private async runExclusive(request: LocalRunRequest): Promise<LocalRunResult> {
    const oversize = this.refuseOnSize(request);
    if (oversize) return oversize;

    const ready = await this.ensureReady();
    const worker = this.worker;
    if (!ready || !worker) {
      return unavailable(
        this.error ?? "Python браузерде іске қосылмады / Python did not start in the browser.",
      );
    }

    const id = this.nextRunId++;
    const startedAt = now();

    return new Promise<LocalRunResult>((resolve) => {
      const timer = setTimeout(() => this.onTimeout(id), request.timeLimitMs ?? this.timeLimitMs);
      this.pending = { id, startedAt, timer, stdout: "", stderr: "", settle: resolve };
      worker.postMessage({
        kind: "run",
        id,
        source: request.source,
        stdin: request.stdin,
        maxOutputBytes: request.maxOutputBytes ?? this.maxOutputBytes,
      });
    });
  }

  /**
   * Refuse a payload that is over the shared ceiling, before it is copied into
   * a worker.
   *
   * ## Why `runtime_unavailable` for something that is plainly not the runtime
   *
   * The server has a status for exactly this — `payload_too_large`, with
   * `infrastructureError: true` — and `LocalExecutionStatus` deliberately does
   * not, because the browser's failure modes are a different set. Of the five
   * remaining values, `runtime_unavailable` is the only one for which
   * `isLearnerOutcome` returns false, and THAT is the property that has to
   * survive: a learner who pasted a megabyte has not written a wrong program,
   * and nothing downstream may record it as one. The name is a compromise; the
   * stderr says plainly what happened, and the invariant is the right one.
   *
   * `trust.ts` says the source ceiling exists "so a paste fails in one place" —
   * meaning the editor. This is the backstop for when it does not, not a
   * replacement for it.
   */
  private refuseOnSize(request: LocalRunRequest): LocalRunResult | null {
    const sourceBytes = byteLength(request.source);
    if (sourceBytes > LOCAL_LIMITS.maxSourceBytes) {
      return unavailable(
        `Бағдарлама тым үлкен / Program too large: ${sourceBytes} bytes, ` +
          `limit ${LOCAL_LIMITS.maxSourceBytes}. Nothing was run.`,
      );
    }
    const stdinBytes = byteLength(request.stdin);
    if (stdinBytes > LOCAL_LIMITS.maxStdinBytes) {
      return unavailable(
        `Кіріс деректері тым үлкен / Input too large: ${stdinBytes} bytes, ` +
          `limit ${LOCAL_LIMITS.maxStdinBytes}. Nothing was run.`,
      );
    }
    return null;
  }

  private spawn(): void {
    this.error = null;
    this.setPhase("loading");
    let worker: RunnerWorker;
    try {
      worker = this.createWorker();
    } catch (cause: unknown) {
      /* No `Worker` at all — an ancient browser, or a bundler that did not emit
         the worker chunk. Nothing about the learner. */
      this.failBoot(describe(cause));
      return;
    }
    worker.onmessage = (event: MessageEvent) => this.receive(event.data as WorkerOutbound);
    worker.onerror = (event: ErrorEvent) =>
      this.failBoot(event.message || "the Python worker failed to start");
    this.worker = worker;
    this.bootTimer = setTimeout(() => {
      this.bootTimer = null;
      /* Silence, not a refusal. Reported as our problem in both languages —
         `runtime_unavailable` is never recorded against the learner. */
      this.failBoot(
        "Python жүктелмеді — байланысты тексер / Python did not finish loading — check the connection.",
      );
    }, BOOT_TIMEOUT_MS);
    worker.postMessage({ kind: "boot", baseUrl: this.baseUrl });
  }

  private receive(message: WorkerOutbound): void {
    switch (message.kind) {
      case "ready":
        this.pyodideVersion = message.pyodideVersion;
        this.pythonVersion = message.pythonVersion;
        this.error = null;
        this.setPhase("ready");
        this.releaseBootWaiters(true);
        return;

      case "boot_failed":
        this.failBoot(message.message);
        return;

      case "progress":
        if (this.pending?.id !== message.id) return;
        this.pending.stdout = message.stdout;
        this.pending.stderr = message.stderr;
        return;

      case "output_limit": {
        const pending = this.claim(message.id);
        if (!pending) return;
        /* The worker told us as the ceiling was crossed and has been dropping
           bytes ever since; it is still inside the learner's loop and cannot
           leave it. Killing it is the stop button. */
        this.replaceWorker();
        pending.settle({
          trust: "client_local",
          status: "output_limit_exceeded",
          stdout: message.stdout,
          stderr: message.stderr,
          truncated: true,
          runtimeMs: message.runtimeMs,
        });
        return;
      }

      case "done": {
        const pending = this.claim(message.id);
        if (!pending) return;
        if (message.status === "runtime_unavailable") this.replaceWorker();
        pending.settle({
          trust: "client_local",
          status: message.status,
          stdout: message.stdout,
          stderr: message.stderr,
          truncated: message.truncated,
          runtimeMs: message.runtimeMs,
        });
        return;
      }
    }
  }

  /**
   * The budget expired.
   *
   * ## What this measurement is and is not
   *
   * It is wall time on the main thread, which a backgrounded tab can stretch
   * (timers are clamped when a tab is hidden) — so the number of seconds a
   * learner actually got is not exactly the number here. That is tolerable
   * precisely because a local result is `client_local` and can never become
   * evidence: `trust-policy.ts` allows it to settle a lesson step and nothing
   * more. The same imprecision on the SERVER would be the bug
   * `schools/exec/provider.ts` spends forty lines refusing.
   */
  private onTimeout(id: number): void {
    const pending = this.claim(id);
    if (!pending) return;
    this.replaceWorker();
    pending.settle({
      trust: "client_local",
      status: "time_limit_exceeded",
      stdout: pending.stdout,
      stderr: pending.stderr,
      truncated: false,
      runtimeMs: Math.round(now() - pending.startedAt),
    });
  }

  /** Take ownership of the in-flight run, if the id still matches. */
  private claim(id: number): Pending | null {
    const pending = this.pending;
    if (!pending || pending.id !== id) return null;
    clearTimeout(pending.timer);
    this.pending = null;
    return pending;
  }

  /**
   * Terminate and start a replacement.
   *
   * The replacement is started EAGERLY rather than on the next press: the
   * runtime's files are already in the browser's HTTP cache, so re-initialising
   * costs about a second — and that second is much better spent while the
   * learner is reading why their loop never finished than after they have fixed
   * it and pressed Run again.
   */
  private replaceWorker(): void {
    this.teardown();
    if (this.disposed) return;
    this.spawn();
  }

  private teardown(): void {
    const worker = this.worker;
    this.worker = null;
    if (!worker) return;
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
  }

  private failBoot(message: string): void {
    this.error = message;
    this.pyodideVersion = null;
    this.pythonVersion = null;
    /* Drop the worker WITHOUT respawning. A boot that failed would fail again
       immediately, and an eager retry loop would hammer a school's connection
       with 13 MB requests. The retry is the learner's next press. */
    this.teardown();
    this.setPhase("unavailable");
    this.releaseBootWaiters(false);

    /* A run that was already in flight cannot be finished by a worker that no
       longer exists. Settle it honestly rather than leaving the button spinning. */
    const pending = this.pending;
    if (pending) {
      clearTimeout(pending.timer);
      this.pending = null;
      pending.settle(unavailable(message));
    }
  }

  private releaseBootWaiters(ready: boolean): void {
    /* Cleared here rather than in each caller: `ready` and `boot_failed` and
       the timeout itself all end up here, and a timer left armed after a
       successful boot would tear down a working runtime half a minute later. */
    if (this.bootTimer !== null) {
      clearTimeout(this.bootTimer);
      this.bootTimer = null;
    }
    const waiters = this.bootWaiters;
    this.bootWaiters = [];
    for (const waiter of waiters) waiter(ready);
  }

  /** Every mutation of observable state ends here, so nothing can change silently. */
  private setPhase(phase: RunnerPhase): void {
    this.phase = phase;
    this.snapshot = Object.freeze({
      phase,
      pyodideVersion: this.pyodideVersion,
      pythonVersion: this.pythonVersion,
      error: this.error,
    });
    for (const listener of this.listeners) listener();
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The browser default.
 *
 * `new URL("./worker.ts", import.meta.url)` is the form both Turbopack and
 * webpack recognise as "this is a worker entry, emit it as its own chunk". It
 * must stay a literal — a computed path silently becomes a runtime 404.
 */
function defaultWorkerFactory(): RunnerWorker {
  return new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
    name: "solvex-python",
  });
}

function unavailable(message: string): LocalRunResult {
  return {
    trust: "client_local",
    status: "runtime_unavailable" satisfies LocalExecutionStatus,
    stdout: "",
    stderr: message,
    truncated: false,
    runtimeMs: 0,
  };
}

const encoder = new TextEncoder();
function byteLength(value: string): number {
  return encoder.encode(value).length;
}

function now(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  return String(error);
}

/* -------------------------------------------------------------------------- */
/* The shared instance                                                        */
/* -------------------------------------------------------------------------- */

let shared: PythonRunner | null = null;

/**
 * One runtime per page session.
 *
 * "Warm reuse" is the point: a lesson has several coding blocks and a learner
 * presses Run dozens of times, and re-downloading CPython for any of that would
 * turn a 30 ms interaction into a 2 s one. So the instance outlives the
 * components that use it and is NOT disposed when a block unmounts — a client
 * navigation from one block to the next keeps the warm interpreter, and a full
 * page load drops it the way it drops everything else.
 */
export function getPythonRunner(): PythonRunner {
  shared ??= new PythonRunner();
  return shared;
}

/** For tests and for a deliberate teardown. The next call rebuilds. */
export function resetPythonRunner(): void {
  shared?.dispose();
  shared = null;
}
