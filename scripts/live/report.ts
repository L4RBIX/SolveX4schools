/**
 * What the live run found, and the document it becomes.
 *
 * ## The one rule
 *
 * A field nobody measured renders as the literal word `UNKNOWN`. Not a dash,
 * not an empty cell, not a plausible number carried over from the arithmetic in
 * `JUDGE0_RAPIDAPI_SETUP.md` §5. The whole reason this document is worth
 * writing is that everything in it was observed, and a reader has to be able to
 * tell an observation from an estimate at a glance — so the estimates are not
 * in here at all, and the gaps say so.
 *
 * ## The key is not in this file and cannot get into it
 *
 * `scrub` is applied to every piece of text that came back from the judge
 * before it reaches a report field, and the writer refuses to save a document
 * the key still appears in. Two guards, because one of the probes reads
 * `os.environ` and the whole point of a probe is that it returns something
 * nobody predicted.
 */

export type PhaseName = "languages" | "conformance" | "probes" | "parity" | "cost" | "concurrency";

export const PHASE_ORDER: readonly PhaseName[] = [
  "languages",
  "conformance",
  "probes",
  "parity",
  "cost",
  "concurrency",
];

/** Everything a reader must be able to distinguish at a glance. */
export type Severity =
  /** The adapter or the service did not do what this system requires. */
  | "defect"
  /** A boundary that is open. Not a bug to fix here — a decision to take. */
  | "security"
  /** Worth writing down. Not a problem. */
  | "note";

export interface Finding {
  severity: Severity;
  phase: PhaseName | "run";
  summary: string;
}

export interface SpendSnapshot {
  submissions: number;
  apiRequests: number;
  polls: number;
  languageLookups: number;
  rateLimited: number;
  failures: number;
  ceilingRefusals: number;
}

export interface LanguageEntry {
  id: number;
  name: string;
  /** Does it match the adapter's anchored `^Python\s*\((3(?:\.\d+)*)\)$` rule? */
  matchesDiscoveryRule: boolean;
}

export interface LanguagesPhase {
  totalLanguages: number | null;
  /** Every entry whose name mentions Python at all, matching rule or not. */
  pythonEntries: LanguageEntry[];
  catalogueProblem: string | null;
  selected: { id: number; name: string; version: string | null; operatorOverride: boolean } | null;
  selectionProblem: string | null;
  /** `sys.version` as the interpreter itself reports it. A label is not an interpreter. */
  interpreterVersion: string | null;
  interpreterProblem: string | null;
  /** Every `x-ratelimit-*` (and `retry-after`) seen, under the vendor's own names. */
  quotaHeadersPresent: Record<string, string>;
  /** The names the brief asks about that were NOT on any response. */
  quotaHeadersAbsent: string[];
  /** `GET /config_info`, narrowed to the fields that bound what we send. */
  configInfo: Record<string, string> | null;
  configInfoProblem: string | null;
}

export interface ConformanceRow {
  id: string;
  what: string;
  expected: string;
  status: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  wallMs: number;
  memoryKb: number | null;
  matched: boolean;
  mismatch: string | null;
}

export interface ProbeRow {
  id: string;
  what: string;
  safety: string;
  boundary: "held" | "open" | "unknown";
  status: string;
  detail: string;
  securityNote: string | null;
}

export interface ParityRow {
  id: string;
  provenance: string;
  expectedStatus: string;
  actualStatus: string;
  expectedStdout: string | null;
  actualStdout: string;
  wallMs: number;
  matched: boolean;
  mismatch: string | null;
  /** Set when the row is one the brief says NOT to expect a match on. */
  exempt: string | null;
}

export interface CheckMeasurement {
  blockId: string;
  caseCount: number;
  submissions: number;
  apiRequests: number;
  polls: number;
  wallMs: number;
  infrastructureFailed: boolean;
}

export interface CostPhase {
  ordinary: CheckMeasurement | null;
  worstCase: CheckMeasurement | null;
  /** How the two blocks were chosen, so nobody has to trust the choice. */
  selection: string;
  classroomStudents: number;
  problem: string | null;
}

