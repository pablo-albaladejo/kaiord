import type { Page } from "@playwright/test";

/**
 * Seeds the one Dexie row that moves `useGarminGate` past `export-disabled`:
 * an enabled manual workout-export policy routed at the garmin bridge. With
 * the garmin-bridge stub installed (extension + session), this completes the
 * `ready` gate, which is the only state where the ribbon renders the
 * send-to-garmin button.
 */
export const seedEnabledGarminExportPolicy = async (
  page: Page,
  profileId: string,
  bridgeId = "garmin-bridge"
): Promise<void> => {
  await page.evaluate(
    async ({ pid, bid }) => {
      type Db = {
        table: (n: string) => { put: (r: unknown) => Promise<void> };
      };
      const db = (window as unknown as Record<string, unknown>)
        .__KAIORD_DB__ as Db;
      const now = new Date().toISOString();
      await db.table("integrationPolicies").put({
        id: `policy-${bid}-workout-export`,
        profileId: pid,
        dataType: "workout",
        bridgeId: bid,
        direction: "export",
        mode: "manual",
        enabled: true,
        updatedAt: now,
      });
    },
    { pid: profileId, bid: bridgeId }
  );
};
