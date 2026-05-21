import type { Page } from "@playwright/test";

/**
 * Navigates the editor to a state where the file `<input type="file">`
 * is mounted in the DOM, so specs can drive `setInputFiles(...)`
 * directly without expanding any accordion.
 *
 * Replaces the legacy `expandFileUpload` helper. The new
 * `ImportDropzoneOverlay` (mounted by `?action=import`) renders the
 * `FileUpload` molecule unconditionally, so a navigation + a wait for
 * the input is enough.
 *
 * Specs that need a non-empty seed (e.g. a pre-built KRD already in
 * the store) can pass `krd` to bypass the file picker entirely via the
 * `__KAIORD_WORKOUT_STORE__` dev global exposed in
 * `src/store/workout-store.ts` (mirrors `__KAIORD_DB__`).
 */
export async function seedEmptyWorkout(
  page: Page,
  krd?: Record<string, unknown>
): Promise<void> {
  if (!page.url().includes("/workout")) {
    await page.goto("/workout/new?action=import");
  } else if (!page.url().includes("action=import")) {
    await page.goto("/workout/new?action=import");
  }

  if (krd) {
    await page.evaluate((seed) => {
      const w = window as unknown as {
        __KAIORD_WORKOUT_STORE__?: {
          getState: () => { loadWorkout: (krd: unknown) => void };
        };
      };
      w.__KAIORD_WORKOUT_STORE__?.getState().loadWorkout(seed);
    }, krd);
    return;
  }

  const fileInput = page.locator('input[type="file"]');
  await fileInput.waitFor({ state: "attached", timeout: 20000 });
}
