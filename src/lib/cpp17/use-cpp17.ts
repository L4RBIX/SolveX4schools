"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { LocalRunRequest, LocalRunResult } from "@schools/execution/trust";
import { Cpp17Runner, IDLE_STATUS, type RunnerPhase, type RunnerStatus } from "./runner";

/**
 * The lesson player's handle on the C++17 runtime.
 *
 * Deliberately the same shape as `usePython`, which it replaces, so the Run
 * panel changes by one import rather than by a rewrite. The differences are
 * only where the languages genuinely differ: there is no interpreter version to
 * report, and `isCompiling` exists because C++ has a step Python does not and a
 * learner should be told which one they are waiting on.
 *
 * ## One runtime for the page, not one per block
 *
 * A lesson has several coding blocks. Each mounting its own runner would mean
 * each downloading its own 18 MB of compiler, so the runner is a module
 * singleton and every block shares it. Constructed lazily, because importing
 * this module happens during a server render where there is no `Worker`.
 */

let shared: Cpp17Runner | null = null;

/** The page's runner. Created on first use, never during a server render. */
export function getCpp17Runner(): Cpp17Runner {
  shared ??= new Cpp17Runner();
  return shared;
}

/** Tests and stories only. */
export function __setCpp17RunnerForTests(runner: Cpp17Runner | null): void {
  shared = runner;
}

export interface UseCpp17Options {
  /**
   * Fetch the toolchain as soon as this hook mounts.
   *
   * Default FALSE, and that is the opposite of the Python hook's default. 18 MB
   * gzipped is not something to start because a lesson rendered — it starts
   * when a block that can actually run code becomes active. The Run panel
   * passes `preload: active` for exactly that.
   */
  preload?: boolean;
  runner?: Cpp17Runner;
}

export interface UseCpp17 {
  phase: RunnerPhase;
  /** True while the compiler is downloading. Show «C++ дайындалып жатыр…». */
  isLoading: boolean;
  isReady: boolean;
  /** True while clang is building the learner's source. */
  isCompiling: boolean;
  /** True while the built program is executing. */
  isRunning: boolean;
  /** True between pressing Run and a result arriving, whichever phase. */
  isBusy: boolean;
  /** Why the runtime is unusable. Never a message about the learner's code. */
  error: string | null;
  /** How long the worker took to come up, once it has. */
  initMs: number | null;
  /** Start the download without running anything. Resolves false if it failed. */
  ensureReady: () => Promise<boolean>;
  /** Compile and run. Resolves to a result; never rejects. */
  run: (request: LocalRunRequest) => Promise<LocalRunResult>;
  /** The most recent result, or null before the first Run. */
  result: LocalRunResult | null;
  /** Forget the last result — for clearing the output box on edit. */
  clearResult: () => void;
}

export function useCpp17(options: UseCpp17Options = {}): UseCpp17 {
  const { preload = false, runner: injected } = options;

  const runner = useMemo(() => injected ?? getCpp17Runner(), [injected]);

  const status = useSyncExternalStore<RunnerStatus>(
    useCallback((onChange) => runner.subscribe(onChange), [runner]),
    useCallback(() => runner.status(), [runner]),
    /* The server has no worker, so it renders the frozen shared idle status and
       the first client render agrees with it by identity. Anything else is a
       hydration mismatch on every lesson with a coding block. */
    useCallback(() => IDLE_STATUS, []),
  );

  const [result, setResult] = useState<LocalRunResult | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const ensureReady = useCallback(async () => {
    /* `run` with an empty source would compile an empty translation unit, which
       is a real compile and a real second of the learner's time. Warming is a
       separate verb for that reason. */
    const outcome = await runner.warm();
    return outcome;
  }, [runner]);

  useEffect(() => {
    if (!preload) return;
    void ensureReady();
  }, [preload, ensureReady]);

  const run = useCallback(
    async (request: LocalRunRequest) => {
      const outcome = await runner.run(request);
      /* A result that arrives after the learner navigated away is dropped
         rather than setting state on an unmounted tree. */
      if (alive.current) setResult(outcome);
      return outcome;
    },
    [runner],
  );

  const clearResult = useCallback(() => setResult(null), []);

  return {
    phase: status.phase,
    isLoading: status.phase === "loading",
    isReady: status.phase === "ready",
    isCompiling: status.phase === "compiling",
    isRunning: status.phase === "running",
    isBusy: status.phase === "compiling" || status.phase === "running",
    error: status.error,
    initMs: status.initMs,
    ensureReady,
    run,
    result,
    clearResult,
  };
}