export interface StageResult {
  width: number;
  submissions: number;
  /** End-to-end, per submission, as this process measured it. */
  p50Ms: number;
  p95Ms: number;
  /** From the burst starting to that submission's POST reaching the wire. */
  queueP50Ms: number;
  queueMaxMs: number;
  rateLimited: number;
  providerErrors: number;
  wallMs: number;
}

export interface ConcurrencyPhase {
  stages: StageResult[];
  /** The width at which escalation stopped for good, or `null` if all four ran. */
  stoppedAtWidth: number | null;
  stopReason: string | null;
}

export interface LiveValidationReport {
  ranAt: string;
  finishedAt: string | null;
  /** The command, reconstructed. Never carries an environment variable's value. */
  command: string;
  host: string;
  baseUrl: string;
  phasesSelected: PhaseName[];
  ceiling: number;
  spend: SpendSnapshot;
  languages: LanguagesPhase | null;
  conformance: ConformanceRow[] | null;
  probes: ProbeRow[] | null;
  parity: ParityRow[] | null;
  cost: CostPhase | null;
  concurrency: ConcurrencyPhase | null;
  skipped: { phase: PhaseName; why: string }[];
  findings: Finding[];
}

/* -------------------------------------------------------------------------- */
/* Redaction                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Remove the key from a string, wherever it came from.
 *
 * Applied to every byte the judge sends back before it reaches a report field.
 * A submission's stdout is under the judge's control and one of the probes
 * deliberately reads its environment, so "the key cannot appear in output" is an
 * assumption rather than a fact — and an assumption is not good enough for the
 * one thing that must never be written down.
 *
 * An empty key scrubs nothing, which is correct: there is no secret to hide.
 */
export function scrub(text: string, key: string): string {
  if (key.length === 0) return text;
  return text.split(key).join("[REDACTED]");
}

/* -------------------------------------------------------------------------- */
/* Small formatting helpers                                                    */
/* -------------------------------------------------------------------------- */

/** The literal word, everywhere a number was not measured. */
const UNKNOWN = "UNKNOWN";

function num(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : UNKNOWN;
}

function text(value: string | null | undefined): string {
  return value === null || value === undefined || value === "" ? UNKNOWN : value;
}

/** Markdown table cells cannot hold a newline or an unescaped pipe. */
function cell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ⏎ ");
}

/** Long output belongs in a fenced block, and only the first few hundred bytes of it. */
function snippet(value: string, limit = 240): string {
  if (value === "") return "(empty)";
  const flat = value.length > limit ? `${value.slice(0, limit)}… [${value.length} chars total]` : value;
  return JSON.stringify(flat);
}

function fence(value: string, limit = 1200): string {
  const body = value.length > limit ? `${value.slice(0, limit)}\n… [${value.length} chars total]` : value;
  return ["```", body, "```"].join("\n");
}

/* -------------------------------------------------------------------------- */
/* The document                                                                */
/* -------------------------------------------------------------------------- */

