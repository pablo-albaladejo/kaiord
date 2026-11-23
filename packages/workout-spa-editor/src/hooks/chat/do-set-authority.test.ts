/**
 * Tests for doSetAuthority — the set_authority action-op implementation: the
 * athlete's own choice of Authority, stored as the matrix stores it.
 */
import { describe, expect, it } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { doSetAuthority } from "./do-set-authority";

const PROFILE_ID = "11111111-1111-4111-8111-111111111111";

describe("doSetAuthority", () => {
  it("should resolve a single-source priority order (read only from that source)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await doSetAuthority(persistence, PROFILE_ID, {
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop"],
    });

    // Assert
    expect(result).toEqual({
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop-bridge"],
    });
    const stored = await persistence.dataTypeSourcePolicy.findByProfileAndType({
      profileId: PROFILE_ID,
      dataType: "sleep",
    });
    expect(stored).toMatchObject({
      mode: "priority",
      sourceOrder: ["whoop-bridge"],
    });
  });

  it("should keep the 'manual' source key unresolved (not a bridge id)", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await doSetAuthority(persistence, PROFILE_ID, {
      dataType: "weight",
      mode: "priority",
      sourceOrder: ["manual", "garmin"],
    });

    // Assert
    expect(result).toEqual({
      dataType: "weight",
      mode: "priority",
      sourceOrder: ["manual", "garmin-bridge"],
    });
  });

  it("should clear the source order when switching to union", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();

    // Act
    const result = await doSetAuthority(persistence, PROFILE_ID, {
      dataType: "sleep",
      mode: "union",
      sourceOrder: ["whoop"],
    });

    // Assert
    expect(result).toEqual({
      dataType: "sleep",
      mode: "union",
      sourceOrder: [],
    });
  });

  it("should refuse a priority order whose sources all fail to resolve", async () => {
    // Arrange
    // The tool schema rejects an ABSENT sourceOrder, but only counts the raw
    // array — "strava" is a real registry entry with no bridge id, so it
    // passes the length check and then drops out during resolution. Persisting
    // the mode without its ordering stores a policy resolveEffectiveSource
    // reads no record through, and leaves every reader to invent a head.
    const persistence = createInMemoryPersistence();

    // Act
    const result = await doSetAuthority(persistence, PROFILE_ID, {
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["strava"],
    });

    // Assert
    expect(result).toMatchObject({ error: "unresolvable_source_order" });
    const stored = await persistence.dataTypeSourcePolicy.findByProfileAndType({
      profileId: PROFILE_ID,
      dataType: "sleep",
    });
    expect(stored).toBeUndefined();
  });

  it("should refuse a priority order rather than silently promote what survives", async () => {
    // Arrange
    // The dangerous case, because it looks like success. "whoop-bridge" is the
    // STORAGE key, not a chat-facing id, so it fails to resolve while "tanita"
    // succeeds — dropping the first and keeping the rest would durably rank
    // Tanita first, the resolver would honour it, and the Connections pill
    // would name Tanita as the source of truth for a request that asked for
    // WHOOP.
    const persistence = createInMemoryPersistence();

    // Act
    const result = await doSetAuthority(persistence, PROFILE_ID, {
      dataType: "weight",
      mode: "priority",
      sourceOrder: ["whoop-bridge", "tanita"],
    });

    // Assert
    expect(result).toMatchObject({
      error: "unresolvable_source_order",
      unresolved: ["whoop-bridge"],
    });
    const stored = await persistence.dataTypeSourcePolicy.findByProfileAndType({
      profileId: PROFILE_ID,
      dataType: "weight",
    });
    expect(stored).toBeUndefined();
  });

  it("should store a priority order in which every source resolves", async () => {
    // Arrange
    // The refusal is exact, not a blanket ban: WHOOP and Tanita both announce
    // read:body and both serve weight, so this order is honourable in full.
    const persistence = createInMemoryPersistence();

    // Act
    const result = await doSetAuthority(persistence, PROFILE_ID, {
      dataType: "weight",
      mode: "priority",
      sourceOrder: ["whoop", "tanita"],
    });

    // Assert
    expect(result).toMatchObject({
      sourceOrder: ["whoop-bridge", "tanita-bridge"],
    });
  });
});
