/**
 * The coach-session reschedule specs' steps: syncing the stubbed week,
 * converting the plan by hand, moving it, and reading back where it is.
 */
import type { Locator, Page } from "@playwright/test";

import { expect } from "../fixtures/base";
import { type Db, matchedCard, PLAN_CARD } from "./coach-session-flow";

/** The converted workout's id and day, and its match's day. */
export const readSession = (page: Page) =>
  page.evaluate(async () => {
    const db = (window as unknown as { __KAIORD_DB__: Db }).__KAIORD_DB__;
    const [match] = await db.table("sessionMatches").toArray();
    const workout = match?.workoutId
      ? await db.table("workouts").get(match.workoutId)
      : undefined;
    return { workout: workout?.date, match: match?.date };
  });

export const syncWeek = async (page: Page, weekId: string) => {
  await page.goto(`/calendar/${weekId}`);
  const sync = page.getByRole("button", { name: /^sync train2go$/i });
  await sync.waitFor({ state: "visible", timeout: 15_000 });
  await sync.click();
};

/** When the profile's Train2Go week last synced (the frozen clock's now). */
const lastSyncedAt = (page: Page) =>
  page.evaluate(async () => {
    const db = (window as unknown as { __KAIORD_DB__: Db }).__KAIORD_DB__;
    const [state] = await db.table("coachingSyncState").toArray();
    return (state as { lastSyncedAt?: string } | undefined)?.lastSyncedAt;
  });

/**
 * Sync again at a later frozen instant and wait until a sync has finished
 * at it, so what the sync did (or did not do) can be asserted.
 */
export const resyncWeek = async (page: Page, weekId: string, at: string) => {
  const stamp = new Date(at).toISOString();
  await page.clock.setFixedTime(new Date(stamp));
  await syncWeek(page, weekId);
  await expect.poll(() => lastSyncedAt(page), { timeout: 15_000 }).toBe(stamp);
};

/** Sync the stubbed plan, convert it by hand, and come back to the week. */
export const syncAndConvert = async (
  page: Page,
  weekId: string
): Promise<Locator> => {
  await syncWeek(page, weekId);
  const plan = page.getByTestId(`coaching-card-${PLAN_CARD}`);
  await plan.waitFor({ timeout: 15_000 });
  await plan.click();
  await page.getByTestId("coaching-dialog-edit-manually").click();
  await page.getByTestId("coaching-draft-save-button").click();
  await expect(page).toHaveURL(/\/workout\/[0-9a-f-]{16,}/, {
    timeout: 10_000,
  });
  await page.goto(`/calendar/${weekId}`);
  return matchedCard(page);
};

/** The coaching dialog's Move to another day, onto `day`. */
export const moveThroughDialog = async (
  page: Page,
  card: Locator,
  day: string
) => {
  await card.click();
  await page.getByTestId("coaching-dialog-move").click();
  await page.getByTestId("schedule-date-input").fill(day);
  await page.getByRole("button", { name: "Move", exact: true }).click();
};
