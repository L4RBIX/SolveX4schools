import { permanentRedirect } from "next/navigation";

/** `/paths` became `/program`. Old links keep working. */
export default function PathsRedirect(): never {
  permanentRedirect("/program");
}
