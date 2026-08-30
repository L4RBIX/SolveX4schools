"use client";

/**
 * The lesson player's view of local Python.
 *
 * Thin on purpose. Everything that can go wrong lives in `runner.ts` and
 * `worker.ts` where it can be tested without React; this file's whole job is to
 * turn "is the runtime ready" into something a component can render, and to
 * decide WHEN the 13 MB download starts.
 *
 * ## When Pyodide is fetched, and why there
 *
 * `preload` defaults to true, and the contract is: mount this hook where a
 * coding block actually is, not at the top of the lesson.
 *
 * The alternative — waiting for the first press of Run — is worse for the
 * learner and only looks cheaper. A block with an editor in it is a block the
 * learner is about to run something in; starting the download while they read
 * the problem and type turns a 2-8 second wait into no wait at all on a decent
 * connection, and on a bad one it at least overlaps with reading instead of
 * following it. Nothing loads on `/home`, on a reading block, or on a
 * multiple-choice block, because none of those mount this hook — which is the
 * property that matters, and it is enforced by where the hook is called rather
 * than by a flag anyone can forget.
 *
 * Pass `preload: false` where a coding block is rendered but hidden (a
 * collapsed panel, an off-screen tab) and the download should wait for intent.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { LocalRunRequest, LocalRunResult } from "@schools/execution/trust";
import {
  getPythonRunner,
  IDLE_STATUS,
  type PythonRunner,
  type RunnerPhase,
  type RunnerStatus,
} from "./runner";

export interface UsePythonOptions {
  /** Start downloading CPython as soon as this hook mounts. Default: true. */
  preload?: boolean;
  /**
   * Use this runner instead of the shared one. For stories and tests; a lesson
   * must NOT pass its own, or every coding block gets its own CPython.
   */
  runner?: PythonRunner;
}

export interface UsePython {
  phase: RunnerPhase;
  /** True while CPython is downloading. Show «Python дайындалып жатыр…». */
  isLoading: boolean;
  isReady: boolean;
  /** True between pressing Run and the result arriving. Disable the button. */
  isRunning: boolean;
  /**
   * Why the runtime is unusable, when it is. Never a message about the
   * learner's program — those arrive on `LocalRunResult.stderr`.
   */
  error: string | null;
  /** e.g. `"3.14.2"`. Null until the interpreter has answered for itself. */
  pythonVersion: string | null;
  /** e.g. `"314.0.6"`. */
  pyodideVersion: string | null;
  /** Start the download without running anything. Resolves false if it failed. */
  ensureReady: () => Promise<boolean>;
  /** Run the learner's source. Resolves to a result; never rejects. */
  run: (request: LocalRunRequest) => Promise<LocalRunResult>;
  /** The most recent result, or null before the first Run. */
  result: LocalRunResult | null;
  /** Forget the last result — for clearing the output box on edit. */
  clearResult: () => void;
}

export function usePython(options: UsePythonOptions = {}): UsePython {
  const { preload = true, runner: injected } = options;

  /* `getPythonRunner()` is called lazily rather than at module scope so that
     importing this hook — which a server component's tree does — constructs
     nothing. The runner itself still downloads nothing until asked. */
  const runner = useMemo(() => injected ?? getPythonRunner(), [injected]);

  const status = useSyncExternalStore<RunnerStatus>(
    useCallback((listener: () => void) => runner.subscribe(listener), [runner]),
    useCallback(() => runner.status(), [runner]),
    /* There is no worker on the server and there never will be. Returning the
       shared frozen idle status keeps hydration honest: the server renders
       "nothing loaded", which is exactly true. */
    () => IDLE_STATUS,
  );

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<LocalRunResult | null>(null);

  /* A run outlives the component that started it — a learner can navigate away
     mid-`while True`. The ref lets the late resolution drop its result on the
     floor instead of setting state on an unmounted tree. */
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!preload) return;
    /* Deliberately unawaited and deliberately not cancelled on unmount: the
       download is for the whole lesson session, not for this component, and
       abandoning it half-way would make a learner who scrolled past a block and
       back pay for it twice. `ensureReady` never rejects. */
    void runner.ensureReady();
  }, [preload, runner]);

  const ensureReady = useCallback(() => runner.ensureReady(), [runner]);

  const run = useCallback(
    async (request: LocalRunRequest): Promise<LocalRunResult> => {
      setIsRunning(true);
      try {
        const outcome = await runner.run(request);
        if (mounted.current) setResult(outcome);
        return outcome;
      } finally {
        if (mounted.current) setIsRunning(false);
      }
    },
    [runner],
  );

  const clearResult = useCallback(() => setResult(null), []);

  return {
    phase: status.phase,
    isLoading: status.phase === "loading",
    isReady: status.phase === "ready",
    isRunning,
    error: status.error,
    pythonVersion: status.pythonVersion,
    pyodideVersion: status.pyodideVersion,
    ensureReady,
    run,
    result,
    clearResult,
  };
}
