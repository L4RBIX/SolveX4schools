/**
 * Starter templates, and the ONLY reason the core ever needed a Judge0 import.
 *
 * WHY THIS FILE EXISTS
 * `diff.ts` detects boilerplate by comparing a submission's normalized shape
 * against the shape of the starter code the editor actually loaded. In the
 * original repository it read those templates from
 * `@/types/execution`'s `JUDGE0_LANGUAGE_MAP` — a Judge0 (code-execution
 * service) config object that also carries `language_id` and
 * `monaco_language`, neither of which the core touches.
 *
 * Only `starter_template` was ever read, by exactly three call sites:
 *   diff.ts:311, replayHarness.ts:70, replayTraces.ts:41,217
 *
 * So the dependency is not on Judge0 at all. It is on the question "what code
 * was already in the editor when the learner arrived?" — which SolveX4Schools
 * also has an answer to, because scaffolded lessons ship starter code.
 *
 * THIS IS THE ONE FILE YOU REPLACE.
 * Swap these values for your own starter templates and boilerplate detection
 * keeps working. Leave it alone and it keeps detecting SolveX's C++/Python
 * templates, which will simply never match your learners' code — the failure
 * mode is silent under-detection, not a crash.
 *
 * The keys are matched against the `language` string on each event. The core
 * treats `language` as an opaque string everywhere EXCEPT two checks in
 * `diff.ts` (`language.startsWith("python")`, which selects `#` comment
 * syntax over `//`), so a new language whose name does not start with
 * "python" is normalized with C-style comment rules.
 *
 * Values below are byte-identical to `JUDGE0_LANGUAGE_MAP[lang].starter_template`
 * at the export baseline. `tests/unit/diff.test.ts` passing is the proof.
 */

export const STARTER_TEMPLATES: Record<string, string> = {
  cpp17: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    return 0;\n}\n",
  python3: "import sys\ninput = sys.stdin.readline\n\ndef solve():\n    pass\n\nif __name__ == \"__main__\":\n    solve()\n",
};
