import { requireUser } from "@schools/auth/guard";
import { getStore } from "@schools/store";
import { parsePreferences, type Preferences } from "@schools/preferences/types";

/**
 * The signed-in learner's preferences.
 *
 * Scoped by construction: the user id comes from the session, never from the
 * request, so there is no version of this route that can read or write someone
 * else's settings.
 *
 * Anonymous callers get 401 rather than an error page. That is not a failure
 * state for the client — `PreferencesProvider` treats it as "nothing to merge"
 * and keeps using the local value, which is exactly right on a public page.
 */

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return Response.json({ error: auth.reason }, { status: auth.status });

  const store = await getStore();
  const stored = await store.getPreferences(auth.value.userId);

  /* `null` travels as null, not as the defaults. The client needs to tell
     "never saved" (keep the local value) from "saved, all defaults" (adopt
     them) — collapsing the two lets a stale local value silently win over a
     deliberate reset made at another desk. */
  return Response.json({
    preferences: stored === null ? null : parsePreferences(stored),
  });
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return Response.json({ error: auth.reason }, { status: auth.status });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  // Coerced, never trusted. An unrecognised theme becomes "auto" rather than
  // reaching the `<html>` stamp as the literal string it arrived as.
  const preferences: Preferences = parsePreferences(
    (body as { preferences?: unknown })?.preferences ?? body,
  );

  const store = await getStore();
  await store.putPreferences(auth.value.userId, preferences);

  return Response.json({ preferences });
}
