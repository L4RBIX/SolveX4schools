import { describe, expect, it, vi } from "vitest";
import { Cpp17Runner, type RunnerWorker } from "../../src/lib/cpp17/runner";
import { classifyFailure, stripProgress } from "../../src/lib/cpp17/worker";
import { BITS_STDCPP_HEADERS, BITS_STDCPP_PATH, bitsStdcppSource } from "../../src/lib/cpp17/bits-stdcpp";
import { LOCAL_LIMITS } from "@schools/execution/trust";

/**
 * The three things the worker cannot do for itself.
 *
 * A worker cannot time itself out, cannot know it has been superseded, and
 * cannot clean up after a page that has gone. All three live in the runner, so
 * all three are tested here — against a fake worker, because the real one is
 * 57 MB of compiler and none of this is about compiling.
 */

/** A worker that answers when told to, and records whether it was killed. */
class FakeWorker implements RunnerWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  terminated = false;
  posted: unknown[] = [];
  /** Job ids received, so a test can reply to a specific one. */
  private ids: number[] = [];

  constructor(private readonly autoReady = true) {}

  postMessage(message: unknown): void {
    this.posted.push(message);
    const m = message as { kind: string; id?: number };
    if (m.kind === "init" && this.autoReady) {
      queueMicrotask(() => this.emit({ kind: "ready", initMs: 5 }));
    }
    if (m.kind === "run" && typeof m.id === "number") this.ids.push(m.id);
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }

  /** Reply to the nth job this worker was given (0-based). */
  reply(index: number, patch: Record<string, unknown> = {}): void {
    this.emit({
      kind: "result",
      id: this.ids[index],
      status: "ok",
      stdout: "out",
      stderr: "",
      truncated: false,
      runtimeMs: 1,
      ...patch,
    });
  }

  jobCount(): number {
    return this.ids.length;
  }
}

/**
 * Let the boot handshake finish.
 *
 * Starting a run is several microtask turns — spawn, wire `onmessage`, post
 * `init`, let the fake answer `ready`, resolve `booting`, then post the job.
 * Counting `await Promise.resolve()` by hand is how these tests first failed,
 * with a timeout that looked like a product bug and was a test that had not
 * waited long enough.
 */
const flush = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

function runnerWith(worker: RunnerWorker) {
  return new Cpp17Runner({ createWorker: () => worker });
}

describe("the deadline", () => {
  it("kills the worker when a program does not finish, and says time_limit_exceeded", async () => {
    /* `while (true) {}` never yields, so nothing inside the worker can notice a
       clock. The only thing that stops it is terminate(), and only the runner
       can call that. */
    vi.useFakeTimers();
    const worker = new FakeWorker();
    const runner = runnerWith(worker);

    const promise = runner.run({ source: "int main(){for(;;);}", stdin: "" });
    await vi.advanceTimersByTimeAsync(1); // let init resolve
    await vi.advanceTimersByTimeAsync(LOCAL_LIMITS.timeLimitMs + 10);

    const result = await promise;
    expect(result.status).toBe("time_limit_exceeded");
    expect(worker.terminated, "a hung worker was left running").toBe(true);
    vi.useRealTimers();
  });

  it("recovers: the next run gets a fresh worker and a real answer", async () => {
    vi.useFakeTimers();
    const workers: FakeWorker[] = [];
    const runner = new Cpp17Runner({
      createWorker: () => {
        const w = new FakeWorker();
        workers.push(w);
        return w;
      },
    });

    const hung = runner.run({ source: "for(;;);", stdin: "" });
    await vi.advanceTimersByTimeAsync(LOCAL_LIMITS.timeLimitMs + 10);
    expect((await hung).status).toBe("time_limit_exceeded");

    const next = runner.run({ source: "int main(){}", stdin: "" });
    await vi.advanceTimersByTimeAsync(1);
    workers[1].reply(0);
    expect((await next).status).toBe("ok");
    expect(workers, "a timeout should have forced a new worker").toHaveLength(2);
    vi.useRealTimers();
  });

  it("comes back to a pressable state on its own, with nobody pressing anything", async () => {
    /* The regression this exists for.
     *
     * `run` has always healed itself — it spawns a worker when it finds none —
     * so the test above passed while the product was broken. What it did not
     * check is the state a learner is looking at BETWEEN the timeout and the
     * next press, and that is the only state that matters: the panel disables
     * Run for `idle` exactly as it does for `loading`, because at mount idle is
     * the half-frame before a preload starts. After a kill, nothing was going
     * to start one. The button read «C++ дайындалып жатыр…» forever and the
     * only cure was reloading the page.
     *
     * A first infinite loop is not an edge case here. `while (true)` is what a
     * beginner writes in the lesson that introduces loops, and it must cost
     * them three seconds, not their session. */
    vi.useFakeTimers();
    const workers: FakeWorker[] = [];
    const runner = new Cpp17Runner({
      createWorker: () => {
        const w = new FakeWorker();
        workers.push(w);
        return w;
      },
    });

    const hung = runner.run({ source: "int main(){for(;;);}", stdin: "" });
    await vi.advanceTimersByTimeAsync(LOCAL_LIMITS.timeLimitMs + 10);
    expect((await hung).status).toBe("time_limit_exceeded");

    /* No `run`, no `warm`, no remount — just time passing. */
    await vi.advanceTimersByTimeAsync(50);

    expect(
      runner.status().phase,
      "after a timeout the runner never came back; Run stays disabled until reload",
    ).toBe("ready");
    vi.useRealTimers();
  });

  it("does not resurrect itself after the page has gone", async () => {
    /* Navigating away mid-hang must not build a compiler for a dead page.
     *
     * What actually enforces this is `kill` clearing the deadline timer, not
     * the `disposed` flag — removing the flag leaves this test green, which was
     * checked rather than assumed. It is pinned here anyway because the
     * property is the product's, not the implementation's: whichever of the two
     * guards a later refactor keeps, a disposed runner spawns nothing. */
    vi.useFakeTimers();
    const workers: FakeWorker[] = [];
    const runner = new Cpp17Runner({
      createWorker: () => {
        const w = new FakeWorker();
        workers.push(w);
        return w;
      },
    });

    void runner.run({ source: "int main(){for(;;);}", stdin: "" });
    await vi.advanceTimersByTimeAsync(1);
    runner.dispose();
    await vi.advanceTimersByTimeAsync(LOCAL_LIMITS.timeLimitMs + 100);

    expect(workers, "a disposed runner built a worker for a dead page").toHaveLength(1);
    vi.useRealTimers();
  });
});

