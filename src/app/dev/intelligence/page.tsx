import { decide } from "@solvex/learning-intelligence-core";
import { getStore, getStoreHandle } from "@schools/store";
import { resolveIdentity } from "@schools/learning/identity";
import { buildEvidence } from "@schools/presentation/evidence";

/**
 * The pipeline, end to end, for the current browser's subject.
 *
 * Shows every hop: raw events → episodes → learner state → decision →
 * directive. When something downstream looks wrong, this is where you find out
 * which hop dropped it — which is how the attributions-not-persisted bug was
 * found, by reading the database rather than the screen.
 */

export const dynamic = "force-dynamic";

export default async function IntelligenceLab() {
  const { subjectId } = await resolveIdentity();
  const store = await getStore();
  const { sql } = await getStoreHandle();

  const events = await store.eventsForSubject(subjectId);
  const inputs = await store.episodeInputsFor(subjectId);
  const persisted = await store.getLearnerState(subjectId);
  const decision = persisted ? decide(persisted.state) : null;
  const lastSweep = await store.lastSweepAt();

  const counts = await sql.query<{ event_name: string; source_trust: string; n: number }>(
    `select event_name, source_trust, count(*)::int as n
       from learning_events where subject_id = $1
      group by 1, 2 order by 3 desc`,
    [subjectId],
  );

  return (
    <div className="flex flex-col gap-8">
      <Section title="Subject">
        <Row k="subject_id" v={subjectId} />
        <Row k="events" v={String(events.length)} />
        <Row k="episodes" v={String(inputs.length)} />
        <Row k="last sweep" v={lastSweep ?? "never"} />
        <Row
          k="state age"
          v={
            persisted
              ? `${Math.round((Date.now() - Date.parse(persisted.computedAt)) / 1000)}s`
              : "no state"
          }
        />
      </Section>

      <Section title="1 — Raw events, by name and trust">
        <table className="w-full text-left text-[14px]">
          <thead className="text-white/40">
            <tr><th className="py-1">event</th><th>trust</th><th className="text-right">n</th></tr>
          </thead>
          <tbody className="font-b-mono">
            {counts.rows.map((r) => (
              <tr key={`${r.event_name}:${r.source_trust}`} className="border-t border-white/10">
                <td className="py-1">{r.event_name}</td>
                <td className={r.source_trust === "browser" ? "text-white/40" : "text-b-green-2"}>
                  {r.source_trust}
                </td>
                <td className="text-right tabular-nums">{r.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[13px] text-white/40">
          Green trust levels are ones the server or the judge stated. `browser` is
          what a client claimed and is never used to raise a belief.
        </p>
      </Section>

      <Section title="2 — Episodes">
        <table className="w-full text-left text-[14px]">
          <thead className="text-white/40">
            <tr>
              <th className="py-1">task</th><th>skill</th><th>outcome</th>
              <th>struggle</th><th className="text-right">indep.</th><th className="text-right">attrib.</th>
            </tr>
          </thead>
          <tbody className="font-b-mono">
            {inputs.map((i) => (
              <tr key={i.episodeId} className="border-t border-white/10">
                <td className="py-1">{i.taskRef}</td>
                <td className={i.skill ? "" : "text-white/30"}>{i.skill ?? "— (unmeasured)"}</td>
                <td>{i.episode.outcome}</td>
                <td>{i.episode.struggle_class ?? "—"}</td>
                <td className="text-right tabular-nums">{i.episode.independence_weight}</td>
                <td className="text-right tabular-nums">{i.episode.attributed_failures}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[13px] text-white/40">
          A null skill is correct for an episode that produced no verdict. It is what
          keeps ungraded work out of the model.
        </p>
      </Section>

      <Section title="3 — LearnerState">
        {persisted ? (
          <pre className="overflow-x-auto font-b-mono text-[13px] leading-5 text-white/80">
            {JSON.stringify(persisted.state, null, 2)}
          </pre>
        ) : (
          <p className="text-white/50">No state yet — the sweep has seen nothing from this subject.</p>
        )}
      </Section>

      <Section title="4 — Decision + Nova directive">
        {decision ? (
          <>
            <Row k="action" v={decision.primary.actionType} />
            <Row k="skill" v={decision.primary.skill ?? "—"} />
            <Row k="confidence" v={decision.primary.confidence.toFixed(2)} />
            <Row k="reason" v={decision.primary.reason} />
            <Row k="expected" v={decision.primary.expectedOutcome} />
            <pre className="mt-3 overflow-x-auto font-b-mono text-[13px] leading-5 text-white/80">
              {JSON.stringify(decision.primary.nova, null, 2)}
            </pre>
          </>
        ) : (
          <p className="text-white/50">No decision without state.</p>
        )}
      </Section>

      <Section title="5 — Learner-facing evidence (what /you shows)">
        <pre className="overflow-x-auto font-b-mono text-[13px] leading-5 text-white/80">
          {JSON.stringify(
            buildEvidence(persisted?.state ?? null, 1).filter((s) => s.state !== "not_started"),
            null,
            2,
          )}
        </pre>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[16px] border-2 border-b-edge bg-b-bg p-5">
      <h2 className="mb-3 text-[16px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4 border-t border-white/10 py-1 text-[14px] first:border-0">
      <span className="w-40 shrink-0 text-white/40">{k}</span>
      <span className="font-b-mono break-all">{v}</span>
    </div>
  );
}
