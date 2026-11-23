/**
 * Connections page with NO extension — the Playwright default, since browsers
 * run without extension runtimes. Every extension card shows its own Install
 * notice, worded by the one source of Connection notices and naming its
 * Platform; nothing says "the Kaiord extension".
 */
import { expect, test } from "./fixtures/base";
import { seedDefaultProfile } from "./helpers/seed-profile";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const ROUTE = "/connections";
const BRIDGE_CARDS = [
  ["garmin", "Garmin"],
  ["train2go", "Train2Go"],
  ["whoop", "WHOOP"],
  ["tanita", "Tanita"],
  ["trainingpeaks", "TrainingPeaks"],
] as const;

test.describe("Connections without the extensions", () => {
  test("should show one Install notice with its one fix on every extension card", async ({
    page,
  }) => {
    // Arrange
    await page.goto(ROUTE);
    await waitForDexieReady(page);
    await seedDefaultProfile(page);

    // Act
    await page.goto(ROUTE);

    // Assert — the notice waits for the discovery window, then appears once.
    for (const [id, platform] of BRIDGE_CARDS) {
      const notice = page.getByTestId(`connection-notice-${id}`);
      await expect(notice).toHaveText(
        `You cannot use ${platform} in Kaiord until Kaiord for ${platform} is installed in this browser.Install Kaiord for ${platform}`,
        { timeout: 20_000 }
      );
      await expect(notice.getByRole("link")).toHaveCount(1);
    }
    await expect(page.getByText(/the kaiord extension/i)).toHaveCount(0);
    await expect(page.getByText(/signed out/i)).toHaveCount(0);
  });
});
