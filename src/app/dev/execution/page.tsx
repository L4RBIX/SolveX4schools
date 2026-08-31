import { trustedJudgeConfig } from "@schools/ops/judge-probe";
import { ExecutionLab } from "./lab";

/**
 * The execution lab's server half.
 *
 * The page used to be `"use client"` from its first line, which meant the
 * trusted column could only ever say "see /api/health" about the provider —
 * `EXEC_PROVIDER` lives on the server and a browser has no business reading it.
 * The result was that the one page whose entire purpose is comparing the two
 * engines could not name the engine on the right.
 *
 * So the page is a Server Component that reads the configuration — free, no
 * network, no key — and hands the client half a value that is already safe to
 * put on a screen: provider id, configured or not, endpoint reduced to a host,
 * whether it is metered, whether a key is PRESENT. Never the key itself, never
 * a prefix or a length of it, never a header. See `schools/ops/judge-probe.ts`.
 *
 * Anything that requires actually calling the judge — and against a rented one
 * that is billable — stays behind the explicit button wired to
 * `probeJudgeAction`, which nothing calls on load.
 */
/**
 * Read at REQUEST time, not at build time.
 *
 * Without this the page prerenders and `EXEC_PROVIDER` is baked in from
 * whatever the build machine had — so the panel would describe a judge that has
 * nothing to do with the running deployment, confidently and with no way to
 * tell. That does not bite today, because the dev layout 404s in production
 * anyway, which is exactly why it would be missed if the layout ever changed.
 */
export const dynamic = "force-dynamic";

export default function ExecutionLabPage() {
  return <ExecutionLab judge={trustedJudgeConfig()} />;
}
