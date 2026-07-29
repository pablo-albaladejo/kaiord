/**
 * Connections page CONTENT — `/settings/connections` with a real profile and a
 * discoverable bridge.
 *
 * The shell tests in `settings.spec.ts` assert the route and the panel
 * wrapper, both of which render for a profile-less visitor too; this file is
 * the one that fails when the page's own wiring breaks. It replaces the
 * content coverage the retired `data-hub.spec.ts` carried.
 *
 * `planned-session` is the row under test on purpose: it is the one managed
 * type with NO manual-entry path, so with nothing linked it genuinely has no
 * source, and Train2Go is the only bridge that announces `read:training-plan`.
 * That makes it the reachable shape of "an extension installed after the
 * seeding migrations already ran" — the case with no route to create until the
 * row offers one.
 *
 * Playwright Chromium runs without extension runtimes, so the bridge is
 * injected via addInitScript before page.goto (see helpers/).
 */
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import { installTrain2GoBridgeStub } from "./helpers/train2go-bridge-stub";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

/* A real UUID: `upsertIntegrationPolicy` validates the profile id, so the
   route write below is refused outright for the shared `e2e-default-profile`. */
const PROFILE_ID = "00000000-0000-4000-8000-0000000000c7";
const CONNECTIONS_ROUTE = "/settings/connections";

type DexieDb = {
  table: (n: string) => { put: (r: unknown) => Promise<void> };
};

const seedProfile = async (page: Page): Promise<void> => {
  await page.evaluate(async (pid) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as DexieDb;
    if (!db) throw new Error("__KAIORD_DB__ not available");
    const now = new Date().toISOString();
    await db.table("profiles").put({
      id: pid,
      name: "Connections E2E",
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

const openWithBridge = async (page: Page): Promise<void> => {
  await installTrain2GoBridgeStub(page);
  await page.goto(CONNECTIONS_ROUTE);
  await waitForDexieReady(page);
  await seedProfile(page);
  // Re-enter with the profile committed so the live queries run against it.
  await page.goto(CONNECTIONS_ROUTE);
  await expect(page.getByTestId("connections-tab")).toBeVisible({
    timeout: 15_000,
  });
};

test.describe("Connections page content", () => {
  test("should render the registry as cards and every managed type as a routing row", async ({
    page,
  }) => {
    // Arrange
    await openWithBridge(page);

    // Act
    const card = page.getByTestId("connection-card-train2go");
    const routing = page.getByTestId("data-type-routing");

    // Assert — the discovered bridge has a card, and the routing section
    // reports the type it feeds as having no source until a route is created.
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card).toContainText("Train2Go");
    await expect(routing).toBeVisible();
    await expect(
      page.getByTestId("routing-row-planned-session")
    ).toHaveAttribute("data-origin", "none");
    await expect(page.getByTestId("routing-from-planned-session")).toHaveText(
      "No source"
    );
  });

  test("should switch a data type's import route on and back off from its row", async ({
    page,
  }) => {
    // Arrange
    // Nothing seeds a policy for a bridge installed after the seeding
    // migrations ran, so this control is the only non-assistant way in.
    await openWithBridge(page);
    const row = page.getByTestId("routing-row-planned-session");
    const pill = page.getByTestId("routing-from-planned-session");
    await page.getByTestId("routing-change-planned-session").click();
    const toggle = page.getByTestId("routing-route-planned-session-train2go");
    await expect(toggle).toHaveAttribute("aria-pressed", "false", {
      timeout: 15_000,
    });

    // Act
    await toggle.click();

    // Assert — the live query re-reads the committed policy: the row now names
    // the source it is read from.
    await expect(pill).toHaveText("Train2Go", { timeout: 10_000 });
    await expect(row).toHaveAttribute("data-origin", "only");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    // Act — the same control must be the way back, not a one-way door.
    await toggle.click();

    // Assert
    await expect(pill).toHaveText("No source", { timeout: 10_000 });
    await expect(row).toHaveAttribute("data-origin", "none");
  });

  test("should offer no route on a type the discovered bridge cannot serve", async ({
    page,
  }) => {
    // Arrange
    // Train2Go announces `read:training-plan` and `read:training-zones` only.
    // Sleep is served by no discovered bridge and has a manual path, so it is
    // a single-source row with nothing to switch and nothing to rank.
    await openWithBridge(page);

    // Act
    const sleepRow = page.getByTestId("routing-row-sleep");

    // Assert
    await expect(sleepRow).toBeVisible();
    await expect(page.getByTestId("routing-change-sleep")).toHaveCount(0);
    await expect(
      page.getByTestId("routing-change-training-zones")
    ).toBeVisible();
  });
});
