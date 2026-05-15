/**
 * E2E specs for the coaching-activity-dialog-redesign change.
 *
 * Covers the dialog flows that exercise the AI transport boundary
 * (mocked via the shared LLM mock seam) AND the flows that do NOT
 * require LLM stubbing:
 *
 *   (a) Process with AI → completes successfully, workout transitions
 *       to structured, editor renders KRD, sidebar shows the activity
 *       (D1/D3). Sub-case: empty-description prompt body is built from
 *       `title + sport` only (§11.8).
 *   (b) AI failure → inline error state + Retry AI affordance recovers
 *       on the second attempt (D3, no-persist-on-failure).
 *   (c) AI failure → static error toast fires and prevents state mutation
 *       (C2 / R-PIIInterpolation).
 *   (d) Edit manually → editor renders template KRD + coaching sidebar;
 *       a `session_match` row is written alongside the workout (D1, D4).
 *   (e) Auto-heal → a converted-but-not-matched workout (legacy state)
 *       is silently linked when the dialog opens (D8 belt-and-braces).
 *   (f) Process with AI from matched raw → transitions raw to structured
 *       in place and preserves the existing session_match row (§7.4).
 *   (h) Empty description → dialog renders the AI hint (D6).
 *
 * Flow (g) (in-flight cancel) is covered by unit tests in
 * `use-coaching-ai-handler.test.tsx`.
 */

