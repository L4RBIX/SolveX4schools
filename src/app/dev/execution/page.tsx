"use client";

import { useState } from "react";

/**
 * Execution lab.
 *
 * The cases that matter are the ones where the difference between "the
 * learner's program failed" and "the judge failed" decides what a child is
 * told. Each preset below exercises one of them.
 */

const PRESETS: { label: string; source: string; stdin: string; expect: string }[] = [
  { label: "normal", source: 'n = int(input())\nprint(n * n)', stdin: "7", expect: "ok, stdout 49" },
  { label: "stdin, multiple values", source: "a, b = map(int, input().split())\nprint(a + b)", stdin: "3 4", expect: "ok, stdout 7" },
  { label: "syntax error", source: "print(", stdin: "", expect: "compile_error" },
  { label: "runtime error", source: "print(1/0)", stdin: "", expect: "runtime_error" },
  { label: "infinite loop", source: "while True: pass", stdin: "", expect: "time_limit_exceeded — LEARNER evidence, infrastructureError false" },
  { label: "large output", source: "for i in range(200000): print(i)", stdin: "", expect: "truncated at the cap, not a crash" },
  { label: "reads the environment", source: "import os\nprint(os.environ.get('DEEPSEEK_API_KEY'))", stdin: "", expect: "None — the child process env is scrubbed" },
];

export default function ExecutionLab() {
  const [source, setSource] = useState(PRESETS[0].source);
  const [stdin, setStdin] = useState(PRESETS[0].stdin);
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/exec/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceCode: source, stdin }),
      });
      setResult(await res.json());
    } catch (e) {
      setResult({ clientError: String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => { setSource(p.source); setStdin(p.stdin); setResult(null); }}
            className="rounded-full border-2 border-b-edge px-3 py-1 text-[13px] hover:border-white/40"
          >
            {p.label}
          </button>
        ))}
      </div>

      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        rows={10}
        spellCheck={false}
        className="w-full rounded-[12px] border-2 border-b-edge bg-black p-4 font-b-mono text-[14px]"
      />
      <input
        value={stdin}
        onChange={(e) => setStdin(e.target.value)}
        placeholder="stdin"
        className="h-12 rounded-[12px] border-2 border-b-edge bg-black px-4 font-b-mono text-[14px]"
      />

      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="h-12 w-40 rounded-full bg-b-blue font-medium disabled:opacity-40"
      >
        {busy ? "running…" : "Run"}
      </button>

      {result ? (
        <pre className="overflow-x-auto rounded-[12px] border-2 border-b-edge bg-black p-4 font-b-mono text-[13px] leading-5">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}

      <p className="text-[13px] leading-5 text-white/40">
        The provider is selected by <code>EXEC_PROVIDER</code>. The local one is a
        subprocess and <strong>not a sandbox</strong> — it refuses to run in
        production. Watch <code>infrastructureError</code>: it is the field that
        separates &quot;your program was too slow&quot; from &quot;the judge did not answer&quot;,
        and only the first is ever recorded as evidence about a learner.
      </p>
    </div>
  );
}
