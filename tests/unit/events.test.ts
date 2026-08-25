import { describe, expect, it } from "vitest";

import {
  ALLOWED_PAYLOAD_KEYS,
  CODE_TRANSPORT_KEY,
  EVENT_TRUST,
  LEARNING_EVENTS,
  editDistanceBucket,
  inputSizeClass,
  isLearningEventName,
  sanitizePayload,
  secondsBucket,
  toLearningVerdict,
} from "../../packages/learning-contracts/src/events";

/**
 * The allowlist is the privacy guarantee, so these tests are the audit: if a
 * key can reach `learning_events.payload`, it is named in ALLOWED_PAYLOAD_KEYS
 * and nowhere else.
 */

describe("event names", () => {
  it("accepts only taxonomy names", () => {
    expect(isLearningEventName("code_diff_classified")).toBe(true);
    expect(isLearningEventName("button_clicked")).toBe(false);
    expect(isLearningEventName("")).toBe(false);
    expect(isLearningEventName(null)).toBe(false);
  });

  it("assigns a trust level to every event", () => {
    for (const name of LEARNING_EVENTS) {
      expect(EVENT_TRUST[name]).toBeTruthy();
    }
  });
});

describe("sanitizePayload", () => {
  it("keeps allowlisted scalars", () => {
    expect(sanitizePayload({ diff_class: "local_fix", lines_added: 3, contains_code: true })).toEqual(
      { diff_class: "local_fix", lines_added: 3, contains_code: true }
    );
  });

  it("drops anything not on the allowlist", () => {
    const dirty = {
      diff_class: "local_fix",
      source_code: "int main(){}",
      handle: "tourist",
      email: "a@b.c",
      stdout: "42",
      access_token: "secret",
    };
    expect(sanitizePayload(dirty)).toEqual({ diff_class: "local_fix" });
  });

  it("never lets the code transport key through", () => {
    // The route extracts and hashes it. If a route ever forgets, this makes
    // the failure "no code stored" rather than "a file in a jsonb column".
    const result = sanitizePayload({ [CODE_TRANSPORT_KEY]: "int main(){}", verdict: "accepted" });
    expect(result).toEqual({ verdict: "accepted" });
    expect(CODE_TRANSPORT_KEY in result).toBe(false);
  });

  it("drops objects and arrays that could smuggle a payload", () => {
    expect(sanitizePayload({ verdict: { nested: "x" }, language: ["cpp"] })).toEqual({});
  });

  it("drops an implausible idle gap rather than clamping it", () => {
    // A closed laptop lid produces an honest number that describes suspension,
    // not thinking. A clamped value would read as a genuine pause.
    expect(sanitizePayload({ gap_seconds: 99999 })).toEqual({});
    expect(sanitizePayload({ gap_seconds: -5 })).toEqual({});
    expect(sanitizePayload({ gap_seconds: 120 })).toEqual({ gap_seconds: 120 });
  });

  it("truncates long strings and caps key count", () => {
    const long = "x".repeat(500);
    expect(String(sanitizePayload({ task_ref: long }).task_ref).length).toBeLessThanOrEqual(96);

    const many: Record<string, string> = {};
    for (const key of ALLOWED_PAYLOAD_KEYS) many[key] = "v";
    expect(Object.keys(sanitizePayload(many)).length).toBeLessThanOrEqual(24);
  });

  it("returns an empty object for junk input", () => {
    expect(sanitizePayload(null)).toEqual({});
    expect(sanitizePayload("string")).toEqual({});
    expect(sanitizePayload([1, 2])).toEqual({});
  });
});

describe("toLearningVerdict", () => {
  it("maps real judgements about the learner's code", () => {
    expect(toLearningVerdict("accepted")).toBe("accepted");
    expect(toLearningVerdict("Wrong Answer")).toBe("wrong_answer");
    expect(toLearningVerdict("compilation_error")).toBe("compile_error");
    expect(toLearningVerdict("time_limit")).toBe("time_limit_exceeded");
  });

  it("returns null for infrastructure failures", () => {
    // The distinction the whole picture rests on: a Wrong Answer is the
    // product working, a judge timeout is the product failing. If these shared
    // a bucket, "solve rate" would silently become "uptime".
    for (const status of ["error", "internal_error", "timeout", "queue", "processing", "not_run"]) {
      expect(toLearningVerdict(status)).toBeNull();
    }
    expect(toLearningVerdict(null)).toBeNull();
    expect(toLearningVerdict("")).toBeNull();
  });
});

describe("buckets", () => {
  it("bucket edit distance monotonically", () => {
    expect(editDistanceBucket(1)).toBe("1");
    expect(editDistanceBucket(5)).toBe("2-10");
    expect(editDistanceBucket(500)).toBe("200+");
  });

  it("buckets seconds and input size", () => {
    expect(secondsBucket(10)).toBe("<30s");
    expect(secondsBucket(3600)).toBe("10m+");
    expect(inputSizeClass(0)).toBe("empty");
    expect(inputSizeClass(5000)).toBe("large");
  });
});
