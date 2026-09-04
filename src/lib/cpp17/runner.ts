/**
 * The C++17 runner — lifecycle, cancellation and the deadline.
 *
 * Owns the worker rather than the compiler. Three things live here because
 * none of them can live on the other side of the message port:
 *
 * 1. **The time limit.** A worker cannot time itself out. `while (true) {}`
 *    never yields, so no callback inside it ever runs — including one that
 *    would check a clock. WebAssembly has no interrupt. The only thing that
 *    reliably stops it is `Worker.terminate()`, and only the owner of the
 *    handle can call that.
 *
 * 2. **Cancellation.** A learner who edits and presses Run again wants the new
 *    answer, and must never be shown the old one. Every job carries an id and
 *    a stale reply is dropped on arrival.
 *
 * 3. **Recovery.** A terminated worker leaves nothing behind, so the next Run
 *    starts a fresh one and pays the init cost again. That is the correct
 *    trade: an infinite loop is rare and a frozen tab is unrecoverable.
 */

import {
  LOCAL_LIMITS,
  type LocalRunRequest,
  type LocalRunResult,
} from "@schools/execution/trust";
import { DEFAULT_CPP17_BASE_URL, type WorkerInbound, type WorkerOutbound } from "./worker";

/** The lifecycle a caller can observe. */
export type RunnerPhase = "idle" | "loading" | "ready" | "compiling" | "running" | "failed";

/**
 * How long the BUILD may take, as distinct from how long the program may run.
 *
 * These were one number, and it was `LOCAL_LIMITS.timeLimitMs` — 3 seconds —
 * started when the job was posted and covering compile, link and run together.
 * Two things followed, both observed rather than reasoned about:
 *
 *   - A program with no `main` should fail to LINK instantly. It was reported
 *     as «Бағдарлама 3 секундта аяқталмады — шексіз цикл болуы мүмкін»: did not
 *     finish, possibly an infinite loop. It had not run at all.
 *   - `#include <bits/stdc++.h>` takes about FOUR seconds to compile — measured,
 *     and written down in `CPP17_JUDGE_PARITY.md` — which is longer than the
 *     whole budget. Every program using it was unrunnable by construction, and
 *     blamed on a loop it did not contain. That header is what May's contest
 *     lessons teach.
 *
 * So the build gets its own ceiling, generous because a cold compile on a
 * school laptop is slow and being slow is not a defect, and the learner's
 * 3 seconds now start when the program does.
 */
export const COMPILE_BUDGET_MS = 30_000;

export interface RunnerStatus {
  phase: RunnerPhase;
  /** Null until a worker has reported for itself. Never a written-down pin. */
  initMs: number | null;
  /** Why the runtime failed to start. Never a statement about learner code. */
  error: string | null;
  /**
   * Toolchain bytes downloaded so far, and how many there are.
   *
   * Real decoded bytes counted at the stream against the real total from
   * `assets.ts` — never a percentage derived from `content-length`, which is
   * the compressed length and would count to about 300%.
   *
   * `loadedBytes` is 0 and `totalBytes` is null until a worker starts loading.
   * Null is a distinct state from 0 and the panel needs both: "nothing has
   * started" and "started, nothing has arrived yet" are different sentences to
   * a learner staring at a school connection.
   */
  loadedBytes: number;
  totalBytes: number | null;
}

export const IDLE_STATUS: RunnerStatus = Object.freeze({
  phase: "idle" as const,
  initMs: null,
  error: null,
  loadedBytes: 0,
  totalBytes: null,
});

/**
 * How long the toolchain may take to arrive before the runner gives up.
 *
 * Generous, because it is 57 MB and a school connection is a school
 * connection: at 2 Mbit/s that is about four minutes, and a learner who waits
 * it out gets a working compiler. But not unbounded — `ensureWorker` had no
 * ceiling at all, so a connection that stalled left `warm()` pending forever
 * and the panel showing «C++ дайындалып жатыр…» with nothing behind it and no
 * way to retry.
 *
 * Distinct from `COMPILE_BUDGET_MS`: that one bounds a BUILD, and the whole
 * point of the preload is that a download is no longer billed to it.
 */
export const INIT_BUDGET_MS = 300_000;

/** The slice of `Worker` used here, so a test fake needs four members. */
export interface RunnerWorker {
  postMessage(message: WorkerInbound): void;
  terminate(): void;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}

export interface Cpp17RunnerOptions {
  baseUrl?: string;
  workerUrl?: string;
  createWorker?: () => RunnerWorker;
}

