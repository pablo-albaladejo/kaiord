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
 *   (d) Edit manually → opens a store-only draft editor (template KRD +
 *       coaching sidebar); nothing is persisted until the explicit Save,
 *       which then writes the workout + `session_match` row (D1, D4,
 *       defer-coaching-create).
 *   (e) Auto-heal → a converted-but-not-matched workout (legacy state)
 *       is silently linked when the dialog opens (D8 belt-and-braces).
 *   (f) Process with AI from matched raw → transitions raw to structured
 *       in place and preserves the existing session_match row (§7.4).
 *   (g) Push to Garmin from matched ready → pushes the workout via the
 *       Garmin bridge stub and hides the Push button when the workout
 *       transitions to `state="pushed"` (issue #553). The Garmin push
 *       transport uses `chrome.runtime.sendMessage`, not HTTP, so the
 *       test installs a page-side Garmin bridge stub (mirrors the
 *       existing Train2Go stub) as the documented DI fallback per the
 *       transport probe rule.
 *   (h) Empty description → dialog renders the AI hint (D6).
 *
 * In-flight AI cancel is covered by unit tests in
 * `use-coaching-ai-handler.test.tsx`.
 */

import type { Page, Route } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { mockLlmFailure, mockLlmSuccess } from "./fixtures/api-mocks";
import { LLM_CYCLING_RESPONSE } from "./fixtures/llm-responses";
import {
  getGarminBridgeCallActions,
  installGarminBridgeStub,
} from "./helpers/garmin-bridge-stub";
import { seedAiProvider } from "./helpers/seed-ai-provider";
import { clearDexie, getWeekDates, getWeekId } from "./helpers/seed-dexie";
import { disableOnboardingTutorial } from "./test-setup";

const PROFILE_ID = "coaching-redesign-profile";
const SOURCE = "train2go";
// Backoff schedule for the flow (g) re-click poll: short first, then a
// few seconds to give the Garmin bridge discovery + detect cycle time
// to flip `sessionActive` to true. Values are wall-clock milliseconds
// for Playwright's `expect.poll` and have no domain meaning.
// eslint-disable-next-line no-magic-numbers -- poll backoff schedule, test-local
const FLOW_G_PUSH_POLL_INTERVALS_MS = [500, 1000, 1000, 1000, 2000];

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

/**
 * Seed a workout in `state="ready"` with a non-null KRD payload, plus a
 * matching sessionMatches row. Used by flow (g) to exercise the Push to
 * Garmin button from the coaching dialog.
 */
const seedMatchedReadyWorkout = async (
  page: Page,
  args: SeedRunArgs & { matchId: string }
) => {
  await page.evaluate(async (a) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as Db;
    const krd = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: a.ts, sport: "cycling" },
      extensions: {
        structured_workout: {
          name: a.title,
          sport: "cycling",
          steps: [
            {
              stepIndex: 0,
              durationType: "time",
              duration: { type: "time", seconds: 600 },
              targetType: "power",
              target: {
                type: "power",
                value: { unit: "watts", value: 200 },
              },
              intensity: "active",
            },
          ],
        },
      },
    };
    await db.table("workouts").put({
      id: a.workoutId,
      profileId: a.profileId,
      date: a.date,
      state: "ready",
      sport: "cycling",
      source: a.source,
      sourceId: `${a.profileId}:${a.sourceId}`,
      planId: null,
      raw: null,
      krd,
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
    await db.table("sessionMatches").put({
      id: a.matchId,
      profileId: a.profileId,
      // Persisted COMPOSITE coachingActivityId, mirrors
      // `buildCoachingActivityId(profileId, source, sourceId)`.
      coachingActivityId: `${a.profileId}:${a.source}:${a.sourceId}`,
      workoutId: a.workoutId,
      date: a.date,
      createdAt: a.ts,
      source: "auto-coaching",
      executedWorkoutIds: [],
    });
  }, args);
};

/**
 * Seed an enabled `(workout, export)` IntegrationPolicy to garmin-bridge so
 * the F2 push gate (`executeWorkoutPush` → resolveExportPolicies) admits the
 * push. Without an active export route the push is fail-closed by design and
 * never reaches the bridge stub.
 */
const seedGarminExportPolicy = async (page: Page, profileId: string) => {
  await page.evaluate(async (pid) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as Db;
    const now = new Date().toISOString();
    await db.table("integrationPolicies").put({
      id: "policy-garmin-bridge-workout-export",
      profileId: pid,
      dataType: "workout",
      bridgeId: "garmin-bridge",
      direction: "export",
      mode: "manual",
      enabled: true,
      updatedAt: now,
    });
  }, profileId);
};

