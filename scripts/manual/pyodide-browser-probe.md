# Pyodide browser probe — the things vitest cannot prove

Node's vitest has no `Worker` and no WebAssembly Pyodide. Everything in
`tests/exec/pyodide-runner.test.ts` runs against an injected fake worker, which
is the right way to test the runner's state machine and proves nothing at all
about whether CPython actually executes in a learner's browser.

This is the procedure that proves the rest. It is manual because it needs a real
browser; it is written down because "somebody ran it once" is not a record.

## Running it

```
npm run dev
```

Open any page of the app — the origin matters, because the worker and the
runtime assets must be same-origin — then paste the blocks below into DevTools.
Do not run it from `about:blank` or a file URL; both change what is being tested.

## What was found on 2026-08-28

Chrome, macOS 24.6.0, dev server, `pyodide@314.0.6`.

### Boot

| | |
|---|---|
| Cold boot, dev server | **7.7 s** |
| Re-boot after terminate, warm HTTP cache | **4.2 s** |
| Pyodide version | 314.0.6 |
| **CPython version** | **3.14.2** |

The server judge is pinned to **3.12.0** (`PYTHON_RUNTIME.version`). That skew is
real, deliberate for now, and guarded by `tests/school/python-version-skew.test.ts`.

7.7 s cold is why `BOOT_TIMEOUT_MS` in `src/lib/pyodide/runner.ts` is 30 s and not
5: cutting a boot that would have succeeded turns a slow lesson into a broken one.

### Assets, over HTTP

All five serve 200 from `/pyodide/` with correct MIME types — critically
`application/wasm` for `pyodide.asm.wasm`, without which
`WebAssembly.instantiateStreaming` refuses the module.

### Language behaviour — 16 programs, all correct

Verified: `input()` + `map(int, …)`, multi-line stdin, `//` vs `/` vs `%`,
negative modulo (`-7 % 3 == 2`), f-strings, Cyrillic and Kazakh output,
`sys.exit(0)` vs `sys.exit(1)`, `EOFError` past the end of stdin.

### Error classification — the distinction that matters

| Program | Status | Learner sees |
|---|---|---|
| `print("unclosed` | `syntax_error` | `SyntaxError: unterminated string literal` |
| `if True:` / `print(1)` | `syntax_error` | `IndentationError: expected an indented block` |
| `print(undefined_name)` | `runtime_error` | `NameError` + traceback |
| `print(1/0)` | `runtime_error` | `ZeroDivisionError: division by zero` |
| `a=[1,2]; a[9]` | `runtime_error` | `IndexError: list index out of range` |

`SyntaxError` and `IndentationError` land on `syntax_error`, not `runtime_error`.
The server had exactly this bug and it is regression-tested there; the local half
gets it right for the same reason — a missing bracket and a broken algorithm are
different afternoons for a fourteen-year-old.

Tracebacks read `File "main.py", line N` with the learner's own line numbers. The
harness frame is dropped, so nobody has to read `exec(code, namespace)`.

### The two hostile programs

**`while True: pass`** — Python cannot be interrupted from inside, so the only
escape is `worker.terminate()` from the main thread. Measured: the worker never
answered, the **main thread kept executing scheduled tasks throughout**,
`terminate()` returned in **1 ms**, and a fresh worker ran `6 7 → 42` correctly
afterwards. This is the entire reason the worker exists, and it holds.

**`for i in range(200000): print("x" * 40)`** — 8.2 MB attempted, **65 559 bytes
kept**, `truncated: true`, finished in 381 ms. The cap is enforced as output
accumulates, inside the worker, so nothing buffers hundreds of megabytes first.

### What the worker can reach — measured, not assumed

| | |
|---|---|
| `document`, `window`, `localStorage`, `document.cookie` | **unreachable** |
| `indexedDB`, `fetch` | reachable (inherent to a Web Worker) |
| Real filesystem | no — Emscripten MEMFS only; `/etc/passwd` is `FileNotFoundError` |
| `subprocess` | no — `OSError: emscripten does not support processes` |
| `socket` | object constructs, cannot connect |
| `os.environ` | Emscripten's own eight keys. No server configuration, no secrets. |

### The finding worth acting on: learner Python has JS interop

`import js` works, and `from js import fetch` gives learner code a working
`fetch` bound to the app's origin, with the learner's own cookies.

**This is not a new hole.** Anything Python-via-`js` can do, the learner can do
faster in their own DevTools console on the same page — which is precisely the
assumption `client_local` encodes. Nothing here can forge a `server_verified`
result, because trust is stamped server-side and never accepted from a body.