export function renderReport(report: LiveValidationReport): string {
  const out: string[] = [];
  const p = (line = "") => out.push(line);

  p("# Judge0 CE via RapidAPI — live validation");
  p();
  p(
    "Produced by `npm run judge0:validate`. Every number below was measured against " +
      "the real service during the run named in the header; nothing here is arithmetic, " +
      "an estimate, or carried over from another document. Anything that was not measured " +
      `is the literal word ${UNKNOWN}.`,
  );
  p();
  p(
    "The design decisions behind the adapter are `JUDGE0_RAPIDAPI_AUDIT.md`; the operator " +
      "instructions and the *arithmetic* for capacity are `JUDGE0_RAPIDAPI_SETUP.md` §5. " +
      "Where this document and §5 disagree, this one is the measurement and §5 is the model.",
  );
  p();

  /* The sentence above claims a real service. `--base-url` exists so the whole
     command can be exercised against the local fake, and a document produced
     that way must say so at the top rather than let a reader assume otherwise —
     a report that quietly describes a fake is worse than no report. */
  if (!report.host.endsWith(".rapidapi.com") || !report.baseUrl.includes("rapidapi.com")) {
    p(
      `> **This run did NOT talk to RapidAPI.** It talked to \`${cell(report.baseUrl)}\`. ` +
        "Everything below describes that host and is not a claim about the rented judge, " +
        "its plan, its sandbox or its Python.",
    );
    p();
  }

  /* -- The run ---------------------------------------------------------- */
  p("## The run");
  p();
  p("| | |");
  p("|---|---|");
  p(`| Started | ${report.ranAt} |`);
  p(`| Finished | ${text(report.finishedAt)} |`);
  p(`| Command | \`${cell(report.command)}\` |`);
  p(`| Host | \`${cell(report.host)}\` |`);
  p(`| Base URL | \`${cell(report.baseUrl)}\` |`);
  p(`| Phases selected | ${report.phasesSelected.join(", ")} |`);
  p(`| Submission ceiling | ${report.ceiling} (\`--max-submissions\`) |`);
  p();
  p("### What it spent");
  p();
  p("| | |");
  p("|---|---|");
  p(`| Billable submissions created | **${report.spend.submissions}** |`);
  p(`| HTTP API requests sent | **${report.spend.apiRequests}** |`);
  p(`| …of which polls | ${report.spend.polls} |`);
  p(`| …of which \`GET /languages\` | ${report.spend.languageLookups} |`);
  p(`| HTTP 429 | ${report.spend.rateLimited} |`);
  p(`| Other failed requests | ${report.spend.failures} |`);
  p(`| POSTs the ceiling refused before sending | ${report.spend.ceilingRefusals} |`);
  p();
  p(
    "Counted at `fetch`, which is the only place that cannot be wrong about it — a " +
      "retry inside the adapter, a batch path, or a phase added later is counted here " +
      "whether or not it knows this meter exists. " +
      "`schools/ops/judge0-usage.ts` counts the same traffic from inside the provider and " +
      "feeds the admin health view; the two are independent by design, and a disagreement " +
      "between them is itself a finding.",
  );
  p();

  if (report.skipped.length > 0) {
    p("### Phases that did not run");
    p();
    p("| Phase | Why |");
    p("|---|---|");
    for (const s of report.skipped) p(`| ${s.phase} | ${cell(s.why)} |`);
    p();
  }

  /* -- 1. Identity ------------------------------------------------------ */
  p("## 1. Provider identity");
  p();
  if (!report.languages) {
    p(`Not run. Everything in this section is ${UNKNOWN}.`);
    p();
  } else {
    const l = report.languages;
    p(`Languages the service exposes: **${num(l.totalLanguages)}**.`);
    if (l.catalogueProblem) p(`\nCatalogue problem: ${l.catalogueProblem}`);
    p();
    p("### Every Python the service offers");
    p();
    if (l.pythonEntries.length === 0) {
      p(`${UNKNOWN} — the catalogue was not read.`);
    } else {
      p("| id | name | matches the adapter's discovery rule |");
      p("|---|---|---|");
      for (const e of l.pythonEntries) {
        p(`| ${e.id} | \`${cell(e.name)}\` | ${e.matchesDiscoveryRule ? "yes" : "**no**"} |`);
      }
      p();
      p(
        "The rule is `^Python\\s*\\((3(?:\\.\\d+)*)\\)$`, anchored on purpose so " +
          "`Python for ML (…)` is refused: that runtime ships numpy, and " +
          "`schools/execution/python-policy.ts` enforces standard-library-only BY ABSENCE. " +
          "Among the names that match, the highest version wins, compared numerically.",
      );
    }
    p();
    p("### What the adapter selected");
    p();
    p("| | |");
    p("|---|---|");
    p(`| Language id | ${l.selected ? String(l.selected.id) : UNKNOWN} |`);
    p(`| Catalogue name | ${l.selected ? `\`${cell(l.selected.name)}\`` : UNKNOWN} |`);
    p(`| Version parsed from the name | ${l.selected ? text(l.selected.version) : UNKNOWN} |`);
    p(`| Operator override (\`JUDGE0_LANGUAGE_ID\`) | ${l.selected ? String(l.selected.operatorOverride) : UNKNOWN} |`);
    p(`| \`sys.version\`, from the interpreter itself | ${text(l.interpreterVersion)} |`);
    p();
    if (l.selectionProblem) p(`Selection problem: ${l.selectionProblem}\n`);
    if (l.interpreterProblem) p(`Interpreter problem: ${l.interpreterProblem}\n`);
    p(
      "A catalogue label is a string Judge0 wrote next to an id. `sys.version` is the " +
        "interpreter answering for itself, and where the two disagree the interpreter wins.",
    );
    p();
    p("### RapidAPI quota headers");
    p();
    const present = Object.entries(l.quotaHeadersPresent);
    if (present.length === 0) {
      p("**No `x-ratelimit-*` header arrived on any response during this run.**");
    } else {
      p("| header | last value seen |");
      p("|---|---|");
      for (const [name, value] of present) p(`| \`${cell(name)}\` | \`${cell(value)}\` |`);
    }
    p();
    if (l.quotaHeadersAbsent.length > 0) {
      p("Looked for and **absent** — this is a finding, not an omission:");
      p();
      for (const name of l.quotaHeadersAbsent) p(`- \`${name}\``);
      p();
      p(
        "`schools/ops/provider-quota.ts` reads exactly these names. Every one that is " +
          "absent is a `null` in the health view's quota fields, permanently, and the plan " +
          "dashboard is then the only meter there is.",
      );
      p();
    }
    p("### `GET /config_info` — the plan's own ceilings");
    p();
    if (!l.configInfo) {
      p(`${UNKNOWN}${l.configInfoProblem ? ` — ${l.configInfoProblem}` : ""}`);
    } else {
      p("| field | value |");
      p("|---|---|");
      for (const [k, v] of Object.entries(l.configInfo)) p(`| \`${cell(k)}\` | ${cell(v)} |`);
      p();
      p(
        "We send `cpu_time_limit: 5` s, `wall_time_limit: 7` s and `memory_limit: 262144` " +
          "KB. If any `max_*` above is below what we send, the plan either refuses the " +
          "submission with a 400 — loud, and ours to fix — or **clamps it silently** and " +
          "runs with its own default, which shrinks every learner's budget invisibly.",
      );
    }
    p();
  }

  /* -- 2. Conformance --------------------------------------------------- */
  p("## 2. Conformance");
  p();
  if (!report.conformance) {
    p(`Not run. Every row is ${UNKNOWN}.`);
    p();
  } else {
    const matched = report.conformance.filter((r) => r.matched).length;
    p(`**${matched} of ${report.conformance.length}** matched.`);
    p();
    p("| # | program | normalised status | stdout | exit | wall ms | matched |");
    p("|---|---|---|---|---|---|---|");
    report.conformance.forEach((r, i) => {
      p(
        `| ${i + 1} | ${cell(r.id)} | \`${cell(r.status)}\` | ${cell(snippet(r.stdout, 60))} | ` +
          `${r.exitCode === null ? UNKNOWN : String(r.exitCode)} | ${r.wallMs} | ` +
          `${r.matched ? "yes" : "**NO**"} |`,
      );
    });
    p();
    for (const r of report.conformance) {
      p(`#### ${r.id}`);
      p();
      p(r.what);
      p();
      p(`- Expected: ${r.expected}`);
      p(`- Status: \`${r.status}\`, exit ${r.exitCode === null ? UNKNOWN : String(r.exitCode)}, wall ${r.wallMs} ms, memory ${num(r.memoryKb)} KB`);
      p(`- stdout: ${snippet(r.stdout)}`);
      p(`- stderr: ${snippet(r.stderr)}`);
      p(r.matched ? "- **Matched.**" : `- **MISMATCH — ${r.mismatch ?? "see above"}**`);
      p();
    }
  }

  /* -- 3. Probes -------------------------------------------------------- */
  p("## 3. Sandbox probes");
  p();
  p(
    "Observational, non-destructive, and every one cleans up after itself. The point is " +
      "to learn where the boundary actually is; an open boundary is reported as a security " +
      "limitation of the rented judge, not worked around.",
  );
  p();
  if (!report.probes) {
    p(`Not run. Every boundary below is ${UNKNOWN}.`);
    p();
  } else {
    p("| probe | boundary | status |");
    p("|---|---|---|");
    for (const r of report.probes) {
      const label = r.boundary === "open" ? "**OPEN**" : r.boundary === "held" ? "held" : UNKNOWN;
      p(`| ${cell(r.id)} | ${label} | \`${cell(r.status)}\` |`);
    }
    p();
    for (const r of report.probes) {
      p(`#### ${r.id}`);
      p();
      p(r.what + ".");
      p();
      p(`*How this stays harmless:* ${r.safety}`);
      p();
      p(fence(r.detail));
      p();
      if (r.securityNote) p(`**SECURITY LIMITATION.** ${r.securityNote}`);
      p();
    }
  }

  /* -- 4. Parity -------------------------------------------------------- */
  p("## 4. Parity with the September curriculum");
  p();
  p(
    "The programs are `tests/execution/parity-fixtures.ts` — real September reference " +
      "solutions and the mutations a fourteen-year-old actually makes — run through Judge0 " +
      "and compared against what the browser's Pyodide is asserted to produce. " +
      "**Traceback prose is not compared:** CPython rewrote its diagnostics across 3.13 and " +
      "3.14, so the wording differs by interpreter vintage and that difference is documented, " +
      "not a defect. Arithmetic, `//`, `%`, negatives, conditions, strings, Unicode and big " +
      "integers ARE compared, and a divergence there is a real finding.",
  );
  p();
  if (!report.parity) {
    p(`Not run. Every row is ${UNKNOWN}.`);
    p();
  } else {
    const matched = report.parity.filter((r) => r.matched).length;
    p(`**${matched} of ${report.parity.length}** matched.`);
    p();
    p("| fixture | expected status | actual | stdout matched | note |");
    p("|---|---|---|---|---|");
    for (const r of report.parity) {
      p(
        `| ${cell(r.id)} | \`${cell(r.expectedStatus)}\` | \`${cell(r.actualStatus)}\` | ` +
          `${r.matched ? "yes" : "**NO**"} | ${cell(r.mismatch ?? r.exempt ?? "")} |`,
      );
    }
    p();
    const failures = report.parity.filter((r) => !r.matched);
    if (failures.length > 0) {
      p("#### Divergences, in full");
      p();
      for (const r of failures) {
        p(`**${r.id}** — ${r.provenance}`);
        p();
        p(`- expected status \`${r.expectedStatus}\`, got \`${r.actualStatus}\``);
        p(`- expected stdout ${r.expectedStdout === null ? "(not asserted)" : snippet(r.expectedStdout)}`);
        p(`- actual stdout ${snippet(r.actualStdout)}`);
        p(`- ${r.mismatch ?? ""}`);
        p();
      }
    }
  }

  /* -- 5. Cost ---------------------------------------------------------- */
  p("## 5. Cost shape");
  p();
  p(
    "Two different numbers, and the user asked for them separately: a **submission** is a " +
      "program the judge ran, and an **API request** is an HTTP call the plan meters. One " +
      "submission is one POST plus however many polls it took to see a terminal status, so " +
      "requests are always the larger number and they are the one on the invoice.",
  );
  p();
  if (!report.cost) {
    p(`Not run. Every figure below is ${UNKNOWN}.`);
    p();
  } else {
    p(report.cost.selection);
    p();
    if (report.cost.problem) {
      p(`Problem during measurement: ${report.cost.problem}`);
      p();
    }
    const rows: [string, CheckMeasurement | null][] = [
      ["One ordinary Check", report.cost.ordinary],
      ["One worst-case Check", report.cost.worstCase],
    ];
    p("| | block | cases | submissions | API requests | polls | wall ms |");
    p("|---|---|---|---|---|---|---|");
    for (const [label, m] of rows) {
      if (!m) {
        p(`| ${label} | ${UNKNOWN} | ${UNKNOWN} | ${UNKNOWN} | ${UNKNOWN} | ${UNKNOWN} | ${UNKNOWN} |`);
        continue;
      }
      p(
        `| ${label} | \`${cell(m.blockId)}\` | ${m.caseCount} | **${m.submissions}** | ` +
          `**${m.apiRequests}** | ${m.polls} | ${m.wallMs} |`,
      );
    }
    p();
    const n = report.cost.classroomStudents;
    p(`### A class of ${n}, one Check each`);
    p();
    p(
      "Multiplication over the measured single-Check figures, and labelled as such: it is " +
        "arithmetic on a measurement, not itself a measurement. Real classes stagger, and " +
        "the concurrency gate changes the wall time but not these totals.",
    );
    p();
    p("| | submissions | API requests |");
    p("|---|---|---|");
    for (const [label, m] of rows) {
      if (!m) {
        p(`| ${label}, ×${n} | ${UNKNOWN} | ${UNKNOWN} |`);
        continue;
      }
      p(`| ${label}, ×${n} | **${m.submissions * n}** | **${m.apiRequests * n}** |`);
    }
    p();
  }

  /* -- 6. Concurrency --------------------------------------------------- */
  p("## 6. Staged concurrency");
  p();
  p(
    "Widths 1, 2, 4, 8, in that order, stopping **permanently** at the first 429 or " +
      "provider error. Eighteen simultaneous submissions are never issued: the server " +
      "already queues, the plan's limits are the operator's to spend, and a load test that " +
      "breaks a subscription to prove the subscription can break is not a test.",
  );
  p();
  if (!report.concurrency) {
    p(`Not run. Every figure below is ${UNKNOWN}.`);
    p();
  } else {
    p("| width | submissions | p50 ms | p95 ms | queue p50 ms | queue max ms | 429s | provider errors |");
    p("|---|---|---|---|---|---|---|---|");
    for (const s of report.concurrency.stages) {
      p(
        `| ${s.width} | ${s.submissions} | ${s.p50Ms} | ${s.p95Ms} | ${s.queueP50Ms} | ` +
          `${s.queueMaxMs} | ${s.rateLimited} | ${s.providerErrors} |`,
      );
    }
    if (report.concurrency.stages.length === 0) p(`| ${UNKNOWN} | | | | | | | |`);
    p();
    p(
      "**p95 over eight samples is the largest of the eight** — a nearest-rank percentile " +
        "on a sample this small is the maximum wearing a percentile's name, and it is " +
        "reported that way rather than dressed up. Queue time is the delay between the " +
        "burst starting and that submission's POST reaching the wire: our own concurrency " +
        "gate plus process scheduling. It does **not** include Judge0's internal queue, " +
        "which is invisible from here.",
    );
    p();
    if (report.concurrency.stoppedAtWidth !== null) {
      p(
        `**Escalation stopped at width ${report.concurrency.stoppedAtWidth}.** ` +
          `${report.concurrency.stopReason ?? ""}`,
      );
    } else {
      p("All four widths completed with no 429 and no provider error.");
    }
    p();
  }

  /* -- Findings --------------------------------------------------------- */
  p("## Findings");
  p();
  if (report.findings.length === 0) {
    p("None recorded.");
  } else {
    p("| severity | phase | finding |");
    p("|---|---|---|");
    for (const f of report.findings) {
      p(`| ${f.severity === "note" ? "note" : `**${f.severity}**`} | ${f.phase} | ${cell(f.summary)} |`);
    }
  }
  p();

  /* -- What is still unknown -------------------------------------------- */
  p("## What this run did NOT establish");
  p();
  p(
    "A validation is only worth what its boundaries are. These remain open after this run " +
      "and are not made truer by anything above:",
  );
  p();
  p(
    "- **Whether the sandbox is a sandbox.** The probes in §3 describe what a submission " +
      "could see from inside. Nothing here tests isolation between submissions, escape from " +
      "the container, or what Judge0's operator can read.",
  );
  p(
    "- **Residency, which is known rather than unknown.** This provider sends learner " +
      "source code out of Kazakhstan, against the commitment recorded in " +
      "`docs/CODE_EXECUTION_DECISION.md`. No measurement changes that.",
  );
  p(
    "- **What the plan costs, and what is left of it.** §1 records the quota headers the " +
      "service actually sent. Anything it did not send is not knowable from here and the " +
      "dashboard is the only meter.",
  );
  p(
    "- **Behaviour under a real class.** §6 stops at width 8 by design. Eighteen learners " +
      "pressing Check inside ten seconds was not simulated and must not be inferred from it.",
  );
  p(
    "- **`POST /submissions/batch`.** `JUDGE0_BATCH` is off by default and this run did not " +
      "turn it on. Whether the plan exposes the batch endpoints, and its " +
      "`max_submission_batch_size`, is unchanged by this document.",
  );
  p();
  p("---");
  p();
  p(
    `Regenerate with \`npm run judge0:validate\`. The key is read from ` +
      "`JUDGE0_RAPIDAPI_KEY` in the environment, is never written to this file, and the " +
      "writer refuses to save a document it appears in.",
  );
  p();

  return out.join("\n");
}
