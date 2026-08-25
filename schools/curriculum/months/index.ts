import type { Month } from "../types";
import { MONTH_01_SEPTEMBER } from "./month-01-september";
import { MONTH_02_OCTOBER } from "./month-02-october";
import { MONTH_03_NOVEMBER } from "./month-03-november";
import { MONTH_04_DECEMBER } from "./month-04-december";
import { MONTH_05_JANUARY } from "./month-05-january";
import { MONTH_06_FEBRUARY } from "./month-06-february";
import { MONTH_07_MARCH } from "./month-07-march";
import { MONTH_08_APRIL } from "./month-08-april";
import { MONTH_09_MAY } from "./month-09-may";

/** All nine months, in teaching order. September through May. */
export const MONTHS: Month[] = [
  MONTH_01_SEPTEMBER,
  MONTH_02_OCTOBER,
  MONTH_03_NOVEMBER,
  MONTH_04_DECEMBER,
  MONTH_05_JANUARY,
  MONTH_06_FEBRUARY,
  MONTH_07_MARCH,
  MONTH_08_APRIL,
  MONTH_09_MAY,
];

export const MONTH_BY_INDEX: ReadonlyMap<number, Month> = new Map(
  MONTHS.map((m) => [m.index, m]),
);
