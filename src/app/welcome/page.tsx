import { permanentRedirect } from "next/navigation";

/**
 * `/welcome` was a second landing implementation. It is gone.
 *
 * Kept only as a redirect: the URL was shared during development, and a 404 on
 * a link someone already has is a worse answer than a redirect to the page that
 * replaced it. There is exactly one public landing now, at `/`.
 */
export default function WelcomeRedirect(): never {
  permanentRedirect("/");
}
