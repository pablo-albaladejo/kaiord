/**
 * Generic in-memory health-record repository contract tests. The
 * Dexie-backed factory is tested separately against IndexedDB in
 * `adapters/dexie/dexie-health-record-repository.test.ts`; both
 * implementations share this surface.
 */
import { describe, expect, it } from "vitest";

import type {
  HealthRecord,
  HealthRecordRepository,
} from "../ports/health-record-repository";
import { createInMemoryHealthRecordRepository } from "./in-memory-health-record-repository";

type TestPayload = { value: number };
type TestRecord = HealthRecord<TestPayload>;

const makeRecord = (
  id: string,
  profileId: string,
  date: string,
  value = 0
): TestRecord => ({ id, profileId, date, krd: { value } });

const buildRepo = (): HealthRecordRepository<TestRecord> =>
  createInMemoryHealthRecordRepository<TestRecord>();

describe("createInMemoryHealthRecordRepository", () => {
  it("should round-trip a single record via put + getById", async () => {
    // Arrange
    const repo = buildRepo();
    const record = makeRecord("r-1", "p-1", "2026-05-23", 42);

    // Act
    await repo.put(record);
    const fetched = await repo.getById("r-1");

    // Assert
    expect(fetched).toEqual(record);
  });

  it("should return undefined when getById misses", async () => {
    // Arrange
    const repo = buildRepo();

    // Act
    const fetched = await repo.getById("missing");

    // Assert
    expect(fetched).toBeUndefined();
  });

  it("should filter getByProfileAndDateRange by profileId and inclusive dates", async () => {
    // Arrange
    const repo = buildRepo();
    await repo.upsertMany([
      makeRecord("a", "p-1", "2026-05-20"),
      makeRecord("b", "p-1", "2026-05-22"),
      makeRecord("c", "p-1", "2026-05-25"),
      makeRecord("d", "p-2", "2026-05-22"),
    ]);

    // Act
    const rows = await repo.getByProfileAndDateRange(
      "p-1",
      "2026-05-21",
      "2026-05-23"
    );

    // Assert
    expect(rows.map((r) => r.id).sort()).toEqual(["b"]);
  });

  it("should upsertMany idempotently (re-running with same ids overwrites)", async () => {
    // Arrange
    const repo = buildRepo();
    await repo.upsertMany([makeRecord("x", "p-1", "2026-05-23", 1)]);

    // Act
    await repo.upsertMany([makeRecord("x", "p-1", "2026-05-23", 2)]);
    const fetched = await repo.getById("x");

    // Assert
    expect(fetched?.krd.value).toBe(2);
  });

  it("should treat delete of a missing id as a no-op", async () => {
    // Arrange
    const repo = buildRepo();

    // Act
    await repo.delete("nope");

    // Assert (no throw)
    expect(await repo.getById("nope")).toBeUndefined();
  });

  it("should cascade deleteByProfile across rows of the given profile only", async () => {
    // Arrange
    const repo = buildRepo();
    await repo.upsertMany([
      makeRecord("a", "p-1", "2026-05-23"),
      makeRecord("b", "p-1", "2026-05-24"),
      makeRecord("c", "p-2", "2026-05-23"),
    ]);

    // Act
    await repo.deleteByProfile("p-1");
    const allP1 = await repo.getByProfileAndDateRange(
      "p-1",
      "2026-05-01",
      "2026-05-31"
    );
    const allP2 = await repo.getByProfileAndDateRange(
      "p-2",
      "2026-05-01",
      "2026-05-31"
    );

    // Assert
    expect(allP1).toEqual([]);
    expect(allP2.map((r) => r.id)).toEqual(["c"]);
  });
});