/** The result shape for a run that never reached the compiler. */
function unavailable(runtimeMs = 0): LocalRunResult {
  return {
    trust: "client_local",
    status: "runtime_unavailable",
    stdout: "",
    stderr: "",
    truncated: false,
    runtimeMs,
  };
}

export class Cpp17Runner {
  private worker: RunnerWorker | null = null;
  private booting: Promise<void> | null = null;
  private state: RunnerStatus = IDLE_STATUS;
  private listeners = new Set<() => void>();

  /** Monotonic, and the whole of the cancellation model. */
  private nextJobId = 1;
  /**
   * The job the caller has claimed, set BEFORE any await.
   *
   * `inflight` cannot serve this purpose: it is only populated once the worker
   * is warm, so two Run presses in the same tick both find it empty, both
   * proceed, and the first caller's promise ends up with nobody holding its
   * `resolve`. This is claimed synchronously on entry, so the second press can
   * see the first even though the first has not reached the worker yet.
   */
  private claimed: number | null = null;

  /**
   * Set once by `dispose`, never un-set.
   *
   * Belt to `kill`'s braces, and honestly labelled as such: `dispose` goes
   * through `kill`, which clears the deadline timer, so the re-warm below
   * cannot currently fire for a disposed runner and a mutation test says so.
   * It is one line standing between a future refactor of `kill` and a page
   * nobody is on downloading a compiler.
   */
  private disposed = false;
  private inflight: {
    id: number;
    resolve: (r: LocalRunResult) => void;
    /** The BUILD ceiling until the program starts, the execution deadline after. */
    timer: ReturnType<typeof setTimeout>;
    /** How long the learner's program itself may run, once it is running. */
    budget: number;
  } | null = null;

  constructor(private readonly options: Cpp17RunnerOptions = {}) {}

  status(): RunnerStatus {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(next: Partial<RunnerStatus>): void {
    this.state = { ...this.state, ...next };
    for (const l of this.listeners) l();
  }

  private spawn(): RunnerWorker {
    if (this.options.createWorker) return this.options.createWorker();
    const url = this.options.workerUrl ?? "/cpp17-worker.js";
    return new Worker(url, { type: "module" }) as unknown as RunnerWorker;
  }

  /**
   * Start a worker, or reuse the warm one.
   *
   * Lazy on purpose: 57 MB of compiler must not be fetched because a learner
   * opened a lesson. It is fetched when they press Run.
   */
  private ensureWorker(): Promise<void> {
    if (this.worker && this.state.phase !== "failed") return this.booting ?? Promise.resolve();
    if (this.booting) return this.booting;

    this.setState({ phase: "loading", error: null, loadedBytes: 0, totalBytes: null });
    const worker = this.spawn();
    this.worker = worker;

    this.booting = new Promise<void>((resolve, reject) => {
      /*
       * A ceiling on the download, which had none.
       *
       * The worker now fetches the whole 57 MB before it reports ready — that
       * is the preload fix — so this promise is open for as long as the
       * connection takes. Without a ceiling a stalled connection left `warm()`
       * pending forever and the panel showing «C++ дайындалып жатыр…» with
       * nothing behind it and no way to retry.
       *
       * On expiry the worker is terminated and the state is `failed`, which is
       * what puts the panel's retry affordance on screen. The next press starts
       * a fresh worker — and every byte that DID arrive is in the HTTP cache,
       * so a retry resumes in effect rather than starting over.
       */
      const timer = setTimeout(() => {
        const error = `toolchain download did not finish in ${Math.round(INIT_BUDGET_MS / 1000)}s`;
        worker.terminate();
        if (this.worker === worker) this.worker = null;
        this.setState({ phase: "failed", error });
        reject(new Error(error));
      }, INIT_BUDGET_MS);

      const settleBoot = (fn: () => void) => {
        clearTimeout(timer);
        fn();
      };

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data as WorkerOutbound;
        if (msg.kind === "progress") {
          /* Only while this worker is the one loading. A late message from a
             worker that has been superseded must not move a bar that now
             belongs to its replacement. */
          if (this.worker === worker) {
            this.setState({ loadedBytes: msg.loadedBytes, totalBytes: msg.totalBytes });
          }
          return;
        }
        if (msg.kind === "ready") {
          settleBoot(() => {
            this.setState({ phase: "ready", initMs: msg.initMs, error: null });
            resolve();
          });
          return;
        }
        if (msg.kind === "failed") {
          settleBoot(() => {
            this.setState({ phase: "failed", error: msg.error });
            reject(new Error(msg.error));
          });
          return;
        }
        if (msg.kind === "running") this.beginExecution(msg.id);
        if (msg.kind === "result") this.settle(msg);
      };
      worker.onerror = (event: ErrorEvent) => {
        const error = event.message || "worker error";
        settleBoot(() => {
          this.setState({ phase: "failed", error });
          reject(new Error(error));
        });
      };
      worker.postMessage({ kind: "init", baseUrl: this.options.baseUrl ?? DEFAULT_CPP17_BASE_URL });
    }).finally(() => {
      this.booting = null;
    });

    return this.booting;
  }

