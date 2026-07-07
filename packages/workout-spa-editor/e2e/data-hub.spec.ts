/**
 * Data Hub matrix (F4.1) — Settings → Data Hub.
 *
 * Verifies the honest cell states end-to-end:
 *   - an online Train2Go bridge OFFERS planned-session import (it announces
 *     read:training-plan) but NEVER activity (read:activities is not
 *     announced ⇒ the cell is n/a and absent);
 *   - an enabled import policy does NOT make a cell active while the bridge is
 *     offline — the live connection governs, never the policy alone;
 *   - clicking an available cell turns the flow on.
 *
 * Playwright Chromium runs without extension runtimes, so the Train2Go bridge
 * is injected via addInitScript before page.goto (see helpers/).
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  installTrain2GoBridgeStub,
  TRAIN2GO_BRIDGE_ID,
} from "./helpers/train2go-bridge-stub";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000d4";
const DATA_HUB_PATH = "/settings/data-hub";
const PLANNED_TRAIN2GO_IMPORT = "data-hub-cell-planned-session-train2go-import";

type DexieDb = {
  table: (n: string) => { put: (r: unknown) => Promise<void> };
};

const waitForDb = (page: Page): Promise<unknown> =>
  page.waitForFunction(
    () => Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
    { timeout: 10_000 }
  );

const seedProfile = async (page: Page): Promise<void> => {
  await page.evaluate(async (pid) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as DexieDb;
    if (!db) throw new Error("__KAIORD_DB__ not available");
    const now = new Date().toISOString();
    await db.table("profiles").put({
      id: pid,
      name: "Data Hub E2E",
      linkedAccounts: [],
      sportZones: {},
      createdAt: now,
      updatedAt: now,
    });
    await db.table("meta").put({ key: "activeProfileId", value: pid });
    await db
      .table("userPreferences")
      .put({ profileId: pid, calendarView: "grid", updatedAt: now });
  }, PROFILE_ID);
};

const seedImportPolicy = async (
  page: Page,
  bridgeId: string,
  dataType: string
): Promise<void> => {
  await page.evaluate(
    async ({ pid, bid, dt }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as DexieDb;
      const now = new Date().toISOString();
      await db.table("integrationPolicies").put({
        id: `pol-${bid}-${dt}-import`,
        profileId: pid,
        dataType: dt,
        bridgeId: bid,
        direction: "import",
        mode: "auto",
        enabled: true,
        updatedAt: now,
      });
    },
    { pid: PROFILE_ID, bid: bridgeId, dt: dataType }
  );
};

test.describe("Data Hub matrix", () => {
  test("should render the matrix with data-type rows and integration columns", async ({
    page,
  }) => {
    // Arrange
    await page.goto(DATA_HUB_PATH);
    await waitForDb(page);
    await seedProfile(page);

    // Act — the live query renders the matrix once an active profile exists.

    // Assert
    await expect(page.getByTestId("data-hub-matrix")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByTestId("data-hub-row-workout")).toBeVisible();
    await expect(
      page.getByTestId("data-hub-row-planned-session")
    ).toBeVisible();
    await expect(page.getByTestId("data-hub-col-train2go")).toBeVisible();
  });

  test("should offer planned-session import from an online Train2Go bridge but never activity", async ({
    page,
  }) => {
    // Arrange
    await installTrain2GoBridgeStub(page);
    await page.goto(DATA_HUB_PATH);
    await waitForDb(page);
    await seedProfile(page);

    // Act — Train2Go announces read:training-plan, not read:activities.

    // Assert — planned-session import is available; activity import is absent.
    await expect(page.getByTestId(PLANNED_TRAIN2GO_IMPORT)).toHaveAttribute(
      "data-state",
      "available",
      { timeout: 10_000 }
    );
    await expect(
      page.getByTestId("data-hub-cell-activity-train2go-import")
    ).toHaveCount(0);
  });

  test("should keep planned-session import blocked while Train2Go is offline despite an enabled policy", async ({
    page,
  }) => {
    // Arrange — no bridge stub ⇒ Train2Go offline; seed an ENABLED policy.
    await page.goto(DATA_HUB_PATH);
    await waitForDb(page);
    await seedProfile(page);
    await seedImportPolicy(page, TRAIN2GO_BRIDGE_ID, "planned-session");

    // Act — the enabled policy is live, but the extension never announced.

    // Assert — connection governs: enabled policy is not active while offline.
    await expect(page.getByTestId(PLANNED_TRAIN2GO_IMPORT)).toHaveAttribute(
      "data-state",
      "not-connected",
      { timeout: 10_000 }
    );
  });

  test("should turn an available flow on when its cell is clicked", async ({
    page,
  }) => {
    // Arrange
    await installTrain2GoBridgeStub(page);
    await page.goto(DATA_HUB_PATH);
    await waitForDb(page);
    await seedProfile(page);
    const cell = page.getByTestId(PLANNED_TRAIN2GO_IMPORT);
    await expect(cell).toHaveAttribute("data-state", "available", {
      timeout: 10_000,
    });

    // Act
    await cell.click();

    // Assert — the newly-enabled route resolves to active via the live query.
    await expect(cell).toHaveAttribute("data-state", "active", {
      timeout: 8_000,
    });
  });

  test("should navigate to the Data Hub from the settings landing", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/settings");
    await waitForDb(page);
    await seedProfile(page);
    await page.goto("/settings");

    // Act
    await page.getByTestId("settings-row-Data Hub").click();

    // Assert
    await expect(page).toHaveURL(/\/settings\/data-hub$/, { timeout: 8_000 });
    await expect(page.getByTestId("data-hub-matrix")).toBeVisible({
      timeout: 10_000,
    });
  });
});
