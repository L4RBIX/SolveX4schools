import { describe, expect, it } from "vitest";
import {
  attemptKeyForAddress,
  clientAddress,
  failureKeyForAccount,
  failureKeyForMissingAccount,
  identifierTooLong,
  MAX_IDENTIFIER_LENGTH,
} from "@schools/auth/rate-keys";

/**
 * What a stranger may put in the database, and what they may key it on.
 *
 * These functions decide the shape of a row an unauthenticated POST creates in
 * `rate_limit_bucket` — a table nothing prunes. The defect they close was
 * measured: a 60,000-character `schoolId` in a login body produced a 60 KB row.
 */

describe("nothing a stranger sends becomes a row they chose the size of", () => {
  it("refuses an identifier longer than the product ever issues", () => {
    expect(identifierTooLong("9i-02")).toBe(false);
    expect(identifierTooLong("x".repeat(MAX_IDENTIFIER_LENGTH))).toBe(false);
    expect(identifierTooLong("x".repeat(MAX_IDENTIFIER_LENGTH + 1))).toBe(true);
    expect(identifierTooLong("x".repeat(60_000))).toBe(true);
  });

  it("produces a fixed-length key however long the input is", () => {
    const short = failureKeyForMissingAccount("s", "a");
    const huge = failureKeyForMissingAccount("s".repeat(60_000), "u".repeat(60_000));
    expect(huge.length).toBe(short.length);
    expect(huge.length).toBeLessThan(64);
  });

  it("produces a fixed-length key for an address too", () => {
    expect(attemptKeyForAddress("::1").length).toBe(
      attemptKeyForAddress("2001:0db8:85a3:0000:0000:8a2e:0370:7334").length,
    );
  });
});

describe("one account, one allowance", () => {
  it("keys a known account on its id, which has exactly one spelling", () => {
    /* The whole point: whatever the caller typed, two requests that resolve to
       the same account land in the same bucket. `9İ-02` and `9i-02` used to be
       two buckets because the key was built from the string. */
    expect(failureKeyForAccount("abc-123")).toBe(failureKeyForAccount("abc-123"));
    expect(failureKeyForAccount("abc-123")).not.toBe(failureKeyForAccount("abc-124"));
  });

  it("folds an unknown username so two spellings still share one bucket", () => {
    expect(failureKeyForMissingAccount("s", "Ghost-01")).toBe(
      failureKeyForMissingAccount("s", "ghost-01"),
    );
  });

  it("does not share a bucket between schools", () => {
    expect(failureKeyForMissingAccount("a", "ghost")).not.toBe(
      failureKeyForMissingAccount("b", "ghost"),
    );
  });
});

describe("the address is only trusted where a platform writes it", () => {
  const headers = (v: string) => new Headers({ "x-forwarded-for": v });

  it("is ignored entirely when nothing trustworthy set it", () => {
    expect(clientAddress(headers("203.0.113.7"), false)).toBeNull();
  });

  it("takes the leftmost entry, which is the peer", () => {
    expect(clientAddress(headers("203.0.113.7, 10.0.0.1"), true)).toBe("203.0.113.7");
  });

  it("refuses anything that is not shaped like an address", () => {
    /* A key an attacker picks is a key an attacker can exhaust on somebody
       else's behalf, so an unparseable value produces no bucket at all rather
       than a bucket named after whatever arrived. */
    expect(clientAddress(headers("x".repeat(4000)), true)).toBeNull();
    expect(clientAddress(headers("not an address"), true)).toBeNull();
    expect(clientAddress(headers(""), true)).toBeNull();
    expect(clientAddress(new Headers(), true)).toBeNull();
  });
});
