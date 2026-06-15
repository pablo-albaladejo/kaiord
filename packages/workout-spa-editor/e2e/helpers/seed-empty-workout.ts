import type { Page } from "@playwright/test";

/**
 * Replaces the legacy `expandFileUpload` helper used by ~13 e2e specs.
 *
 * Two modes:
 *
 * 1. **No `krd` arg** — drives the `ImportDropzoneOverlay` flow:
 *    navigates to `/workout/new?action=import`, waits for the hidden
 *    `<input type="file">` to attach. Caller then drives
 *    `setInputFiles(...)`; the parse pipeline (`useFileUpload`) loads
 *    the KRD into the store and `EditorPage` transitions automatically
 *    to the populated `EditorBody` (see `importComplete` branch).
 *
 * 2. **With `krd` arg** — bypasses the upload UI entirely. Lands on
 *    the picker first (`/workout/new`, no auto-init), seeds the store
 *    via the dev-only `__KAIORD_WORKOUT_STORE__` global (mirrors
 *    `__KAIORD_DB__`), then navigates to `?source=scratch`. The
 *    `ScratchEditorSurface` mount effect sees `currentWorkout !== null`
 *    and skips auto-init; `WorkoutHeader` stays in view mode (seeded
 *    workout already has sport/name).
 */
// The editor consumes its query params on mount and rewrites the URL
// (strips `?source=scratch` / `?action=import` back to `/workout/new`).
// A default `goto` waits for `load`, so that client-side rewrite races
// the navigation — WebKit aborts it ("Frame load interrupted" /
// "interrupted by another navigation"), failing the seed. `waitUntil:
// "commit"` resolves once the document commits, before the rewrite; the
// explicit readiness waits below replace the dropped `load` wait.
const READY_TIMEOUT_MS = 20000;

export async function seedEmptyWorkout(
  page: Page,
  krd?: Record<string, unknown>
): Promise<void> {
  if (krd) {
    if (!page.url().includes("/workout/new")) {
      await page.goto("/workout/new", { waitUntil: "commit" });
    }
    // `commit` does not wait for scripts, so the store global may not be
    // installed yet — wait for it before seeding.
    await page.waitForFunction(
      () => "__KAIORD_WORKOUT_STORE__" in window,
      undefined,
      { timeout: READY_TIMEOUT_MS }
    );
    await page.evaluate((seed) => {
      const w = window as unknown as {
        __KAIORD_WORKOUT_STORE__?: {
          getState: () => { loadWorkout: (krd: unknown) => void };
        };
      };
      if (!w.__KAIORD_WORKOUT_STORE__) {
        throw new Error(
          "__KAIORD_WORKOUT_STORE__ is not exposed on window — the dev-only guard in src/store/workout-store.ts must be active in the build under test."
        );
      }
      w.__KAIORD_WORKOUT_STORE__.getState().loadWorkout(seed);
    }, krd);
    await page.goto("/workout/new?source=scratch", { waitUntil: "commit" });
    return;
  }

  if (!page.url().includes("action=import")) {
    await page.goto("/workout/new?action=import", { waitUntil: "commit" });
  }
  const fileInput = page.locator('input[type="file"]');
  await fileInput.waitFor({ state: "attached", timeout: READY_TIMEOUT_MS });
}
