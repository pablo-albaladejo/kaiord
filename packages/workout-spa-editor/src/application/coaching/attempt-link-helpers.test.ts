import { describe, expect, it, vi } from "vitest";

import { createInMemoryProfileRepository } from "../../test-utils/in-memory-profile-repository";
import { ProfileNotFoundError } from "../profile/errors";
import {
  aborted,
  persistLinkOrDeleted,
  safeOpenExternal,
  transportError,
} from "./attempt-link-helpers";
import type { CoachingTransport } from "./coaching-transport-port";

const makeTransport = (
  overrides: Partial<CoachingTransport> = {}
): CoachingTransport => ({
  source: "train2go",
  ping: vi.fn(),
  openExternal: vi.fn(),
  readWeek: vi.fn(),
  readDay: vi.fn(),
  ...overrides,
});

describe("attempt-link helpers", () => {
  it("should return the canonical aborted shape via aborted()", () => {
    // Arrange

    // Act

    // Assert
    expect(aborted()).toEqual({ ok: false, reason: "aborted" });
  });

  it("should convert Error and string-coerce unknown via transportError()", () => {
    // Arrange

    // Act

    // Assert
    expect(transportError(new Error("fail"))).toEqual({
      ok: false,
      reason: "transport-error",
      error: "fail",
    });
    expect(transportError("nope")).toEqual({
      ok: false,
      reason: "transport-error",
      error: "nope",
    });
  });

  it("should return null on success via safeOpenExternal", async () => {
    // Arrange

    // Act
    const t = makeTransport({ openExternal: vi.fn(async () => undefined) });

    // Assert
    expect(await safeOpenExternal(t)).toBeNull();
  });

  it("should return transportError on rejection via safeOpenExternal", async () => {
    // Arrange
    const t = makeTransport({
      openExternal: vi.fn(async () => {
        throw new Error("denied");
      }),
    });

    // Act
    const result = await safeOpenExternal(t);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "denied",
    });
  });

  it("should return null when signal is aborted via safeOpenExternal (caller gates)", async () => {
    // Arrange
    const t = makeTransport({
      openExternal: vi.fn(async () => {
        throw new Error("denied");
      }),
    });
    const ctrl = new AbortController();

    // Act
    ctrl.abort();

    // Assert
    expect(await safeOpenExternal(t, ctrl.signal)).toBeNull();
  });

  it("should return ok:true when linkAccount succeeds via persistLinkOrDeleted", async () => {
    // Arrange
    const profiles = createInMemoryProfileRepository();
    await profiles.put({
      id: "p1",
      name: "Pablo",
      sportZones: {},
      linkedAccounts: [],
      createdAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
    });
    const t = makeTransport();

    // Act
    const result = await persistLinkOrDeleted(
      profiles,
      t,
      "p1",
      {
        sessionActive: true,
        externalUserId: "28035",
        externalUserName: "Pablo",
      },
      "2026-04-28T10:00:00.000Z"
    );

    // Assert
    expect(result).toEqual({ ok: true });
  });

  it("should return profile-deleted on ProfileNotFoundError via persistLinkOrDeleted", async () => {
    // Arrange
    const profiles = createInMemoryProfileRepository();
    const t = makeTransport();

    // Act
    const result = await persistLinkOrDeleted(
      profiles,
      t,
      "missing",
      {
        sessionActive: true,
        externalUserId: "1",
        externalUserName: "Ghost",
      },
      "2026-04-28T10:00:00.000Z"
    );

    // Assert
    expect(result).toEqual({ ok: false, reason: "profile-deleted" });
  });

  it("should re-throw non-ProfileNotFoundError errors via persistLinkOrDeleted", async () => {
    // Arrange
    const failing = createInMemoryProfileRepository();
    failing.getById = async () => {
      throw new Error("network error");
    };

    // Act
    const t = makeTransport();

    // Assert
    await expect(
      persistLinkOrDeleted(
        failing,
        t,
        "p1",
        {
          sessionActive: true,
          externalUserId: "1",
          externalUserName: "x",
        },
        "2026-04-28T10:00:00.000Z"
      )
    ).rejects.toThrow("network error");
  });

  it("should match ProfileNotFoundError via instanceof", () => {
    // Arrange

    // Act
    const err = new ProfileNotFoundError("p1");

    // Assert
    expect(err).toBeInstanceOf(ProfileNotFoundError);
    expect(err.profileId).toBe("p1");
  });
});
