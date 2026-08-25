import { MONTHS } from "@schools/curriculum/months";
import { SchoolHome } from "@/components/brilliant/app/school-home";

/**
 * The student home — the product's root.
 *
 * `learnerName` is a placeholder until enrolment exists. It is a display string
 * only; nothing keys off it.
 */
export default function Home() {
  return <SchoolHome months={MONTHS} learnerName="Bekarys" />;
}