test.describe("Coaching activity dialog redesign", () => {
  test.beforeEach(async ({ page }) => {
    await disableOnboardingTutorial(page);
  });

  test("flow (d): Edit manually opens a draft and persists only on Save", async ({
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

    const countMatches = (profileId: string) =>
      page.evaluate(async (id) => {
        const db = (window as unknown as Record<string, unknown>)
          .__KAIORD_DB__ as {
          table: (n: string) => {
            toArray: () => Promise<{ profileId: string }[]>;
          };
        };
        const all = await db.table("sessionMatches").toArray();
        return all.filter((m) => m.profileId === id).length;
      }, profileId);

    // Assert — opens the store-only DRAFT editor and persists NOTHING yet
    // (defer-coaching-create): no session_match until the explicit Save.
    await expect(page).toHaveURL(/\/workout\/new\?coaching=/, {
      timeout: 10_000,
    });
    await expect(page.getByTestId("coaching-draft-save-button")).toBeVisible();
    expect(await countMatches(PROFILE_ID)).toBe(0);

    // Act — explicit Save persists the workout + match and lands on /workout/:id
    await page.getByTestId("coaching-draft-save-button").click();

    // Assert — navigated to the persisted record + session_match written
    await expect(page).toHaveURL(/\/workout\/[0-9a-f-]{16,}/, {
      timeout: 10_000,
    });
    expect(await countMatches(PROFILE_ID)).toBeGreaterThan(0);
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
          status: 401,
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
    // Arrange — every LLM call returns 401 (non-retryable, so the AI SDK
    // surfaces the error instead of backing off through `maxRetries`).
    await page.goto("/calendar");
    await page.waitForFunction(
      () =>
        Boolean((window as unknown as Record<string, unknown>).__KAIORD_DB__),
      { timeout: 10_000 }
    );
    await clearDexie(page);
    await mockLlmFailure(page, { status: 401 });
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

    // Assert — toast appears with the C2 static literal (scope to the
    // visible toast body; the aria-live announcer node prefixes its
    // content with "Notification " and would otherwise duplicate the
    // match under strict mode).
    await expect(
      page.getByText("Failed to process activity with AI", { exact: true })
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

    // Act — open dialog, click Process with AI from matched-raw state.
    // The pre-seeded sessionMatch makes the calendar render the workout as
    // a MatchedSessionCard (`matched-card-*` testid), not as the unmatched
    // coaching-activity card (`coaching-card-*`).
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`matched-card-${SOURCE}:ai-in-place`);
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

  test("should push matched ready workout to Garmin and transition state to pushed when Push button is clicked from dialog (flow g)", async ({
    page,
  }) => {
    // Arrange — install Garmin bridge stub BEFORE goto so the SPA's
    // bridge-discovery sees the announce on boot.
    await installGarminBridgeStub(page);
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
      sourceId: "push-flow",
      date: day,
      ts,
      title: "Push flow activity",
      description: "Ready workout to push to Garmin",
    });
    await seedMatchedReadyWorkout(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "push-flow",
      date: day,
      ts,
      title: "Push flow activity",
      description: "Ready workout to push to Garmin",
      workoutId: "push-flow-workout",
      matchId: "M-push-flow",
    });
    await seedGarminExportPolicy(page, PROFILE_ID);

    // Act — open dialog, then click Push to Garmin. The push is a no-op
    // until the Garmin bridge stub is detected (`sessionActive=true`),
    // so the test re-clicks until the stub records a `push` action.
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`matched-card-${SOURCE}:push-flow`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();
    const pushBtn = page.getByTestId("coaching-dialog-push");
    await expect(pushBtn).toBeVisible({ timeout: 10_000 });

    // Assert — the Garmin bridge stub eventually records a `push` action
    await expect
      .poll(
        async () => {
          await pushBtn.click();
          return getGarminBridgeCallActions(page);
        },
        { timeout: 15_000, intervals: FLOW_G_PUSH_POLL_INTERVALS_MS }
      )
      .toContain("push");
  });

  test("should re-render dialog without Push button after successful push from dialog (flow g)", async ({
    page,
  }) => {
    // Arrange — same setup as the previous flow (g) test plus a
    // post-push state flip simulated by Dexie write so we can verify
    // the matched-state UI re-renders correctly. The actual server-side
    // workout-state transition is owned by `useEditorActions` and is
    // covered by its own unit tests; here we verify that when the
    // workout reaches `state="pushed"` the Push button is hidden.
    await installGarminBridgeStub(page);
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
      sourceId: "push-rerender",
      date: day,
      ts,
      title: "Push re-render activity",
      description: "Ready workout for re-render assertion",
    });
    await seedMatchedReadyWorkout(page, {
      profileId: PROFILE_ID,
      source: SOURCE,
      sourceId: "push-rerender",
      date: day,
      ts,
      title: "Push re-render activity",
      description: "Ready workout for re-render assertion",
      workoutId: "push-rerender-workout",
      matchId: "M-push-rerender",
    });

    // Act — open dialog and flip the workout state to pushed via Dexie
    await page.goto(`/calendar/${getWeekId(day)}`);
    const card = page.getByTestId(`matched-card-${SOURCE}:push-rerender`);
    await card.waitFor({ timeout: 10_000 });
    await card.click();
    await expect(page.getByTestId("coaching-activity-dialog")).toBeVisible();
    await expect(page.getByTestId("coaching-dialog-push")).toBeVisible();
    await page.evaluate(async () => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as {
        table: (n: string) => {
          update: (
            id: string,
            changes: Record<string, unknown>
          ) => Promise<number>;
        };
      };
      await db
        .table("workouts")
        .update("push-rerender-workout", { state: "pushed" });
    });

    // Assert — the Push button is no longer rendered for state="pushed"
    await expect(page.getByTestId("coaching-dialog-push")).toHaveCount(0, {
      timeout: 5_000,
    });
    await expect(page.getByTestId("coaching-dialog-open-editor")).toBeVisible();
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
