/**
 * Coach-session reschedule with Garmin (design §Test plan PR-4, flow 5,
 * AC-19, AC-20): a workout sent to the Garmin calendar stub on Tue, moved to
 * Thu, shows "Garmin still on Tue" until Update Garmin schedules Thu and
 * then deletes the Tue entry. The stub's ids are numeric, like Garmin's.
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { DAY, NOW } from "./helpers/coach-session-flow";
import { readGarminStubState } from "./helpers/garmin-bridge-stub";
import {
  openDetailWhenReady,
  seedGarminReadyWorkouts,
} from "./helpers/garmin-calendar-seed";
import { makeWorkout } from "./helpers/seed-dexie";

const PLACEMENT_TIMEOUT_MS = 20_000;

/** The calendar calls the stub received, with the day or entry they name. */
const calendarCalls = async (page: Page) =>
  ((await readGarminStubState(page))?.log ?? [])
    .filter((c) => c.action === "schedule" || c.action === "unschedule")
    .map((c) => [c.action, c.payload.date ?? c.payload.scheduleId]);

/** The workout's Garmin placement, as the export ledger records it. */
const ledgerPlacement = (page: Page) =>
  page.evaluate(async () => {
    type Row = { dataType: string; placement?: Record<string, unknown> };
    const db = (window as unknown as Record<string, unknown>).__KAIORD_DB__ as {
      table: (n: string) => { toArray: () => Promise<Row[]> };
    };
    const rows = await db.table("exportLedger").toArray();
    const placement = rows.find((r) => r.dataType === "workout")?.placement;
    return placement && { kind: placement.kind, date: placement.date };
  });

test.describe("Coach session reschedule with Garmin", () => {
  test("should move the Garmin entry to the new day on Update Garmin", async ({
    page,
  }) => {
    // Arrange
    await page.clock.setFixedTime(new Date(NOW));
    const workoutId = crypto.randomUUID();
    await seedGarminReadyWorkouts(page, [
      makeWorkout({ id: workoutId, date: DAY.TUE, state: "ready" }),
    ]);
    await openDetailWhenReady(page, workoutId);
    await page.getByRole("button", { name: "Send to Garmin" }).click();
    await expect(
      page.getByRole("button", { name: "On your Garmin" })
    ).toBeVisible({ timeout: PLACEMENT_TIMEOUT_MS });
    const [tuesday] = (await readGarminStubState(page))?.entries ?? [];
    expect(tuesday?.date).toBe(DAY.TUE);
    await page.getByTestId("workout-detail-menu").click();
    await page.getByRole("menuitem", { name: "Move to another day" }).click();
    await page.getByTestId("schedule-date-input").fill(DAY.THU);
    await page.getByRole("button", { name: "Move", exact: true }).click();
    const notice = page.getByTestId("garmin-drift-notice");
    await expect(notice).toContainText("Garmin still on Tue, Oct 6");

    // Act
    await notice.getByRole("button", { name: "Update Garmin" }).click();

    // Assert
    await expect(notice).toHaveCount(0, { timeout: PLACEMENT_TIMEOUT_MS });
    await expect
      .poll(() => calendarCalls(page), { timeout: PLACEMENT_TIMEOUT_MS })
      .toEqual([
        ["schedule", DAY.TUE],
        ["schedule", DAY.THU],
        ["unschedule", String(tuesday?.id)],
      ]);
    expect((await readGarminStubState(page))?.entries).toEqual([
      expect.objectContaining({ date: DAY.THU }),
    ]);
    await expect
      .poll(() => ledgerPlacement(page))
      .toEqual({ kind: "scheduled", date: DAY.THU });
  });
});
