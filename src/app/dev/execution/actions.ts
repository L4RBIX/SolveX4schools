"use server";

import { probeTrustedJudge } from "@schools/ops/judge-probe";
import type { ProbeOutcome } from "./probe";

/**
 * Call the trusted judge, once, because somebody pressed a button.
 *
 * ## Why the production guard is here as well as in the layout
 *
 * `src/app/dev/layout.tsx` already calls `notFound()` in production, so nobody
 * can RENDER this page there. That is not the same as nobody being able to
 * INVOKE this. Next's own guide is explicit — "a Server Action runs as a POST
 * request against the page that invokes it… the route is reachable to anyone
 * who can send the same POST. Treat every action as an untrusted entry point",
 * and "render-time gating is not a security boundary". Dead-code elimination
 * does not save us either: it strips UNUSED Server Functions, and this one is
 * used by a component that is still in the production graph even though the
 * layout refuses to render it. The layout hides the page; this hides the
 * trigger, and against a metered judge the trigger is the part that costs
 * money. See `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`.
 *
 * Refusing rather than throwing: an exception would surface as a generic
 * digest-shaped server error and teach whoever hit it nothing. This says what
 * happened.
 *
 * ## What it costs
 *
 * Against Judge0 this is billable — a `GET /languages` on the first probe of a
 * process, then a `POST /submissions` and a poll per round. It runs once per
 * press and never on a timer, mount, focus or interval, and the page prints the
 * request count it actually spent.
 *
 * ## What it may return
 *
 * Everything `probeTrustedJudge` produces, which is deliberately free of
 * secrets: no key, no header, no raw provider body, endpoints reduced to a
 * host. This value is serialised into a browser, so that property is not a
 * nicety — see the module comment on `schools/ops/judge-probe.ts`.
 */
export async function probeJudgeAction(): Promise<ProbeOutcome> {
  if (process.env.NODE_ENV === "production") {
    return {
      kind: "refused",
      why:
        "This is a development-only tool. It refuses to call the judge in a production " +
        "build, where a probe would spend the plan's quota with no page in front of it.",
    };
  }

  return { kind: "probed", probe: await probeTrustedJudge() };
}
