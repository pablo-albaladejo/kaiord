/**
 * Storage Degradation Probe
 *
 * Tests IndexedDB availability with a write/read cycle.
 */

import Dexie from "dexie";

export type HydrationStatus = "pending" | "complete" | "failed";

export async function probeStorage(): Promise<HydrationStatus> {
  try {
    const testDb = new Dexie("kaiord-probe");
    testDb.version(1).stores({ test: "id" });
    await testDb.table("test").put({ id: "probe" });
    await testDb.table("test").delete("probe");
    await testDb.delete();
    return "complete";
  } catch {
    return "failed";
  }
}
