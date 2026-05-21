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
export async function seedEmptyWorkout(
  page: Page,
  krd?: Record<string, unknown>
): Promise<void> {
  if (krd) {
    if (!page.url().includes("/workout/new")) {
      await page.goto("/workout/new");
    }
    await page.evaluate((seed) => {
      const w = window as unknown as {
        __KAIORD_WORKOUT_STORE__?: {
          getState: () => { loadWorkout: (krd: unknown) => void };
        };
      };
      w.__KAIORD_WORKOUT_STORE__?.getState().loadWorkout(seed);
    }, krd);
    await page.goto("/workout/new?source=scratch");
    return;
  }

  if (!page.url().includes("action=import")) {
    await page.goto("/workout/new?action=import");
  }
  const fileInput = page.locator('input[type="file"]');
  await fileInput.waitFor({ state: "attached", timeout: 20000 });
}