  /**
   * The build finished; the learner's program is now running.
   *
   * Swaps the build ceiling for the execution deadline. Until this arrives the
   * clock is measuring OUR compiler, and a slow compiler is not something to
   * put on a child's record.
   */
  private beginExecution(id: number): void {
    const job = this.inflight;
    if (!job || job.id !== id || id !== this.claimed) return;
    clearTimeout(job.timer);
    this.setState({ phase: "running" });
    job.timer = setTimeout(() => {
      this.kill({
        trust: "client_local",
        status: "time_limit_exceeded",
        stdout: "",
        stderr: "",
        truncated: false,
        runtimeMs: job.budget,
      });
      if (!this.disposed) void this.warm();
    }, job.budget);
  }

  /** A reply arrived. Deliver it only if it belongs to the current job. */
  private settle(msg: Extract<WorkerOutbound, { kind: "result" }>): void {
    const job = this.inflight;
    /* The whole of stale-result protection. A superseded job's reply lands here
       with an id nobody is waiting for and goes in the bin — it can never
       overwrite a newer run's answer. */
    if (!job || job.id !== msg.id || msg.id !== this.claimed) return;
    clearTimeout(job.timer);
    this.inflight = null;
    this.claimed = null;
    this.setState({ phase: "ready" });
    job.resolve({
      trust: "client_local",
      status: msg.status,
      stdout: msg.stdout,
      stderr: msg.stderr,
      truncated: msg.truncated,
      runtimeMs: msg.runtimeMs,
    });

    /* The learner's program opened a file, so this worker's in-memory
     * filesystem is no longer the one we built.
     *
     * Answer them first — they get their output, and the run they just made is
     * honest — then throw the worker away and build a clean one. Verified in a
     * browser: without this, a program that writes `include/bits/stdc++.h`
     * breaks every compile for the rest of the page's life, in lessons that
     * have nothing to do with the one where they experimented, with a
     * diagnostic naming a header they never opened.
     *
     * The same recycle the deadline uses, for the same reason: there is no way
     * to un-write a file inside a wasm memfs, so the memfs is replaced. */
    if (msg.filesystemTouched && !this.disposed) {
      this.kill(null);
      void this.warm();
    }
  }

