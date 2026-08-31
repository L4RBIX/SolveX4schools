import "server-only";
import { redirect } from "next/navigation";
import { currentUser } from "./session";
import { anonymousLearningAllowed } from "./policy";
import type { SessionUser } from "./types";

/**
 * The session gate for a learner-facing PAGE.
 *
 * The APIs are already guarded — `requireLearner` resolves the subject from the
 * session, so no request can read another learner's work. This is the other
 * half: without it an anonymous visitor who follows "Start" lands on a
 * dashboard full of zeroes with nothing telling them they should have signed
 * in, which reads as a broken product rather than as a locked one.
 *
 * It defers to `anonymousLearningAllowed()` rather than inventing a second
 * opinion. That function already says "production and preview require a
 * session; development does not", and the development exception is what keeps
 * the lesson runtime browsable without provisioning an account. Two functions
 * with two answers is how a gate ends up open in the environment nobody checked.
 *
 * Returns the user when there is one, so a caller that needs the display name
 * does not have to ask twice.
 */
export async function requirePageSession(): Promise<SessionUser | null> {
  const user = await currentUser();
  if (user) {
    // A first-login password is a credential at least two people know.
    if (user.mustChangePassword) redirect("/account/password");
    return user;
  }
  if (anonymousLearningAllowed()) return null;
  redirect("/login");
}