describe("cancellation", () => {
  it("a superseded run still settles, and with a status that is not a verdict", async () => {
    /* The learner edited and pressed Run again. The abandoned call must not
       hang forever holding a spinner — it resolves, and it resolves as
       `runtime_unavailable`, which `isLearnerOutcome` excludes from being
       recorded as anything the learner did. */
    const workers: FakeWorker[] = [];
    const runner = new Cpp17Runner({
      createWorker: () => {
        const w = new FakeWorker();
        workers.push(w);
        return w;
      },
    });

    const first = runner.run({ source: "A", stdin: "" });
    await flush();
    const second = runner.run({ source: "B", stdin: "" });
    await flush();

    workers[workers.length - 1].reply(0, { stdout: "B" });
    expect((await second).stdout).toBe("B");
    /* And the abandoned one is answered rather than abandoned. */
    expect((await first).status).toBe("runtime_unavailable");
  });

  it("superseding terminates the worker carrying the abandoned job", async () => {
    const workers: FakeWorker[] = [];
    const runner = new Cpp17Runner({
      createWorker: () => {
        const w = new FakeWorker();
        workers.push(w);
        return w;
      },
    });

    const first = runner.run({ source: "A", stdin: "" });
    await flush();
    const second = runner.run({ source: "B", stdin: "" });
    await flush();

    /* The worker was mid-compile and single-threaded; it would not have read a
       second message until it finished the one the learner abandoned. */
    expect(workers[0].terminated, "the abandoned job's worker kept running").toBe(true);
    void first; void second;
  });

  it("dispose() leaves nothing compiling for a page nobody is on", async () => {
    const worker = new FakeWorker();
    const runner = runnerWith(worker);
    const pending = runner.run({ source: "A", stdin: "" });
    await flush();

    runner.dispose();
    expect(worker.terminated).toBe(true);
    expect((await pending).status).toBe("runtime_unavailable");
  });
});