Two consequences that ARE worth acting on:

1. It makes `isClientReportable` in `packages/learning-contracts/src/events.ts`
   load-bearing rather than belt-and-braces. Before that guard, a learner could
   have typed `from js import fetch` into a *lesson task* and POSTed themselves
   an accepted verdict. See `tests/school/forged-outcomes.test.ts`.

2. **It is the reason the missing CSP matters.** The residency commitment in
   `docs/CODE_EXECUTION_DECISION.md` is that a Kazakh student's code never
   leaves their laptop. With `fetch` reachable from learner Python and **no
   Content-Security-Policy anywhere in this app** (no `middleware.ts`, no
   `headers()` in `next.config.ts`), that commitment is upheld by our code not
   doing it, rather than by the browser refusing. `connect-src 'self'` is what
   turns it into a guarantee. See the deployment section of
   `docs/infrastructure/HYBRID_EXECUTION.md`.

## The probe

```js
// 1. Assets. Run in the page console.
for (const f of ["pyodide.mjs","pyodide.asm.wasm","python_stdlib.zip","pyodide-lock.json"]) {
  const r = await fetch(`/pyodide/${f}`);
  console.log(f, r.status, r.headers.get("content-type"));
}
```

```js
// 2. Boot a worker mirroring src/lib/pyodide/worker.ts, then exercise it.
//    The full script is inlined here so this file is self-contained; keep it in
//    step with the worker when the harness changes.
const HARNESS = `
import sys, linecache, traceback
_SOLVEX_FILE = "main.py"
def _solvex_run(src):
    with open(_SOLVEX_FILE, "w") as h: h.write(src)
    linecache.checkcache(_SOLVEX_FILE)
    try: code = compile(src, _SOLVEX_FILE, "exec")
    except SyntaxError as exc:
        sys.stderr.write("".join(traceback.format_exception_only(exc))); return "syntax_error"
    ns = {"__name__": "__main__", "__file__": _SOLVEX_FILE}
    try: exec(code, ns)
    except BaseException as exc:
        f = exc.__traceback__
        traceback.print_exception(exc.with_traceback(f.tb_next if f else None)); return "runtime_error"
    return "ok"
`;
const src = `
let py=null,out="",err="",over=false,cap=65536;
self.onmessage=async(e)=>{const m=e.data;
 if(m.kind==="boot"){try{
   const mod=await import(m.base+"pyodide.mjs");
   py=await mod.loadPyodide({indexURL:m.base,packageBaseUrl:m.base,args:[],stdout:()=>{},stderr:()=>{}});
   py.runPython(${JSON.stringify(HARNESS)});
   self.postMessage({kind:"ready",v:py.version,
     py:py.runPython("import sys; '.'.join(map(str, sys.version_info[:3]))")});
 }catch(x){self.postMessage({kind:"boot_failed",message:String(x&&x.message||x)})}return;}
 if(m.kind==="run"){out="";err="";over=false;cap=m.cap||65536;
   const w=(t,s)=>{if(over)return;if((t==="o"?out:err).length+s.length>cap)over=true;
     if(t==="o")out+=s+"\\n";else err+=s+"\\n";};
   py.setStdout({batched:s=>w("o",s)});py.setStderr({batched:s=>w("e",s)});
   const lines=m.stdin.length?m.stdin.split("\\n"):[];let i=0;
   py.setStdin({stdin:()=>i<lines.length?lines[i++]:null});
   const t=performance.now();
   let status;try{status=py.globals.get("_solvex_run")(m.source)}catch(x){status="runtime_error";err+=String(x)}
   self.postMessage({kind:"done",status,stdout:out,stderr:err,truncated:over,
     runtimeMs:Math.round(performance.now()-t)});}
};`;
const w = new Worker(URL.createObjectURL(new Blob([src],{type:"text/javascript"})), {type:"module"});
window.__w = w;
const once = () => new Promise(r => { w.onmessage = e => r(e.data); });
const b = once(); w.postMessage({kind:"boot", base: location.origin + "/pyodide/"});
console.log(await b);
```

```js
// 3. The hostile pair. Expect: main thread alive throughout, terminate() instant.
const w = window.__w;
w.onmessage = e => console.log("answered", e.data);
w.postMessage({kind:"run", source:'while True:\n    pass', stdin:"", cap:65536});
for (let i = 0; i < 6; i++) {
  await new Promise(r => setTimeout(r, 250));
  console.log("main thread alive", i);   // must keep printing
}
w.terminate();                            // the only way out
```
