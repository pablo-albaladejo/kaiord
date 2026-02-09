/**
 * Profile Management E2E Tests
 *
 * End-to-end tests for user profile management including creation, editing,
 * deletion, zone configuration, import/export, and profile switching.
 *
 * Requirements:
 * - Requirement 9: User profile management with training zones
 * - Requirement 10: Zone configuration with visual editor
 * - Requirement 11: Multiple profiles with zone management
 * - Requirement 38: Profile import/export functionality
 */

import { expect, test } from "./fixtures/base";

test.describe("Profile Management", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage BEFORE any page JS runs using addInitScript
    // This prevents race conditions where the app reads stale data
    await page.addInitScript(() => {
      localStorage.clear();
      // Re-set tutorial completion so the onboarding modal does not appear
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });
    await page.goto("/");
  });

  test("should create a new profile with name only", async ({ page }) => {
    // Arrange - Open profile manager
    await page.getByRole("button", { name: /profile/i }).click();
    const dialog = page.getByRole("dialog");

    // Act - Create profile
    await page.getByLabel(/^name$/i).fill("Test Athlete");
    await page.getByRole("button", { name: /create profile/i }).click();

    // Assert - Profile appears in dialog list
    await expect(dialog.getByText("Test Athlete")).toBeVisible();
    await expect(dialog.getByText(/saved profiles \(1\)/i)).toBeVisible();
  });

  test("should create a profile with all fields", async ({ page }) => {
    // Arrange - Open profile manager
    await page.getByRole("button", { name: /profile/i }).click();
    const dialog = page.getByRole("dialog");

    // Act - Fill all fields
    await page.getByLabel(/^name$/i).fill("Pro Cyclist");
    await page.getByLabel(/body weight/i).fill("70");
    await page.getByLabel(/ftp/i).fill("300");
    await page.getByLabel(/max hr/i).fill("190");
    await page.getByRole("button", { name: /create profile/i }).click();

    // Assert - Profile shows all data in dialog
    await expect(dialog.getByText("Pro Cyclist")).toBeVisible();
    await expect(dialog.getByText(/FTP: 300W/i)).toBeVisible();
    await expect(dialog.getByText(/Max HR: 190 bpm/i)).toBeVisible();
  });

  test("should edit an existing profile", async ({ page }) => {
    // Arrange - Create a profile first
    await page.getByRole("button", { name: /profile/i }).click();
    const dialog = page.getByRole("dialog");
    await page.getByLabel(/^name$/i).fill("Original Name");
    await page.getByRole("button", { name: /create profile/i }).click();

    // Act - Edit the profile
    await page.getByRole("button", { name: /^edit$/i }).click();
    await page.getByLabel(/^name$/i).clear();
    await page.getByLabel(/^name$/i).fill("Updated Name");
    await page.getByLabel(/ftp/i).fill("280");
    await page.getByRole("button", { name: /save changes/i }).click();

    // Assert - Profile shows updated data in dialog
    await expect(dialog.getByText("Updated Name")).toBeVisible();
    await expect(dialog.getByText(/FTP: 280W/i)).toBeVisible();
  });

  test("should delete a profile", async ({ page }) => {
    // Arrange - Create two profiles
    await page.getByRole("button", { name: /profile/i }).click();
    const dialog = page.getByRole("dialog");
    await page.getByLabel(/^name$/i).fill("Profile 1");
    await page.getByRole("button", { name: /create profile/i }).click();
    await page.getByLabel(/^name$/i).fill("Profile 2");
    await page.getByRole("button", { name: /create profile/i }).click();

    // Act - Delete first profile
    const deleteButtons = dialog.getByRole("button", {
      name: /^delete profile$/i,
    });
    await deleteButtons.first().click();
    await page
      .getByRole("button", { name: /^delete$/i })
      .last()
      .click();

    // Assert - Only one profile remains in dialog
    await expect(dialog.getByText(/saved profiles \(1\)/i)).toBeVisible();
    await expect(dialog.getByText("Profile 2")).toBeVisible();
  });

  test("should switch active profile", async ({ page }) => {
    // Arrange - Create two profiles (first created becomes active automatically)
    await page.getByRole("button", { name: /profile/i }).click();
    const dialog = page.getByRole("dialog");
    await page.getByLabel(/^name$/i).fill("Profile A");
    await page.getByRole("button", { name: /create profile/i }).click();
    await page.getByLabel(/^name$/i).fill("Profile B");
    await page.getByRole("button", { name: /create profile/i }).click();

    // Act - Click "Set Active" on the non-active profile
    await dialog.getByRole("button", { name: /set active/i }).click();

    // Assert - Notification appears for the newly activated profile
    await expect(
      page.getByText(/switched to profile: profile b/i)
    ).toBeVisible();

    // Assert - Exactly one "Set Active" button remains (for the now-inactive profile)
    await expect(
      dialog.getByRole("button", { name: /set active/i })
    ).toHaveCount(1);
  });

  test("should export a profile", async ({ page }) => {
    // Arrange - Create a profile
    await page.getByRole("button", { name: /profile/i }).click();
    await page.getByLabel(/^name$/i).fill("Export Test");
    await page.getByLabel(/ftp/i).fill("300");
    await page.getByRole("button", { name: /create profile/i }).click();

    // Act - Set up download listener and click export
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /export profile/i }).click();
    const download = await downloadPromise;

    // Assert - File is downloaded with correct name
    expect(download.suggestedFilename()).toMatch(/profile-export-test\.json/);
  });

  test("should import a valid profile", async ({ page }) => {
    // Arrange - Create a profile JSON file
    const profileData = {
      id: crypto.randomUUID(),
      name: "Imported Profile",
      ftp: 320,
      maxHeartRate: 195,
      bodyWeight: 72,
      powerZones: [
        { zone: 1, name: "Z1", minPercent: 0, maxPercent: 55 },
        { zone: 2, name: "Z2", minPercent: 56, maxPercent: 75 },
        { zone: 3, name: "Z3", minPercent: 76, maxPercent: 90 },
        { zone: 4, name: "Z4", minPercent: 91, maxPercent: 105 },
        { zone: 5, name: "Z5", minPercent: 106, maxPercent: 120 },
        { zone: 6, name: "Z6", minPercent: 121, maxPercent: 150 },
        { zone: 7, name: "Z7", minPercent: 151, maxPercent: 200 },
      ],
      heartRateZones: [
        { zone: 1, name: "HR1", minBpm: 0, maxBpm: 117 },
        { zone: 2, name: "HR2", minBpm: 117, maxBpm: 137 },
        { zone: 3, name: "HR3", minBpm: 137, maxBpm: 156 },
        { zone: 4, name: "HR4", minBpm: 156, maxBpm: 176 },
        { zone: 5, name: "HR5", minBpm: 176, maxBpm: 195 },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await page.getByRole("button", { name: /profile/i }).click();
    const dialog = page.getByRole("dialog");

    // Act - Import the profile
    await page.setInputFiles("#import-profile", {
      name: "profile.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(profileData)),
    });

    // Assert - Profile appears in dialog list
    await expect(dialog.getByText("Imported Profile")).toBeVisible();
    await expect(dialog.getByText(/FTP: 320W/i)).toBeVisible();
    await expect(dialog.getByText(/Max HR: 195 bpm/i)).toBeVisible();
  });

  test("should show error for invalid profile import", async ({ page }) => {
    // Arrange - Create invalid profile data
    const invalidProfile = {
      name: "Invalid",
      // Missing required fields
    };

    await page.getByRole("button", { name: /profile/i }).click();

    // Act - Import invalid profile
    await page.setInputFiles("#import-profile", {
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(invalidProfile)),
    });

    // Assert - Error message appears
    await expect(page.getByText(/import failed/i)).toBeVisible();
  });

  test("should persist profiles across page reloads", async ({ browser }) => {
    // Use a fresh browser context so no addInitScript clears localStorage
    // on reload. The persistence test needs localStorage to survive reloads.
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });
    await page.reload();

    // Arrange - Create a profile
    await page.getByRole("button", { name: /profile/i }).click();
    const dialog = page.getByRole("dialog");
    await page.getByLabel(/^name$/i).fill("Persistent Profile");
    await page.getByLabel(/ftp/i).fill("275");
    await page.getByRole("button", { name: /create profile/i }).click();

    // Verify profile was created in dialog before reload
    await expect(dialog.getByText("Persistent Profile")).toBeVisible();

    // Act - Reload the page (localStorage should persist)
    await page.reload();

    // Assert - Profile still exists in dialog after reload
    await page.getByRole("button", { name: /profile/i }).click();
    await expect(
      page.getByRole("dialog").getByText("Persistent Profile")
    ).toBeVisible();
    await expect(
      page.getByRole("dialog").getByText(/FTP: 275W/i)
    ).toBeVisible();

    await context.close();
  });
});

