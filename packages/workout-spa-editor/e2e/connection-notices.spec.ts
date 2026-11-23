/**
 * One notice, one fix, at the App's two Garmin surfaces (its Connections card
 * and the editor's send), driven through the Garmin extension stub at the
 * message contract. An outdated extension is offered Update, never a sign-in
 * (#1098); a read Garmin failed is "not answering" with Try again, never
 * "signed out" (#1100); a working Connection shows no notice at all.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  type GarminStubOptions,
  installGarminBridgeStub,
} from "./helpers/garmin-bridge-stub";
import { seedEnabledGarminExportPolicy } from "./helpers/garmin-ready-gate";
import {
  clearDexie,
  E2E_DEFAULT_PROFILE_ID,
  getWeekDates,
  makeWorkout,
  seedDefaultProfile,
  seedWorkouts,
} from "./helpers/seed-dexie";

const UPDATE =
  "You cannot use Garmin in Kaiord until Kaiord for Garmin is updated.";
const NOT_ANSWERING =
  "Garmin is not answering, so you cannot use it in Kaiord right now.";
const NOTICE_TIMEOUT_MS = 20_000;

const openConnections = async (page: Page, options: GarminStubOptions) => {
  await installGarminBridgeStub(page, options);
  await page.goto("/connections");
  await clearDexie(page);
  await seedDefaultProfile(page);
  await page.goto("/connections");
};

const openReadyWorkout = async (page: Page, options: GarminStubOptions) => {
  await installGarminBridgeStub(page, options);
  await page.goto("/calendar");
  await clearDexie(page);
  await seedDefaultProfile(page);
  await seedEnabledGarminExportPolicy(page, E2E_DEFAULT_PROFILE_ID);
  const id = crypto.randomUUID();
  await seedWorkouts(page, [
    makeWorkout({ id, date: getWeekDates()[0], state: "ready" }),
  ]);
  await page.goto(`/workout/${id}`);
};

const garminNotice = (page: Page) =>
  page.getByTestId("connection-notice-garmin");

test.describe("Connection notices", () => {
  test("should offer Update, not a sign-in, on the card of an outdated extension", async ({
    page,
  }) => {
    // Arrange
    const outdated = { protocolVersion: 2 };

    // Act
    await openConnections(page, outdated);

    // Assert
    await expect(garminNotice(page)).toContainText(UPDATE, {
      timeout: NOTICE_TIMEOUT_MS,
    });
    await expect(
      garminNotice(page).getByRole("link", { name: "Update Kaiord for Garmin" })
    ).toBeVisible();
    await expect(page.getByTestId("connection-card-garmin")).not.toContainText(
      /sign in|signed out/i
    );
  });

  test("should say Garmin is not answering, never signed out, when its read failed", async ({
    page,
  }) => {
    // Arrange
    const failedRead = { gcApi: { ok: false, status: 503 } };

    // Act
    await openConnections(page, failedRead);

    // Assert
    await expect(garminNotice(page)).toContainText(NOT_ANSWERING, {
      timeout: NOTICE_TIMEOUT_MS,
    });
    await expect(
      garminNotice(page).getByRole("button", { name: "Try again" })
    ).toBeVisible();
    await expect(page.getByTestId("connection-card-garmin")).not.toContainText(
      /signed out|sign in/i
    );
  });

  test("should show no notice for a Connection that works", async ({
    page,
  }) => {
    // Arrange
    const working = {};

    // Act
    await openConnections(page, working);

    // Assert
    await expect(page.getByTestId("connection-card-garmin")).toHaveAttribute(
      "data-status",
      "connected",
      { timeout: NOTICE_TIMEOUT_MS }
    );
    await expect(garminNotice(page)).toHaveCount(0);
  });

  test("should keep the send closed with the Update notice for an outdated extension", async ({
    page,
  }) => {
    // Arrange
    const outdated = { protocolVersion: 2 };

    // Act
    await openReadyWorkout(page, outdated);

    // Assert
    const ribbon = page.getByTestId("editor-state-ribbon");
    await expect(ribbon).toContainText(UPDATE, { timeout: NOTICE_TIMEOUT_MS });
    await expect(
      ribbon.getByRole("button", { name: "Update Kaiord for Garmin" })
    ).toBeVisible();
    await expect(page.getByTestId("send-to-garmin-button")).toHaveCount(0);
  });

  test("should keep the send closed with the Install notice when no extension is present", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/calendar");
    await clearDexie(page);
    await seedDefaultProfile(page);
    await seedEnabledGarminExportPolicy(page, E2E_DEFAULT_PROFILE_ID);
    const id = crypto.randomUUID();
    await seedWorkouts(page, [
      makeWorkout({ id, date: getWeekDates()[0], state: "ready" }),
    ]);

    // Act
    await page.goto(`/workout/${id}`);

    // Assert
    const ribbon = page.getByTestId("editor-state-ribbon");
    await expect(ribbon).toContainText(
      "You cannot use Garmin in Kaiord until Kaiord for Garmin is installed in this browser.",
      { timeout: NOTICE_TIMEOUT_MS }
    );
    await expect(
      ribbon.getByRole("button", { name: "Install Kaiord for Garmin" })
    ).toBeVisible();
    await expect(page.getByTestId("send-to-garmin-button")).toHaveCount(0);
  });
});
