/* Deliberately NOT `server-only`: this is pure crypto with no server resource,
   and the provisioning CLI (`scripts/provision-class.ts`) needs it outside a
   request. Nothing client-side imports it, and `check:bundle` would say so. */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/**
 * Password hashing.
 *
 * scrypt from `node:crypto`. No new dependency, memory-hard, and available
 * everywhere this runs. The parameters are written into the stored record
 * rather than assumed, so raising them later does not invalidate every existing
 * credential — an old hash verifies against the cost it was made with, and can
 * be transparently upgraded on the next successful login.
 *
 * N = 2^15 is a deliberate middle: roughly 100ms and 32MB per verification on
 * the hardware this pilot runs on. High enough that a stolen table is not a
 * weekend project, low enough that eighteen students logging in at 09:00 do not
 * queue behind each other's key derivations.
 */
const PARAMS = { N: 1 << 15, r: 8, p: 1, keylen: 64 } as const;
/** scrypt refuses to allocate past this; it must exceed 128 * N * r. */
const MAXMEM = 128 * PARAMS.N * PARAMS.r * 2;

export interface StoredPassword {
  hash: string;
  salt: string;
}

/** `scrypt$N$r$p$<hex>` — the cost travels with the digest. */
function encode(digest: Buffer): string {
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${digest.toString("hex")}`;
}

function decode(stored: string): { N: number; r: number; p: number; digest: Buffer } | null {
  const parts = stored.split("$");
  if (parts.length !== 5 || parts[0] !== "scrypt") return null;
  const [, n, r, p, hex] = parts;
  const N = Number(n);
  const rr = Number(r);
  const pp = Number(p);
  if (!Number.isInteger(N) || !Number.isInteger(rr) || !Number.isInteger(pp)) return null;
  if (N <= 0 || rr <= 0 || pp <= 0) return null;
  try {
    return { N, r: rr, p: pp, digest: Buffer.from(hex, "hex") };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<StoredPassword> {
  const salt = randomBytes(16);
  const digest = await scrypt(password, salt, PARAMS.keylen, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    maxmem: MAXMEM,
  });
  return { hash: encode(digest), salt: salt.toString("hex") };
}

/**
 * Verify a password.
 *
 * Returns false for a malformed record rather than throwing: a corrupted row
 * must read as "wrong password" to the caller, not as a 500 that tells an
 * attacker they found something interesting.
 */
export async function verifyPassword(
  password: string,
  stored: StoredPassword,
): Promise<boolean> {
  const parsed = decode(stored.hash);
  if (!parsed) return false;

  let salt: Buffer;
  try {
    salt = Buffer.from(stored.salt, "hex");
  } catch {
    return false;
  }
  if (salt.length === 0) return false;

  const candidate = await scrypt(password, salt, parsed.digest.length, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p,
    maxmem: 128 * parsed.N * parsed.r * 2,
  });

  // Length-mismatched buffers make timingSafeEqual throw, which would itself be
  // a signal. Compare lengths first, then compare in constant time.
  if (candidate.length !== parsed.digest.length) return false;
  return timingSafeEqual(candidate, parsed.digest);
}

/**
 * A credential a teacher can read aloud and a 14-year-old can type.
 *
 * No `0/O`, no `1/l/I`. Four groups of four is long enough that guessing is not
 * a strategy and short enough to write on a card. It is a FIRST password:
 * `must_change_password` is set on every account created with one.
 */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateInitialPassword(): string {
  const bytes = randomBytes(16);
  let out = "";
  for (let i = 0; i < 16; i += 1) {
    if (i > 0 && i % 4 === 0) out += "-";
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * The one rule a changed password must satisfy.
 *
 * Deliberately minimal. Composition rules ("one capital, one symbol") push
 * teenagers toward `Password1!` and toward writing it on the desk; length is
 * the property that actually resists guessing. Ten characters, and nothing that
 * is obviously the username.
 */
export function passwordProblem(password: string, username: string): string | null {
  if (password.length < 10) return "too_short";
  if (password.length > 200) return "too_long";
  if (password.toLowerCase().includes(username.toLowerCase())) return "contains_username";
  return null;
}