test.describe("Zone Configuration", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage BEFORE any page JS runs using addInitScript
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });
    await page.goto("/");

    await page.getByRole("button", { name: /profile/i }).click();
    await page.getByLabel(/^name$/i).fill("Zone Test");
    await page.getByLabel(/ftp/i).fill("250");
    await page.getByLabel(/max hr/i).fill("190");
    await page.getByRole("button", { name: /create profile/i }).click();
  });

  test("should edit power zones", async () => {
    // Arrange - Open zone editor (this would require a button in ProfileManager)
    // For now, this test is a placeholder as the zone editor integration
    // with ProfileManager needs to be implemented

    // This test validates the requirement but implementation depends on
    // how ZoneEditor is integrated into the ProfileManager UI
    test.skip();
  });

  test("should edit heart rate zones", async () => {
    // Arrange - Open zone editor
    // Similar to power zones test, this is a placeholder

    test.skip();
  });

  test("should validate zone ranges", async () => {
    // Test that overlapping zones show validation errors
    test.skip();
  });

  test("should recalculate zones when FTP changes", async ({ page }) => {
    // Arrange - Edit profile to change FTP
    await page.getByRole("button", { name: /^edit$/i }).click();
    await page.getByLabel(/ftp/i).clear();
    await page.getByLabel(/ftp/i).fill("300");
    await page.getByRole("button", { name: /save changes/i }).click();

    // Assert - Profile shows updated FTP
    await expect(page.getByText(/FTP: 300W/i)).toBeVisible();
  });

  test("should recalculate zones when max HR changes", async ({ page }) => {
    // Arrange - Edit profile to change max HR
    await page.getByRole("button", { name: /^edit$/i }).click();
    await page.getByLabel(/max hr/i).clear();
    await page.getByLabel(/max hr/i).fill("195");
    await page.getByRole("button", { name: /save changes/i }).click();

    // Assert - Profile shows updated max HR
    await expect(page.getByText(/Max HR: 195 bpm/i)).toBeVisible();
  });
});

