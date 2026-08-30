import "server-only";
import { createHash } from "node:crypto";
import { PROGRAM } from "@schools/curriculum/program";
import { curriculumHash } from "@schools/curriculum/publication";
import { monthInventory, programInventory } from "@schools/curriculum/inventory";
import { ATTEMPT_BLOCK_TYPES, type Month, type PublicationStatus } from "@schools/curriculum/types";

/**
 * Which content is this deployment actually serving?
 *
 * ## Why a hash and not a version number
 *
 * The programme carries no semantic version field, and inventing one would make
 * things worse rather than better: a version is a claim a human types, and the
 * failure this exists to catch is precisely the one where a human believes the
 * content is what they signed off and it is not.
 * `docs/releases/SEPTEMBER_V1_FREEZE.md` freezes September by hash for exactly
 * that reason — «a reviewer's sign-off refers to something specific» — and
 * until a deployment can be ASKED which hash it is running, that freeze is a
 * statement about a file on somebody's laptop.
 *
 * So the hash is the version. `version` renders it as
 * `cp-grade9-y1@1f3e46407318` for a human to compare against the freeze
 * document at a glance; `contentHash` carries the full digest for a machine.
 *
 * ## There is exactly one definition of a month's hash, and it is not here
 *
 * `curriculumHash` in `schools/curriculum/publication.ts` is it. That function
 * is what `curriculum_publications` stores against a reviewer's name and what
 * the approval gate compares against, so a health endpoint reporting a
 * different number for the same month would be worse than reporting none: an
 * admin would compare the two, find they disagree, and have no way to tell
 * which one the gate is using.
 *
 * The programme-level digest below is therefore derived from the month hashes
 * rather than computed over `PROGRAM` independently. It changes when any month
 * changes, which is all it is for, and it cannot drift from the per-month
 * numbers because it is made of them.
 *
 * Nothing hashed is ever emitted, only digests. A month's content includes
 * answer keys; sha256 does not run backwards.
 *
 * Computed once at module load and memoised — it is a constant of the build,
 * and re-serialising the whole programme on every health poll would be real
 * cost for a value that cannot change without a redeploy.
 */

export interface MonthFingerprint {
  index: number;
  /** The month's own digest, so a single month can be frozen independently. */
  hash: string;
  lessons: number;
  /** Attempt-bearing blocks. Reading a concept is not a task. */
  tasks: number;
  /** The weakest publication status any of its lessons carries. */
  status: PublicationStatus;
  /** True when a learner can actually reach it — the runtime gate is `!== "draft"`. */
  routable: boolean;
}

export interface CurriculumFingerprint {
  programId: string;
  /** `cp-grade9-y1@1f3e46407318`. The string to compare with the freeze doc. */
  version: string;
  contentHash: string;
  months: MonthFingerprint[];
  /** expected / implemented / validated / published, across the whole programme. */
  inventory: ReturnType<typeof programInventory>;
  /**
   * Zero today, and that is not a bug.
   *
   * `published` asserts that a human reviewed the content. September ships at
   * `implemented`, deliberately — see the remediation report §7.3. Reporting
   * the number here rather than hiding it is the point: an admin can see that
   * nothing has been signed off without reading a markdown file.
   */
  publishedTasks: number;
}

function statusOf(month: Month): PublicationStatus {
  const rank: Record<PublicationStatus, number> = {
    draft: 0,
    implemented: 1,
    validated: 2,
    published: 3,
  };
  const statuses: PublicationStatus[] = [
    ...month.units.flatMap((u) => u.lessons.map((l) => l.status)),
    ...(month.assessment ? [month.assessment.status] : []),
  ];
  if (statuses.length === 0) return "draft";
  /* The WEAKEST, not the strongest. A month is only as published as its least
     reviewed lesson, and reporting the best one would let a single signed-off
     lesson make eleven unreviewed ones look approved. */
  return statuses.reduce((worst, s) => (rank[s] < rank[worst] ? s : worst), statuses[0]);
}

function fingerprintMonth(month: Month): MonthFingerprint {
  const lessons = month.units.flatMap((u) => u.lessons);
  const blocks = [
    ...lessons.flatMap((l) => l.blocks),
    ...(month.assessment?.blocks ?? []),
  ];
  const status = statusOf(month);
  return {
    index: month.index,
    // The reviewer's number, not a second opinion about it.
    hash: curriculumHash(month),
    lessons: lessons.length,
    tasks: blocks.filter((b) => ATTEMPT_BLOCK_TYPES.has(b.type)).length,
    status,
    routable: status !== "draft" && blocks.length > 0,
  };
}

let cached: CurriculumFingerprint | null = null;

export function curriculumFingerprint(): CurriculumFingerprint {
  if (cached) return cached;

  const months = PROGRAM.months.map(fingerprintMonth);
  /* Made of the month hashes, in month order, with the programme id in front so
     two programmes that happened to contain identical months are still
     distinguishable. Deriving rather than re-hashing is what keeps this number
     and the per-month ones from ever disagreeing. */
  const contentHash = createHash("sha256")
    .update([PROGRAM.id, ...months.map((m) => `${m.index}:${m.hash}`)].join("\n"), "utf8")
    .digest("hex");

  cached = {
    programId: PROGRAM.id,
    version: `${PROGRAM.id}@${contentHash.slice(0, 12)}`,
    contentHash,
    months,
    inventory: programInventory(),
    publishedTasks: PROGRAM.months.reduce((n, m) => n + monthInventory(m).published, 0),
  };
  return cached;
}
