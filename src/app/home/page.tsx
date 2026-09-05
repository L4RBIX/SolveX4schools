import { MONTHS } from "@schools/curriculum/months";
import { monthOutlines } from "@schools/curriculum/public";
import { requirePageSession } from "@schools/auth/page-guard";
import { knownSubjectId } from "@schools/learning/identity";
import { getStore } from "@schools/store";
import { unlockStateForSubject } from "@schools/learning/access";
import { FIRST_MONTH_INDEX } from "@schools/policies/unlock";
import { leagueNavVisible } from "@schools/leagues/scope";
import { leagueForLearner } from "@schools/leagues/queries";
import { LEAGUE_TIERS } from "@schools/leagues/tiers";
import { leagueUnlockFor } from "@schools/leagues/unlock";
import { getStoreHandle } from "@schools/store";
import { SchoolHome } from "@/components/brilliant/app/school-home";
import type { HomeLeagueData } from "@/components/brilliant/app/league/home-league-card";

export const dynamic = "force-dynamic";

/**
 * The student home.
 *
 * The greeting used to drop the learner's name because identity was an
 * anonymous cookie and the product genuinely did not know who was reading.
 * Migration 0012 changed that: there is an account with a display name from the
 * school's roster, so the name is real when there is a session and absent when
 * there is not — which, outside development, means there is no page.
 *
 * ## Three server questions, because the client cannot answer any of them
 *
 * 1. **How far is this learner unlocked?** `unlockStateForSubject` runs the
 *    progression policy over the AUTHORED curriculum. The deck used to be given
 *    all nine months with no learner context at all, so every card emitted
 *    `/lesson/<id>` for its first three lessons — 24 links and 8 Start buttons,
 *    all two clicks from a 404, because `src/app/lesson/[lessonId]/page.tsx`
 *    correctly refuses a month this learner has not earned. Only the NUMBER
 *    crosses to the browser: `schools/policies/unlock.ts` records what happens
 *    when the rule itself is handed a presentation projection.
 * 2. **Does this school have a league?** `leagueNavVisible`, the same predicate
 *    the nav tab and `/league` ask, so a card cannot appear without a page.
 * 3. **What does the league card say?** Read below, from the ledger.
 *
 * `knownSubjectId` rather than `resolveIdentity`: a page render must not mint a
 * subject it can never set a cookie for. `null` means this learner has no
 * evidence yet, which is September and no league — the truthful answer.
 */
export default async function StudentHome() {
  const user = await requirePageSession();
  const subjectId = await knownSubjectId();

  const unlockedThrough = subjectId
    ? (await unlockStateForSubject(subjectId)).unlockedThrough
    : FIRST_MONTH_INDEX;

  /* The completions the server holds. See the `completed` prop below. */
  const completed = subjectId
    ? (await (await getStore()).completionsForSubject(subjectId)).map((c) => c.lessonId)
    : [];

  /* The predicate is a pure `config` read with no database access, so asking it
     twice costs nothing and the page reads the same as the other five learner
     pages — `leagues={leagueNavVisible(user)}` at the call site, which is the
     shape `tests/leagues/reachable.test.ts` scans for. One predicate, so the
     tab, the card and the page can never disagree about whether this school has
     a league. */
  const league =
    leagueNavVisible(user) && subjectId ? await homeLeague(subjectId) : null;

  return (
    <SchoolHome
      months={monthOutlines(MONTHS)}
      learnerName={user?.displayName ?? null}
      unlockedThrough={unlockedThrough}
      /* What the SERVER records as finished. The deck used to read
         `localStorage` alone, so a learner on a second device was invited to
         start a lesson they had already completed. Ids only — which lessons
         are done is the learner's progress; the counts beside them are not
         what a deck renders. */
      completed={completed}
      leagues={leagueNavVisible(user)}
      league={league}
    />
  );
}

/**
 * The league card's numbers, all of them from the ledger.
 *
 * `leagueUnlockFor` is `sum(amount)` over `league_xp_awards` — the same rows
 * `/league` itemises, and the same rows `awardXp` writes inside the transaction
 * that settles a submission. Below the threshold that single read is the whole
 * card and nothing else is fetched: there is no tier to show, no board to read,
 * and asking for one would be two queries spent on data the card refuses to
 * display.
 *
 * `leagueForLearner` is READ-ONLY and settles nothing. Settlement is `/league`'s
 * job on its own lazy trigger; a home screen that closed last week as a side
 * effect of being opened would make the boundary depend on which page a learner
 * happened to visit first.
 *
 * A failure here returns `null` and the card simply does not render. It must not
 * fall back to the locked state — that would tell a learner who has earned their
 * league that they have not.
 */
async function homeLeague(subjectId: string): Promise<HomeLeagueData | null> {
  try {
    const { sql } = await getStoreHandle();
    const unlock = await leagueUnlockFor(sql, subjectId);

    if (!unlock.unlocked) {
      return {
        unlocked: false,
        lifetimeXp: unlock.lifetimeXp,
        needed: unlock.needed,
        active: null,
      };
    }

    const now = new Date();
    const view = await leagueForLearner(sql, subjectId, now);
    const tier = LEAGUE_TIERS.find((t) => t.tier === view.tier) ?? LEAGUE_TIERS[0];

    /* Whole days, computed here so the card holds no clock. `Math.ceil` because
       a week with nine hours left has one day left, not zero, and floored at 0
       because a boundary that has passed and not yet settled must not render as
       a negative number on a child's home screen. */
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(view.endsAt).getTime() - now.getTime()) / 86_400_000),
    );

    return {
      unlocked: true,
      lifetimeXp: unlock.lifetimeXp,
      needed: 0,
      active: {
        tier: tier.tier,
        tierName: tier.name,
        tierHue: tier.hue,
        /* `you` is null until the learner has earned XP in the CURRENT week.
           Zero XP is true; a rank of zero would not be, so the rank stays null
           and the card says so in words. */
        weeklyXp: view.you?.weeklyXp ?? 0,
        rank: view.you?.rank ?? null,
        groupSize: view.groupSize,
        daysLeft,
      },
    };
  } catch {
    return null;
  }
}