  /**
   * Kill the worker and answer the job that was on it.
   *
   * Used for the deadline and for disposal. Terminating is not a last resort
   * here, it is the mechanism: there is no other way to stop a WebAssembly
   * instance that has stopped yielding.
   *
   * Leaves the runner at `idle` with no worker, which `ensureWorker` treats as
   * "spawn a fresh one". Whether anybody ever asks it to is the caller's
   * problem, and `disposed` is why that matters — see `run`'s deadline.
   */
  private kill(reason: LocalRunResult | null): void {
    const job = this.inflight;
    this.inflight = null;
    this.claimed = null;
    if (job) clearTimeout(job.timer);
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.terminate();
      this.worker = null;
    }
    this.booting = null;
    this.setState({ phase: "idle", initMs: null });
    if (job && reason) job.resolve(reason);
  }

  /**
   * Bring the toolchain up without compiling anything.
   *
   * A separate verb from `run` because warming by running an empty source is a
   * real compile — about a second of the learner's laptop spent building a
   * translation unit nobody asked for, and on a phone that is a second of
   * battery and heat for nothing.
   */
  async warm(): Promise<boolean> {
    try {
      await this.ensureWorker();
      return this.worker !== null;
    } catch {
      return false;
    }
  }

  /**
   * Compile and run the learner's source.
   *
   * Refuses oversized input before starting a compiler, for the same reason the
   * submit route refuses it before reaching the judge: the ceiling is ours, and
   * spending 700 ms of a learner's laptop to reject something is worse than
   * rejecting it immediately.
   */
  async run(request: LocalRunRequest): Promise<LocalRunResult> {
    const encoder = new TextEncoder();
    if (encoder.encode(request.source).length > LOCAL_LIMITS.maxSourceBytes) {
      return { ...unavailable(), status: "output_limit_exceeded" };
    }
    if (encoder.encode(request.stdin).length > LOCAL_LIMITS.maxStdinBytes) {
      return { ...unavailable(), status: "output_limit_exceeded" };
    }

    /*
     * Supersede whatever was running, SYNCHRONOUSLY, before the first await.
     *
     * This used to sit after `await this.ensureWorker()`, and two Run presses
     * in the same tick both got past it: neither saw the other's `inflight`
     * because neither had set it yet. Both then posted to the same worker, the
     * second overwrote `this.inflight`, and the first caller's promise was left
     * with nobody holding its `resolve` — a Run that never returns and a
     * spinner that never stops. The id is claimed here for the same reason.
     *
     * Terminating rather than queueing is deliberate. The worker is
     * single-threaded and already inside a compile; it will not read another
     * message until it finishes, so "just send the new job" means the learner
     * waits for the run they abandoned. Re-init costs ~100 ms because the 57 MB
     * is in the HTTP cache — the assets are not fetched again, only the sysroot
     * is untarred.
     */
    const id = this.nextJobId++;
    const superseded = this.claimed !== null;
    if (superseded) {
      /* Answers the abandoned caller rather than leaving it pending forever,
         and stops the worker that is still inside its compile — single
         threaded, so it would not read a new message until it finished the run
         the learner has already walked away from. */
      this.kill(unavailable());
    }
    this.claimed = id;

    try {
      await this.ensureWorker();
    } catch {
      if (this.claimed === id) this.claimed = null;
      return unavailable();
    }
    const worker = this.worker;
    if (!worker) {
      if (this.claimed === id) this.claimed = null;
      return unavailable();
    }
    /* Claimed while this one was awaiting a worker: the learner pressed Run
       again and that press already owns the slot. Answer this caller and stop. */
    if (this.claimed !== id) return unavailable();

    const started = Date.now();
    const budget = request.timeLimitMs ?? LOCAL_LIMITS.timeLimitMs;

    /* `compiling` now, and the worker flips it to `running` when clang and lld
       are done — a learner waiting four seconds on `bits/stdc++.h` should be
       told which of the two steps they are waiting on. */
    this.setState({ phase: "compiling" });

    return new Promise<LocalRunResult>((resolve) => {
      /* The BUILD ceiling. Replaced by the execution deadline the moment the
         worker says the program started — see `beginExecution`. */
      const timer = setTimeout(() => {
        /* The worker is not asked to stop — it cannot — it is destroyed, and
           the next Run builds a new one.
         *
         * `runtime_unavailable`, NOT `time_limit_exceeded`, and the difference
         * matters: `isLearnerOutcome` excludes the first and includes the
         * second. A compiler that took half a minute on a school laptop is our
         * outage, and recording "did not finish" against a child for it is the
         * same mistake as blaming them for a dead judge. */
        this.kill({
          ...unavailable(),
          runtimeMs: Date.now() - started,
        });
        /* And immediately build the replacement.
         *
         * Without this the learner is stuck. `kill` leaves the runner at
         * `idle`, the panel renders `idle` as «C++ дайындалып жатыр…» — which
         * is the honest reading at mount, when a preload really is about to
         * start — and nothing was going to start one. The Run button never came
         * back. A first infinite loop is not an edge case in a course for
         * beginners; `while (true)` is what a learner writes in the lesson
         * where loops are introduced, and the product's answer to it cannot be
         * "reload the page".
         *
         * Re-warming here makes the state the panel already shows true. It
         * costs an instantiate, not a download: the wasm is in the HTTP cache
         * by definition, since it was serving a program a moment ago. */
        if (!this.disposed) void this.warm();
      }, COMPILE_BUDGET_MS);

      this.inflight = { id, resolve, timer, budget };
      worker.postMessage({
        kind: "run",
        id,
        source: request.source,
        stdin: request.stdin,
        maxOutputBytes: request.maxOutputBytes ?? LOCAL_LIMITS.maxOutputBytes,
      });
    });
  }

  /** Navigating away. Nothing keeps compiling for a page nobody is on. */
  dispose(): void {
    this.disposed = true;
    this.kill(unavailable());
    this.listeners.clear();
  }
}
