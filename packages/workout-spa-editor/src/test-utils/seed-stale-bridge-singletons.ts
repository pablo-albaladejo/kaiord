/**
 * Seeds the bridge singleton keys with a stale marker BEFORE `test-setup.ts`
 * runs, so the cleanup in that file has something to remove on every test
 * file rather than only on the ones that happen to follow a worker-mate.
 *
 * This is what makes the invariant executable. Asserting "the keys are
 * absent" is otherwise vacuous: a worker starting with an empty
 * `globalThis` satisfies it whether or not the cleanup still exists.
 * Seeding first means removing `resetBridgeSingletons()` from the setup
 * fails the assertion deterministically, in every file, instead of only
 * when the scheduler happens to reuse a worker.
 *
 * Registered ahead of `test-setup.ts` in `vitest.config.ts` — setupFiles
 * run in order. See #1094.
 */
export const STALE_MARKER = "__stale_from_seed__";

const g = globalThis as unknown as Record<string, unknown>;
g.__KAIORD_BRIDGE_DISCOVERY__ = { [STALE_MARKER]: true };
g.__KAIORD_BRIDGE_CONNECTIONS__ = { [STALE_MARKER]: true };
