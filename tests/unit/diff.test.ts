import { describe, expect, it } from "vitest";

import { classifyDiff, hashCode, lineDiff, normalizeCode, stripCommentsAndStrings } from "../../packages/learning-intelligence-core/src/diff";

/**
 * The classifier is the reasoning signal, so these tests are written as
 * situations rather than as inputs: "a learner who changed one bound after a
 * wrong answer" has to come out different from "a learner who rewrote the
 * loop", because the whole point of Phase 1 is telling those two apart.
 */

const CPP = "cpp17";
const PY = "python3";

const BASE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    long long total = 0;
    for (int i = 0; i < n; i++) {
        if (a[i] > 0) total += a[i];
    }
    cout << total << endl;
    return 0;
}
`;

describe("stripCommentsAndStrings", () => {
  it("removes line and block comments without eating code", () => {
    const stripped = stripCommentsAndStrings(
      "int x = 1; // set x\n/* block\ncomment */ int y = 2;",
      CPP
    );
    expect(stripped).toContain("int x = 1;");
    expect(stripped).toContain("int y = 2;");
    expect(stripped).not.toContain("set x");
    expect(stripped).not.toContain("block");
  });

  it("does not treat a // inside a string as a comment", () => {
    const stripped = stripCommentsAndStrings('string url = "http://x"; int y = 2;', CPP);
    expect(stripped).toContain("int y = 2;");
  });

  it("removes python docstrings and hash comments", () => {
    const stripped = stripCommentsAndStrings('def f():\n    """doc"""\n    return 1  # why\n', PY);
    expect(stripped).not.toContain("doc");
    expect(stripped).not.toContain("why");
    expect(stripped).toContain("return 1");
  });
});

describe("normalizeCode", () => {
  it("keeps control flow in the shape and leaves identifiers out of it", () => {
    const a = normalizeCode("for (int i = 0; i < n; i++) { if (x) return 1; }", CPP);
    const b = normalizeCode("for (int j = 0; j < m; j++) { if (y) return 1; }", CPP);
    expect(a.shape).toBe(b.shape);
  });

  it("changes the shape when control flow changes", () => {
    const a = normalizeCode("for (int i = 0; i < n; i++) { total += i; }", CPP);
    const b = normalizeCode("while (i < n) { total += i; }", CPP);
    expect(a.shape).not.toBe(b.shape);
  });
});

describe("lineDiff", () => {
  it("counts an inserted line as one addition, not a wholesale rewrite", () => {
    const before = ["a", "b", "c"];
    const after = ["a", "x", "b", "c"];
    expect(lineDiff(before, after)).toEqual({ added: 1, removed: 0 });
  });

  it("falls back cleanly above the LCS cap", () => {
    const before = Array.from({ length: 500 }, (_, i) => `line ${i}`);
    const after = [...before, "extra"];
    const result = lineDiff(before, after);
    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
  });
});

describe("classifyDiff", () => {
  it("labels the first snapshot unknown rather than guessing", () => {
    expect(classifyDiff(null, BASE, CPP).diffClass).toBe("unknown");
  });

  it("treats a comment-only change as cosmetic", () => {
    const next = BASE.replace("int main() {", "// solve it\nint main() {");
    expect(classifyDiff(BASE, next, CPP).diffClass).toBe("cosmetic");
  });

  it("treats a pure rename as cosmetic", () => {
    const next = BASE.replace(/total/g, "sum");
    expect(classifyDiff(BASE, next, CPP).diffClass).toBe("cosmetic");
  });

  it("does not call min → max a rename", () => {
    // Alpha-equivalence alone would collapse this to a rename: one identifier
    // swapped at one position. It is a semantic change and one of the most
    // common guesses a stuck learner makes, so it must stay visible.
    const before = "int best = min(a, b);\nint other = min(c, d);\n";
    const after = "int best = max(a, b);\nint other = min(c, d);\n";
    expect(classifyDiff(before, after, CPP).diffClass).not.toBe("cosmetic");
  });

  it("counts a rename only when the identifier was actually reused", () => {
    // A single-site substitution is an edit wearing a rename's clothes.
    const before = "int a = 1;\nint b = 2;\ncout << a + b;\n";
    const after = "int a = 1;\nint b = 2;\ncout << a + c;\n";
    expect(classifyDiff(before, after, CPP).diffClass).not.toBe("cosmetic");
  });

  it("calls a single flipped comparison a constant tweak", () => {
    // The signature of guessing at a boundary: structure untouched, one
    // operator moved.
    const next = BASE.replace("a[i] > 0", "a[i] >= 0");
    expect(classifyDiff(BASE, next, CPP).diffClass).toBe("constant_tweak");
  });

  it("calls a changed numeric literal a constant tweak", () => {
    const next = BASE.replace("long long total = 0;", "long long total = 1;");
    expect(classifyDiff(BASE, next, CPP).diffClass).toBe("constant_tweak");
  });

  it("calls a rewritten approach structural", () => {
    const rewritten = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;
    priority_queue<int> pq;
    while (n--) {
        int x;
        cin >> x;
        pq.push(x);
    }
    long long best = 0;
    while (!pq.empty()) {
        best = max(best, (long long) pq.top());
        pq.pop();
    }
    cout << best << "\\n";
    return 0;
}
`;
    expect(classifyDiff(BASE, rewritten, CPP).diffClass).toBe("structural");
  });

  it("calls a return to boilerplate a reset", () => {
    const template = `#include <bits/stdc++.h>
using namespace std;

int main() {
    return 0;
}
`;
    expect(classifyDiff(BASE, template, CPP).diffClass).toBe("reset");
  });

  it("does not call the very first typing a reset", () => {
    // Boilerplate to boilerplate-plus-a-line is someone starting, not someone
    // giving up. Only shrinking back from real work counts.
    const template = "int main() {\n    return 0;\n}\n";
    const started = "int main() {\n    int n;\n    cin >> n;\n    return 0;\n}\n";
    expect(classifyDiff(template, started, CPP).diffClass).not.toBe("reset");
  });

  it("reports line counts alongside the class", () => {
    const next = BASE.replace(
      "    cout << total << endl;",
      "    if (total == 0) cout << -1 << endl;\n    else cout << total << endl;"
    );
    const result = classifyDiff(BASE, next, CPP);
    expect(result.linesAdded).toBeGreaterThan(0);
    expect(result.editDistance).toBeGreaterThan(0);
  });

  it("classifies python edits by indentation shape", () => {
    const before = "def solve():\n    n = int(input())\n    print(n)\n";
    const after = "def solve():\n    n = int(input())\n    for i in range(n):\n        print(i)\n";
    expect(classifyDiff(before, after, PY).diffClass).not.toBe("cosmetic");
  });
});

describe("hashCode", () => {
  it("is stable and content-addressed", () => {
    expect(hashCode(BASE)).toBe(hashCode(BASE));
    expect(hashCode(BASE)).not.toBe(hashCode(BASE + "\n"));
  });
});
