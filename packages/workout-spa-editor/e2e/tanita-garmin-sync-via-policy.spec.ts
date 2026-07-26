/**
 * Governed Tanita → Garmin body-composition sync (kill test).
 *
 * The manual "Sync Tanita → Garmin" card consults
 * resolveExportPolicies(profileId, 'body-composition') BEFORE touching either
 * bridge:
 *   (a) an enabled body-composition→garmin-bridge export route → clicking Sync
 *       reads the Tanita export CSV, encodes it, pushes to garmin-bridge, and
 *       writes an exportLedger row;
 *   (b) no export route → the click is fail-closed: neither the tanita
 *       `read-export-csv` nor the garmin `push-body-composition` action fires and
 *       no ledger row is written (kill test).
 *
 * Bridge discovery + the stubbed reads use the tanita/garmin bridge-stub helpers
 * (chrome.runtime.sendMessage is not interceptable via page.route).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures/base";
import {
  GARMIN_BRIDGE_ID,
  getGarminBridgeCallActions,
  installGarminBridgeStub,
} from "./helpers/garmin-bridge-stub";
import {
  getTanitaBridgeCallActions,
  installTanitaBridgeStub,
} from "./helpers/tanita-bridge-stub";
import { waitForDexieReady } from "./helpers/wait-for-dexie-ready";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_CSV = readFileSync(
  join(HERE, "fixtures", "tanita-export.csv"),
  "utf-8"
);

const PROFILE_ID = "tanita-garmin-policy-e2e";
const EXTENSIONS_ROUTE = "/settings/extensions";
const EXPECTED_LEDGER_ROWS = 2;

type DexieDb = {
  table: (n: string) => {
    put: (r: unknown) => Promise<void>;
    toArray: () => Promise<unknown[]>;
  };
};

const syncButton = (page: Page) =>
  page.getByRole("button", { name: /Sync Tanita/i });

const seedProfile = async (page: Page): Promise<void> => {
  await page.evaluate(async (pid) => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as DexieDb;
    const now = new Date().toISOString();
    await db.table("profiles").put({
      id: pid,
      name: "Tanita Sync Profile",
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

const addBodyCompositionExportPolicy = async (page: Page): Promise<void> => {
  await page.evaluate(
    async ({ pid, bid }) => {
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as DexieDb;
      const now = new Date().toISOString();
      await db.table("integrationPolicies").put({
        id: `policy-${bid}-body-composition-export`,
        profileId: pid,
        dataType: "body-composition",
        bridgeId: bid,
        direction: "export",
        mode: "manual",
        enabled: true,
        updatedAt: now,
      });
    },
    { pid: PROFILE_ID, bid: GARMIN_BRIDGE_ID }
  );
};

const readExportLedger = (page: Page): Promise<unknown[]> =>
  page.evaluate(async () => {
    const db = (window as unknown as Record<string, unknown>)
      .__KAIORD_DB__ as DexieDb;
    return db.table("exportLedger").toArray();
  });

const installBothStubs = async (page: Page): Promise<void> => {
  await installGarminBridgeStub(page);
  await installTanitaBridgeStub(page, { csv: FIXTURE_CSV });
};

test.describe("Tanita → Garmin body-composition sync governance", () => {
  test("fires both bridge actions and writes a ledger row when the export route is enabled", async ({
    page,
  }) => {
    // Arrange
    await installBothStubs(page);
    await page.goto(EXTENSIONS_ROUTE);
    await waitForDexieReady(page);
    await seedProfile(page);
    await addBodyCompositionExportPolicy(page);

    // Act — re-enter with the route live and both bridges discoverable.
    await page.goto(EXTENSIONS_ROUTE);
    await expect(syncButton(page)).toBeEnabled({ timeout: 10_000 });
    await syncButton(page).click();

    // Assert — both bridge actions fired and the ledger recorded the upload.
    await expect
      .poll(() => getTanitaBridgeCallActions(page), { timeout: 10_000 })
      .toContain("read-export-csv");
    await expect
      .poll(() => getGarminBridgeCallActions(page), { timeout: 10_000 })
      .toContain("push-body-composition");
    await expect
      .poll(async () => (await readExportLedger(page)).length, {
        timeout: 8_000,
      })
      .toBe(EXPECTED_LEDGER_ROWS);
  });

  test("does not touch either bridge or write a ledger row when no export route is enabled", async ({
    page,
  }) => {
    // Arrange — both bridges online + discovered, but NO export policy.
    await installBothStubs(page);
    await page.goto(EXTENSIONS_ROUTE);
    await waitForDexieReady(page);
    await seedProfile(page);

    // Act — the button enables on discovery; clicking runs the gated use case.
    await page.goto(EXTENSIONS_ROUTE);
    await expect(syncButton(page)).toBeEnabled({ timeout: 10_000 });
    await syncButton(page).click();
    await expect
      .poll(() => getGarminBridgeCallActions(page), { timeout: 10_000 })
      .toContain("ping");

    // Assert — fail-closed: no read, no push, no ledger row.
    expect(await getTanitaBridgeCallActions(page)).not.toContain(
      "read-export-csv"
    );
    expect(await getGarminBridgeCallActions(page)).not.toContain(
      "push-body-composition"
    );
    expect(await readExportLedger(page)).toHaveLength(0);
  });
});
