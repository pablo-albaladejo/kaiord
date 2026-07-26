/**
 * syncTanitaBodyComposition — governed export orchestration test.
 *
 * Wires the real Dexie export-ledger + integration-policy repos (fake-indexeddb)
 * so the idempotency guarantee is proven end-to-end: an enabled route uploads
 * every measurement once, and a re-run of the same day SKIPs all of them.
 */
import "fake-indexeddb/auto";

import { tanitaCsvToKrd } from "@kaiord/tanita";
import Dexie from "dexie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KaiordDatabase } from "../../adapters/dexie/dexie-database";
import { createDexieExportLedgerRepository } from "../../adapters/dexie/dexie-export-ledger-repository";
import { createDexieIntegrationPolicyRepository } from "../../adapters/dexie/dexie-integration-policy-repository";
import type { IntegrationPolicyRepository } from "../integration-policy/integration-policy-repository.port";
import { syncTanitaBodyComposition } from "./sync-tanita-body-composition.use-case";

const dbName = () => `test-tanita-sync-${Date.now()}-${Math.random()}`;

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";
const CSV = [
  "Date,Weight (kg),Body Fat (%)",
  "2026-07-20 08:00:00,75.2,18.5",
  "2026-07-21 08:00:00,75.0,18.3",
  "",
].join("\n");
const EXPECTED_MEASUREMENTS = 2;
// eslint-disable-next-line no-magic-numbers -- stand-in encoded FIT bytes
const ENCODED_FIT = new Uint8Array([1, 2, 3]);

const seedExportPolicy = async (
  policyRepo: IntegrationPolicyRepository
): Promise<void> => {
  await policyRepo.put({
    id: crypto.randomUUID(),
    profileId: PROFILE_ID,
    dataType: "body-composition",
    bridgeId: "garmin-bridge",
    direction: "export",
    mode: "manual",
    enabled: true,
    updatedAt: new Date().toISOString(),
  });
};

describe("syncTanitaBodyComposition", () => {
  let name: string;
  let db: KaiordDatabase;

  beforeEach(async () => {
    name = dbName();
    db = new KaiordDatabase(name);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(name);
  });

  const makeDeps = () => ({
    policyRepo: createDexieIntegrationPolicyRepository(db),
    ledgerRepo: createDexieExportLedgerRepository(db),
    readCsv: vi.fn().mockResolvedValue(CSV),
    parse: tanitaCsvToKrd,
    encode: vi.fn(() => ENCODED_FIT),
    push: vi.fn().mockResolvedValue(undefined),
  });

  it("should fail closed with route-inactive and never read when no export route is enabled", async () => {
    // Arrange
    const deps = makeDeps();

    // Act
    const result = await syncTanitaBodyComposition(deps, {
      profileId: PROFILE_ID,
    });

    // Assert
    expect(result).toEqual({ ok: false, reason: "route-inactive" });
    expect(deps.readCsv).not.toHaveBeenCalled();
    expect(deps.push).not.toHaveBeenCalled();
  });

  it("should return needs-reauth when the read fails with a dead session", async () => {
    // Arrange
    const deps = makeDeps();
    await seedExportPolicy(deps.policyRepo);
    deps.readCsv.mockRejectedValue(
      Object.assign(new Error("Session expired"), { needsReauth: true })
    );

    // Act
    const result = await syncTanitaBodyComposition(deps, {
      profileId: PROFILE_ID,
    });

    // Assert
    expect(result).toEqual({ ok: false, reason: "needs-reauth" });
    expect(deps.push).not.toHaveBeenCalled();
  });

  it("should upload every measurement once when the export route is enabled", async () => {
    // Arrange
    const deps = makeDeps();
    await seedExportPolicy(deps.policyRepo);

    // Act
    const result = await syncTanitaBodyComposition(deps, {
      profileId: PROFILE_ID,
    });

    // Assert
    expect(result).toEqual({
      ok: true,
      uploaded: EXPECTED_MEASUREMENTS,
      skipped: 0,
    });
    expect(deps.push).toHaveBeenCalledTimes(EXPECTED_MEASUREMENTS);
    const ledgerRows = await db.table("exportLedger").toArray();
    expect(ledgerRows).toHaveLength(EXPECTED_MEASUREMENTS);
  });

  it("should skip every measurement on a re-run of the same measurements", async () => {
    // Arrange
    const seeded = makeDeps();
    await seedExportPolicy(seeded.policyRepo);
    await syncTanitaBodyComposition(seeded, { profileId: PROFILE_ID });
    const rerun = makeDeps();

    // Act
    const result = await syncTanitaBodyComposition(rerun, {
      profileId: PROFILE_ID,
    });

    // Assert
    expect(result).toEqual({
      ok: true,
      uploaded: 0,
      skipped: EXPECTED_MEASUREMENTS,
    });
    expect(rerun.push).not.toHaveBeenCalled();
    const ledgerRows = await db.table("exportLedger").toArray();
    expect(ledgerRows).toHaveLength(EXPECTED_MEASUREMENTS);
  });

  it("should drive the phase callback through reading, parsing, encoding, and uploading", async () => {
    // Arrange
    const deps = makeDeps();
    await seedExportPolicy(deps.policyRepo);
    const phases: string[] = [];

    // Act
    await syncTanitaBodyComposition(
      { ...deps, onPhase: (phase) => phases.push(phase) },
      { profileId: PROFILE_ID }
    );

    // Assert
    expect(phases).toEqual(["reading", "parsing", "encoding", "uploading"]);
  });
});