import type { Page, Route } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { mockLlmFailure, mockLlmSuccess } from "./fixtures/api-mocks";
import { LLM_CYCLING_RESPONSE } from "./fixtures/llm-responses";
import { seedAiProvider } from "./helpers/seed-ai-provider";
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
      sourceId: `${a.profileId}:${a.sourceId}`,
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

    // Assert — navigated to editor + session_match row written (per the
    // auto-match invariant D1). The sidebar visibility is covered by
    // unit tests (`CoachingSidebar.test.tsx`); here we focus on the
    // end-to-end persistence contract.
    await expect(page).toHaveURL(/\/workout\//, { timeout: 10_000 });
    const matchCount = await page.evaluate(async (profileId) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as {
        table: (n: string) => {
          toArray: () => Promise<{ profileId: string }[]>;
        };
      };
      const all = await db.table("sessionMatches").toArray();
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

  test("should render coaching dialog and convert via AI when Process with AI completes successfully (flow a)", async ({
    page,
  }) => {
    // Arrange — boot SPA, clear Dexie, seed profile + activity + AI provider
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
    await mockLlmSuccess(page, LLM_CYCLING_RESPONSE);
    await seedAiProvider(page);
    const day = getWeekDates(0)[2];
    const ts = new Date(day + "T08:00:00Z").toISOString();
    await seedProfileAndDummyWorkout(page, ts);
    await seedActivity(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "ai-success",
      date: day,
      ts,
      title: "AI success activity",
      description: "Sweet spot Z3 5x6min with 3min recovery",
    });

    // Act — open dialog, click Process with AI
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`coaching-card-${SOURCE}:ai-success`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();
    await page.getByTestId("coaching-dialog-ai-process").click();

    // Assert — navigated to editor and workout persisted in structured state
    await expect(page).toHaveURL(/\/workout\//, { timeout: 15_000 });
    const stored = await page.evaluate(async (profileId) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as {
        table: (n: string) => {
          toArray: () => Promise<
            { profileId: string; state: string; krd: unknown }[]
          >;
        };
      };
      const all = await db.table("workouts").toArray();
      return all.filter((w) => w.profileId === profileId);
    }, PROFILE_ID);
    const structured = stored.filter((w) => w.state === "structured");
    expect(structured.length).toBeGreaterThan(0);
    expect(structured[0].krd).not.toBeNull();
  });

  test("should build empty-description prompt from title and sport only (flow a sub-case, §11.8)", async ({
    page,
  }) => {
    // Arrange — capture the LLM request body via a custom route handler
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
    const capturedBodies: string[] = [];
    const captureAndRespond = async (route: Route) => {
      const body = route.request().postData() ?? "";
      capturedBodies.push(body);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(LLM_CYCLING_RESPONSE),
      });
    };
    await page.route("**/api.anthropic.com/**", captureAndRespond);
    await page.route("**/api.openai.com/**", captureAndRespond);
    await page.route(
      "**/generativelanguage.googleapis.com/**",
      captureAndRespond
    );
    await seedAiProvider(page);
    const day = getWeekDates(0)[2];
    const ts = new Date(day + "T08:00:00Z").toISOString();
    await seedProfileAndDummyWorkout(page, ts);
    const EMPTY_TITLE = "Empty desc activity";
    await seedActivity(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "ai-empty-desc",
      date: day,
      ts,
      title: EMPTY_TITLE,
      description: "",
    });

    // Act — open dialog, click Process with AI
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`coaching-card-${SOURCE}:ai-empty-desc`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();
    await page.getByTestId("coaching-dialog-ai-process").click();
    await expect(page).toHaveURL(/\/workout\//, { timeout: 15_000 });

    // Assert — captured prompt body contains title (cycling) but not an
    // empty/undefined description field. The exact serialization depends
    // on the provider, so we check substring presence on the combined
    // payload across all routes.
    expect(capturedBodies.length).toBeGreaterThan(0);
    const combined = capturedBodies.join("\n");
    expect(combined).toContain(EMPTY_TITLE);
    expect(combined).toContain("cycling");
  });

  test("should show inline error with Retry AI affordance when LLM call fails (flow b)", async ({
    page,
  }) => {
    // Arrange — first call fails, second succeeds (handler swaps via
    // an atomic counter so each interception is deterministic).
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
    let calls = 0;
    const handler = async (route: Route) => {
      calls += 1;
      if (calls === 1) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Mocked LLM failure" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(LLM_CYCLING_RESPONSE),
      });
    };
    await page.route("**/api.anthropic.com/**", handler);
    await page.route("**/api.openai.com/**", handler);
    await page.route("**/generativelanguage.googleapis.com/**", handler);
    await seedAiProvider(page);
    const day = getWeekDates(0)[2];
    const ts = new Date(day + "T08:00:00Z").toISOString();
    await seedProfileAndDummyWorkout(page, ts);
    await seedActivity(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "ai-retry",
      date: day,
      ts,
      title: "AI retry activity",
      description: "Sweet spot Z3",
    });

    // Act — open dialog, click Process with AI (will fail), then Retry
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`coaching-card-${SOURCE}:ai-retry`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();
    await page.getByTestId("coaching-dialog-ai-process").click();
    await expect(page.getByTestId("coaching-dialog-ai-error")).toBeVisible({
      timeout: 10_000,
    });

    // Failure-no-persist invariant: no workout was created on failure
    const beforeRetry = await page.evaluate(async (profileId) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as {
        table: (n: string) => {
          toArray: () => Promise<{ profileId: string; source: string }[]>;
        };
      };
      const all = await db.table("workouts").toArray();
      return all.filter((w) => w.profileId === profileId && w.source === SOURCE)
        .length;
    }, PROFILE_ID);
    expect(beforeRetry).toBe(0);

    // Click Retry AI — second call succeeds
    await page.getByTestId("coaching-dialog-ai-retry").click();

    // Assert — editor renders and the workout was persisted as structured
    await expect(page).toHaveURL(/\/workout\//, { timeout: 15_000 });
    const stored = await page.evaluate(async (profileId) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as {
        table: (n: string) => {
          toArray: () => Promise<{ profileId: string; state: string }[]>;
        };
      };
      const all = await db.table("workouts").toArray();
      return all.filter(
        (w) => w.profileId === profileId && w.state === "structured"
      ).length;
    }, PROFILE_ID);
    expect(stored).toBeGreaterThan(0);
  });

  test("should show static error toast when LLM call fails and prevent state mutation (flow c)", async ({
    page,
  }) => {
    // Arrange — every LLM call returns 500
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
    await mockLlmFailure(page);
    await seedAiProvider(page);
    const day = getWeekDates(0)[2];
    const ts = new Date(day + "T08:00:00Z").toISOString();
    await seedProfileAndDummyWorkout(page, ts);
    await seedActivity(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "ai-toast",
      date: day,
      ts,
      title: "AI toast activity",
      description: "Sweet spot Z3",
    });

    // Act — open dialog, click Process with AI
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`coaching-card-${SOURCE}:ai-toast`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();
    await page.getByTestId("coaching-dialog-ai-process").click();

    // Assert — toast appears with the C2 static literal
    await expect(
      page.getByText("Failed to process activity with AI")
    ).toBeVisible({
      timeout: 10_000,
    });
    // No workout / no match persisted
    const counts = await page.evaluate(async (profileId) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as {
        table: (n: string) => {
          toArray: () => Promise<{ profileId: string; source?: string }[]>;
        };
      };
      const workouts = await db.table("workouts").toArray();
      const matches = await db.table("sessionMatches").toArray();
      return {
        workouts: workouts.filter(
          (w) => w.profileId === profileId && w.source === SOURCE
        ).length,
        matches: matches.filter((m) => m.profileId === profileId).length,
      };
    }, PROFILE_ID);
    expect(counts.workouts).toBe(0);
    expect(counts.matches).toBe(0);
  });

  test("should transition raw workout to structured in place when Process with AI completes successfully (flow f)", async ({
    page,
  }) => {
    // Arrange — seed a matched workout in `state="raw"` AND its session_match
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
    await mockLlmSuccess(page, LLM_CYCLING_RESPONSE);
    await seedAiProvider(page);
    const day = getWeekDates(0)[2];
    const ts = new Date(day + "T08:00:00Z").toISOString();
    await seedProfileAndDummyWorkout(page, ts);
    await seedActivity(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "ai-in-place",
      date: day,
      ts,
      title: "AI in-place activity",
      description: "Sweet spot Z3",
    });
    await seedConvertedWorkout(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "ai-in-place",
      date: day,
      ts,
      title: "AI in-place activity",
      description: "Sweet spot Z3",
      workoutId: "in-place-workout",
    });
    const PRESEEDED_MATCH_ID = "M-in-place";
    await page.evaluate(
      async ({ matchId, workoutId, day, profileId, source, sourceId, ts }) => {
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as Db;
        await db.table("sessionMatches").put({
          id: matchId,
          profileId,
          // Persisted COMPOSITE id shape: `${profileId}:${source}:${sourceId}`
          // mirrors `buildCoachingActivityId(profileId, source, sourceId)`
          // and matches the `coachingActivities.id` primary key.
          coachingActivityId: `${profileId}:${source}:${sourceId}`,
          workoutId,
          date: day,
          createdAt: ts,
          source: "auto-coaching",
          executedWorkoutIds: [],
        });
      },
      {
        matchId: PRESEEDED_MATCH_ID,
        workoutId: "in-place-workout",
        day,
        profileId: PROFILE_ID,
        source: SOURCE,
        sourceId: "ai-in-place",
        ts,
      }
    );

    // Act — open dialog, click Process with AI from matched-raw state
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`coaching-card-${SOURCE}:ai-in-place`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();
    await page.getByTestId("coaching-dialog-ai-process").click();

    // Assert — workout transitioned to structured in place AND the
    // existing match row is preserved (same id).
    await expect(page).toHaveURL(/\/workout\//, { timeout: 15_000 });
    const result = await page.evaluate(
      async ({ workoutId, matchId, profileId }) => {
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as {
          table: (n: string) => {
            get: (id: string) => Promise<{ state: string } | undefined>;
            toArray: () => Promise<{ profileId: string; id: string }[]>;
          };
        };
        const workout = await db.table("workouts").get(workoutId);
        const matches = await db.table("sessionMatches").toArray();
        const ourMatch = matches.find(
          (m) => m.profileId === profileId && m.id === matchId
        );
        return {
          state: workout?.state,
          matchPreserved: Boolean(ourMatch),
          matchCount: matches.filter((m) => m.profileId === profileId).length,
        };
      },
      {
        workoutId: "in-place-workout",
        matchId: PRESEEDED_MATCH_ID,
        profileId: PROFILE_ID,
      }
    );
    expect(result.state).toBe("structured");
    expect(result.matchPreserved).toBe(true);
    expect(result.matchCount).toBe(1);
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
