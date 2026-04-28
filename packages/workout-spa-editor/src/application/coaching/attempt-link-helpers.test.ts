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
  it("aborted() returns the canonical aborted shape", () => {
    expect(aborted()).toEqual({ ok: false, reason: "aborted" });
  });

  it("transportError() converts Error and string-coerces unknown", () => {
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

  it("safeOpenExternal returns null on success", async () => {
    const t = makeTransport({ openExternal: vi.fn(async () => undefined) });
    expect(await safeOpenExternal(t)).toBeNull();
  });

  it("safeOpenExternal returns transportError on rejection", async () => {
    const t = makeTransport({
      openExternal: vi.fn(async () => {
        throw new Error("denied");
      }),
    });

    const result = await safeOpenExternal(t);

    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "denied",
    });
  });

  it("safeOpenExternal returns null when signal is aborted (caller gates)", async () => {
    const t = makeTransport({
      openExternal: vi.fn(async () => {
        throw new Error("denied");
      }),
    });
    const ctrl = new AbortController();
    ctrl.abort();

    expect(await safeOpenExternal(t, ctrl.signal)).toBeNull();
  });

  it("persistLinkOrDeleted returns ok:true when linkAccount succeeds", async () => {
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

    expect(result).toEqual({ ok: true });
  });

  it("persistLinkOrDeleted returns profile-deleted on ProfileNotFoundError", async () => {
    const profiles = createInMemoryProfileRepository();
    const t = makeTransport();

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

    expect(result).toEqual({ ok: false, reason: "profile-deleted" });
  });

  it("persistLinkOrDeleted re-throws non-ProfileNotFoundError errors", async () => {
    const failing = createInMemoryProfileRepository();
    failing.getById = async () => {
      throw new Error("network error");
    };
    const t = makeTransport();

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

  it("ProfileNotFoundError is matched via instanceof", () => {
    const err = new ProfileNotFoundError("p1");
    expect(err).toBeInstanceOf(ProfileNotFoundError);
    expect(err.profileId).toBe("p1");
  });
});
