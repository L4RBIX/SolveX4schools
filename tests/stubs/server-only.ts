/**
 * Stub for `server-only` under vitest.
 *
 * The real package throws on import so that a module holding a secret cannot be
 * pulled into a client bundle. That guarantee is enforced by the Next build,
 * where a client bundle exists. Under the node test runner there is none, so
 * importing the real package would fail every server-module test for a reason
 * that has nothing to do with the code under test.
 *
 * The guard stays in the sources. Only the test runner sees this.
 */
export {};
