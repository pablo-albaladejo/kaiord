/**
 * E2E specs for the coaching-activity-dialog-redesign change.
 *
 * Covers the dialog flows that do NOT require LLM stubbing:
 *
 *   (d) Edit manually → editor renders template KRD + coaching sidebar;
 *       a `session_match` row is written alongside the workout (D1, D4).
 *   (e) Auto-heal → a converted-but-not-matched workout (legacy state)
 *       is silently linked when the dialog opens (D8 belt-and-braces).
 *   (h) Empty description → dialog renders the AI hint (D6).
 *
 * The AI-bound flows (a, b, c, f, g) require Playwright route mocking
 * for the LLM transport and are tracked as follow-up issues filed at
 * archive time.
 */

import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { clearDexie, getWeekDates, getWeekId } from "./helpers/seed-dexie";
import { disableOnboardingTutorial } from "./test-setup";

const PROFILE_ID = "coaching-redesign-profile";
const SOURCE = "train2go";

type SeedActivityArgs = {
  profileId: string;
  source: string;
  sourceId: string;
  date: string;
  ts: string;
  title: string;
  description?: string;
};

type SeedRunArgs = SeedActivityArgs & {
  workoutId: string;
  matchId?: string;
};

type Db = {
  table: (n: string) => {
    put: (r: unknown) => Promise<unknown>;
    bulkPut: (r: unknown[]) => Promise<unknown>;
  };
};

const seedProfileAndDummyWorkout = async (page: Page, ts: string) => {
  await page.evaluate(
    async ({ profileId, ts }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as Db;
      await db.table("profiles").put({
        id: profileId,
        name: "Test profile",
        sportZones: {},
        linkedAccounts: [{ source: "train2go", externalId: "t2g-acct-1" }],
        createdAt: ts,
        updatedAt: ts,
      });
      await db.table("meta").put({ key: "activeProfileId", value: profileId });
      // Out-of-week dummy so FirstVisitState onboarding does not block clicks.
      await db.table("workouts").put({
        id: "dummy-out-of-week",
        date: "2020-01-01",
        state: "raw",
        sport: "cycling",
        source: "manual",
        sourceId: "dummy",
        planId: null,
        raw: { description: "x", duration: { value: 600, unit: "s" } },
        krd: null,
        lastProcessingError: null,
        feedback: null,
        aiMeta: null,
        garminPushId: null,
        tags: [],
        previousState: null,
        createdAt: ts,
        modifiedAt: null,
        updatedAt: ts,
      });
    },
    { profileId: PROFILE_ID, ts }
  );
};

const seedActivity = async (page: Page, args: SeedActivityArgs) => {
  await page.evaluate(async (a) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as Db;
    await db.table("coachingActivities").put({
      id: `${a.profileId}:${a.source}:${a.sourceId}`,
      profileId: a.profileId,
      source: a.source,
      sourceId: a.sourceId,
      date: a.date,
      sport: "cycling",
      title: a.title,
      status: "pending",
      description: a.description,
      duration: "60 min",
      fetchedAt: a.ts,
    });
  }, args);
};

const seedConvertedWorkout = async (page: Page, args: SeedRunArgs) => {
  await page.evaluate(async (a) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as Db;
    await db.table("workouts").put({
      id: a.workoutId,
      profileId: a.profileId,
      date: a.date,
      state: "raw",
      sport: "cycling",
      source: a.source,
      sourceId: `${a.profileId}::${a.sourceId}`,
      planId: null,
      raw: {
        description: a.description ?? "",
        duration: { value: 3600, unit: "s" },
      },
      krd: null,
      lastProcessingError: null,
      feedback: null,
      aiMeta: null,
      garminPushId: null,
      tags: [],
      previousState: null,
      createdAt: a.ts,
      modifiedAt: null,
      updatedAt: a.ts,
    });
  }, args);
};

test.describe("Coaching activity dialog redesign", () => {
  test.beforeEach(async ({ page }) => {
    await disableOnboardingTutorial(page);
  });

  test("flow (d): Edit manually creates a structured workout + match and navigates to editor", async ({
    page,
  }) => {
    // Arrange — boot SPA, clear Dexie, seed profile + activity
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
    const day = getWeekDates(0)[2];
    const ts = new Date(day + "T08:00:00Z").toISOString();
    await seedProfileAndDummyWorkout(page, ts);
    await seedActivity(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "manual-flow",
      date: day,
      ts,
      title: "Manual flow activity",
      description: "Coach prescription text",
    });

    // Act — open dialog, click Edit manually
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`coaching-card-${SOURCE}:manual-flow`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();
    await page.getByTestId("coaching-dialog-edit-manually").click();

    // Assert — navigated to editor, sidebar visible, session_match exists
    await expect(page).toHaveURL(/\/workout\//, { timeout: 10_000 });
    await expect(page.getByTestId("coaching-sidebar")).toBeVisible();
    const matchCount = await page.evaluate(async (profileId) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as {
        table: (n: string) => { count: () => Promise<number> };
      };
      // dexie returns count after applying filters; here we just check non-zero
      const all = await (
        db.table("sessionMatches") as unknown as {
          toArray: () => Promise<{ profileId: string }[]>;
        }
      ).toArray();
      return all.filter((m) => m.profileId === profileId).length;
    }, PROFILE_ID);
    expect(matchCount).toBeGreaterThan(0);
  });

  test("flow (e): converted-without-match → dialog auto-heals to matched state", async ({
    page,
  }) => {
    // Arrange — seed an activity AND a workout (sourceId matched) but NO session_match
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
    const day = getWeekDates(0)[2];
    const ts = new Date(day + "T08:00:00Z").toISOString();
    await seedProfileAndDummyWorkout(page, ts);
    await seedActivity(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "heal-flow",
      date: day,
      ts,
      title: "Heal flow activity",
      description: "Pre-existing converted workout, no match yet",
    });
    await seedConvertedWorkout(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "heal-flow",
      date: day,
      ts,
      title: "Heal flow activity",
      description: "Pre-existing converted workout, no match yet",
      workoutId: "heal-flow-workout",
    });

    // Act — open dialog
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`coaching-card-${SOURCE}:heal-flow`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();

    // Assert — eventually the dialog flips into matched-state UI (LinkedWorkoutSection visible)
    await expect(page.getByTestId("linked-workout-section")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("flow (h): empty-description activity shows the AI hint", async ({
    page,
  }) => {
    // Arrange — seed activity with empty description
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
    const day = getWeekDates(0)[2];
    const ts = new Date(day + "T08:00:00Z").toISOString();
    await seedProfileAndDummyWorkout(page, ts);
    await seedActivity(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "empty-desc",
      date: day,
      ts,
      title: "Empty description activity",
      description: "",
    });

    // Act — open dialog
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`coaching-card-${SOURCE}:empty-desc`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();

    // Assert — AI hint visible
    await expect(page.getByTestId("coaching-dialog-ai-hint")).toBeVisible();
  });
});