describe("ceilings are refused before a compiler is started", () => {
  it("an oversized source never reaches the worker", async () => {
    const worker = new FakeWorker();
    const runner = runnerWith(worker);
    const result = await runner.run({
      source: "x".repeat(LOCAL_LIMITS.maxSourceBytes + 1),
      stdin: "",
    });
    expect(result.status).toBe("output_limit_exceeded");
    expect(worker.jobCount(), "a 64 KiB+ paste started a compile").toBe(0);
  });

  it("oversized stdin never reaches the worker", async () => {
    const worker = new FakeWorker();
    const runner = runnerWith(worker);
    const result = await runner.run({
      source: "int main(){}",
      stdin: "x".repeat(LOCAL_LIMITS.maxStdinBytes + 1),
    });
    expect(result.status).toBe("output_limit_exceeded");
    expect(worker.jobCount()).toBe(0);
  });

  it("measures the source in UTF-8 bytes, not code units", async () => {
    /* A Kazakh comment is two bytes a character. Measuring `.length` would let
       a source through that the server would then refuse — the two ceilings are
       deliberately the same number and must be the same measurement. */
    const worker = new FakeWorker();
    const runner = runnerWith(worker);
    const kazakh = "ә".repeat(LOCAL_LIMITS.maxSourceBytes - 10);
    expect(kazakh.length).toBeLessThan(LOCAL_LIMITS.maxSourceBytes);
    const result = await runner.run({ source: kazakh, stdin: "" });
    expect(result.status).toBe("output_limit_exceeded");
  });
});

describe("laziness", () => {
  it("constructing a runner downloads no compiler", () => {
    /* 57 MB must not be fetched because a learner opened a lesson. It is
       fetched when they press Run. */
    let created = 0;
    const runner = new Cpp17Runner({
      createWorker: () => {
        created += 1;
        return new FakeWorker();
      },
    });
    expect(runner.status().phase).toBe("idle");
    expect(created).toBe(0);
  });

  it("reuses a warm worker across runs", async () => {
    let created = 0;
    const worker = new FakeWorker();
    const runner = new Cpp17Runner({
      createWorker: () => {
        created += 1;
        return worker;
      },
    });

    const a = runner.run({ source: "A", stdin: "" });
    await flush();
    worker.reply(0);
    await a;

    const b = runner.run({ source: "B", stdin: "" });
    await flush();
    worker.reply(1);
    await b;

    expect(created, "a second run paid the whole init cost again").toBe(1);
  });
});

/* -------------------------------------------------------------------------- */
/* Pure worker helpers                                                        */
/* -------------------------------------------------------------------------- */

describe("compile errors are not runtime errors", () => {
  it("keeps the two apart", () => {
    /* Telling a beginner their working idea crashed, or their typo was a crash,
       are both lies and they point at different fixes. */
    expect(classifyFailure("compile", "anything")).toBe("syntax_error");
    expect(classifyFailure("link", "anything")).toBe("syntax_error");
    expect(classifyFailure("run", "unreachable")).toBe("runtime_error");
    expect(classifyFailure("run", "output limit exceeded")).toBe("output_limit_exceeded");
  });
});

describe("the runtime's narration never reaches the learner", () => {
  it("drops the runtime's own progress lines", () => {
    const narrated = "[1;93m>[0m Compiling main.wasm... done.\nhello";
    expect(stripProgress(narrated)).toBe("hello");
  });

  it("keeps a learner's line that merely starts with '>'", () => {
    /* The filter is on the escape sequence, not on the character. A program
       printing a prompt must keep it. */
    expect(stripProgress("> my own output\ndone")).toBe("> my own output\ndone");
  });

  it("does not repeat the post-mortem the status already carries", () => {
    expect(stripProgress("bye\nError: process exited with code 1.")).toBe("bye");
  });
});

describe("bits/stdc++.h", () => {
  it("is written where the existing include path looks", () => {
    /* A leading slash creates a second tree memfs never searches; the symptom
       is `'bits/stdc++.h' file not found` with the file present. */
    expect(BITS_STDCPP_PATH.startsWith("/")).toBe(false);
    expect(BITS_STDCPP_PATH).toBe("include/bits/stdc++.h");
  });

  it("claims only headers this libc++ actually has", () => {
    /* Both were tried and both fail: `csetjmp` wants a C `setjmp.h` the sysroot
       lacks, and `csignal` has no `signal` because WASI has no signals. */
    expect(BITS_STDCPP_HEADERS).not.toContain("csetjmp");
    expect(BITS_STDCPP_HEADERS).not.toContain("csignal");
    for (const absent of ["execution", "memory_resource", "coroutine", "format", "ranges"]) {
      expect(BITS_STDCPP_HEADERS, `libc++ 8 has no <${absent}>`).not.toContain(absent);
    }
  });

  it("covers what the year actually uses", () => {
    for (const needed of [
      "iostream", "vector", "string", "algorithm", "queue", "stack",
      "map", "set", "cmath", "numeric", "utility",
    ]) {
      expect(BITS_STDCPP_HEADERS, `the curriculum needs <${needed}>`).toContain(needed);
    }
  });

  it("emits an include for every header it names", () => {
    const source = bitsStdcppSource();
    for (const h of BITS_STDCPP_HEADERS) expect(source).toContain(`#include <${h}>`);
    expect(source).toContain("#pragma once");
  });
});
