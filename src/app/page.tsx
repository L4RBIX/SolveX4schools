import { MONTHS } from "@schools/curriculum/months";
import { MonthMap } from "@/components/sx/month-map";

/**
 * The year map — the product's home.
 *
 * `currentMonth` is hard-coded to 1 until enrolment exists. When a class has a
 * start date this comes from it; deriving it from the wall clock would put a
 * student who joins in November into month 3 with nothing behind them.
 */
export default function Home() {
  return <MonthMap months={MONTHS} currentMonth={1} />;
}
