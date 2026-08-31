/** The three report windows the learner can choose between. */
export const PERIODS = ["week", "month", "year"] as const;

export type Period = (typeof PERIODS)[number];

export function isPeriod(value: unknown): value is Period {
  return typeof value === "string" && (PERIODS as readonly string[]).includes(value);
}
