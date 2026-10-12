/**
 * Athlete profile import E2E (audit P-05).
 *
 * Importing an exported profile file used to keep only the name and body
 * weight: FTP, LTHR, zones and personal data were silently dropped. The
 * file is imported through the profile manager list (Athlete → Edit → Back to
 * List), and the FTP must survive into the new profile.
 */

import { expect, test } from "./fixtures/base";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const FTP = 250;

const exportedProfile = () => {
  const now = new Date().toISOString();
  return {
    id: "6f1f0d3a-3c1e-4f55-9a0e-0d2f6c9b7a11",
    name: "Imported Athlete",
    bodyWeight: 70,
    maxHeartRate: 190,
    linkedAccounts: [],
    sportZones: {
      cycling: {
        thresholds: { ftp: FTP, lthr: 170 },
        heartRateZones: { method: "custom", zones: [] },
        powerZones: { method: "custom", zones: [] },
      },
    },
    createdAt: now,
    updatedAt: now,
  };
};

test.describe("Athlete profile import", () => {
  test("should keep the FTP of an exported profile", async ({ page }) => {
    // Arrange — open the profile manager list from the Athlete page
    await page.goto("/athlete");
    await waitForDexieReady(page);
    await page.getByRole("button", { name: "Edit profile" }).click();
    await page.getByRole("button", { name: "Back to List" }).click();

    // Act
    await page.getByLabel("Import profile file").setInputFiles({
      name: "profile.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(exportedProfile())),
    });

    // Assert — the imported athlete is listed with its FTP intact
    await expect(page.getByText("Imported Athlete")).toBeVisible();
    await expect(page.getByText(`FTP: ${FTP}W`)).toBeVisible();
  });
});
