"""Run one program against many inputs inside a single interpreter.

Spawning a process per case is the obvious way and it does not scale: the
wrong-solution suite alone wanted 196 of them, running concurrently with the
825 of `content-execution`, and the workers started dying — which surfaced as a
DIFFERENT fixture failing on each run and one unrelated test file failing to
load at all. A heisenbug in a suite whose job is to be believed is worse than a
slow suite.

Each case gets a fresh globals dict, its own stdin and its own stdout, so
nothing leaks between them but the interpreter itself. Reads a JSON spec on
stdin, writes a JSON array of {status, out}.
"""
import sys, json, io

spec = json.load(sys.stdin)
program = spec["program"]
results = []

try:
    code = compile(program, "<program>", "exec")
except SyntaxError as e:
    print(json.dumps([{"status": "SyntaxError", "out": str(e)} for _ in spec["cases"]]))
    sys.exit(0)

real_stdin, real_stdout = sys.stdin, sys.stdout
limit = sys.getrecursionlimit()

for case in spec["cases"]:
    data = case["input"]
    if not data.endswith("\n"):
        data += "\n"
    buf = io.StringIO()
    sys.stdin, sys.stdout = io.StringIO(data), buf
    status = "ok"
    try:
        exec(code, {"__name__": "__main__"})
    except BaseException as e:          # noqa: BLE001 - a wrong program may raise anything
        status = type(e).__name__
    finally:
        sys.stdin, sys.stdout = real_stdin, real_stdout
        # A program that raised its own limit must not change the next case's.
        sys.setrecursionlimit(limit)
    results.append({"status": status, "out": buf.getvalue().strip()})

print(json.dumps(results))