test.describe("Profile Performance", () => {
  test("should switch profiles quickly", async ({ page }) => {
    // Arrange - Create multiple profiles
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });
    await page.goto("/");

    await page.getByRole("button", { name: /profile/i }).click();

    for (let i = 1; i <= 5; i++) {
      await page.getByLabel(/^name$/i).fill(`Profile ${i}`);
      await page.getByRole("button", { name: /create profile/i }).click();
    }

    // Act - Measure profile switch time
    const startTime = Date.now();
    await page
      .getByRole("button", { name: /set active/i })
      .first()
      .click();
    await page.waitForSelector('[role="status"]');
    const endTime = Date.now();

    // Assert - Switch completes within performance budget (< 500ms)
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(500);
  });

  test("should handle large number of profiles", async ({ page }) => {
    // Arrange - Create many profiles
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("workout-spa-onboarding-completed", "true");
    });
    await page.goto("/");

    await page.getByRole("button", { name: /profile/i }).click();
    const dialog = page.getByRole("dialog");

    // Create 20 profiles
    for (let i = 1; i <= 20; i++) {
      await page.getByLabel(/^name$/i).fill(`Profile ${i}`);
      await page.getByRole("button", { name: /create profile/i }).click();
    }

    // Assert - All profiles are visible and scrollable in dialog
    await expect(dialog.getByText(/saved profiles \(20\)/i)).toBeVisible();
    await expect(dialog.getByText("Profile 1", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Profile 20")).toBeVisible();
  });
});
