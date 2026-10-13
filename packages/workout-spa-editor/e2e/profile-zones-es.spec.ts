/**
 * E2E: the Profile Manager's zones tab speaks Spanish for the heart-rate
 * unit. "bpm" is English; Spanish writes "ppm" (pulsaciones por minuto).
 * `verify:prod`'s i18n scan reads the same tab on production.
 */

import { expect, test } from "./fixtures/base";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const PROFILE_ID = "e2e-es-zones-profile";
const LTHR = 168;

test.use({ locale: "es-ES" });

test.describe("Profile Manager zones tab in Spanish", () => {
  test("should show ppm and never bpm", async ({ page }) => {
    // Arrange
    await page.goto("/athlete");
    await waitForDexieReady(page);
    await page.evaluate(
      async ({ profileId, lthr }) => {
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as {
          table: (n: string) => {
            put: (r: unknown) => Promise<void>;
            clear: () => Promise<void>;
          };
        };
        const now = new Date().toISOString();
        for (const t of ["profiles", "meta", "userPreferences"]) {
          await db.table(t).clear();
        }
        await db.table("profiles").put({
          id: profileId,
          name: "Perfil ES",
          linkedAccounts: [],
          sportZones: {
            cycling: {
              thresholds: { lthr },
              heartRateZones: { method: "manual", zones: [] },
              powerZones: { method: "manual", zones: [] },
            },
          },
          createdAt: now,
          updatedAt: now,
        });
        await db
          .table("meta")
          .put({ key: "activeProfileId", value: profileId });
        await db
          .table("userPreferences")
          .put({ profileId, calendarView: "grid", updatedAt: now });
      },
      { profileId: PROFILE_ID, lthr: LTHR }
    );
    await page.goto("/athlete");

    // Act
    await page.getByRole("button", { name: "Editar perfil" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("tab", { name: "Zonas de entrenamiento" }).click();

    // Assert
    await expect(dialog.getByText("ppm").first()).toBeVisible();
    await expect(dialog).not.toContainText(/\bbpm\b/);
  });
});
