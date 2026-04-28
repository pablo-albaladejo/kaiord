import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInMemoryCoachingRepository } from "../../test-utils/in-memory-coaching-repository";
import { createInMemoryProfileRepository } from "../../test-utils/in-memory-profile-repository";
import type { LinkedCoachingAccount } from "../../types/coaching-account";
import type { Profile } from "../../types/profile";
import type { CoachingTransport } from "./coaching-transport-port";
import { expandDay } from "./expand-day";

const T2G_LINK: LinkedCoachingAccount = {
  source: "train2go",
  externalUserId: "28035",
  externalUserName: "Pablo",
  linkedAt: "2026-04-28T10:00:00.000Z",
};

const profile = (links: LinkedCoachingAccount[] = []): Profile => ({
  id: "p1",
  name: "Pablo",
  sportZones: {},
  linkedAccounts: links,
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
});

const transport = (
  overrides: Partial<CoachingTransport> = {}
): CoachingTransport => ({
  source: "train2go",
  ping: vi.fn(),
  openExternal: vi.fn(),
  readWeek: vi.fn(),
  readDay: vi.fn(async () => []),
  ...overrides,
});

describe("expandDay", () => {
  let deps: Parameters<typeof expandDay>[0];
  beforeEach(async () => {
    const profiles = createInMemoryProfileRepository();
    await profiles.put(profile([T2G_LINK]));
    deps = {
      profiles,
      coaching: createInMemoryCoachingRepository(),
      transport: transport(),
    };
  });

  it("returns not-linked when the profile has no link for the source", async () => {
    await deps.profiles.put(profile([]));

    const result = await expandDay(deps, "p1", "2026-04-13");

    expect(result).toEqual({ ok: false, reason: "not-linked" });
  });

  it("returns not-linked when profile is missing", async () => {
    const empty = createInMemoryProfileRepository();
    deps = { ...deps, profiles: empty };

    const result = await expandDay(deps, "missing", "2026-04-13");

    expect(result).toEqual({ ok: false, reason: "not-linked" });
  });

  it("surfaces session-expired distinctly from transport errors", async () => {
    const t = transport({
      readDay: vi.fn(async () => {
        throw new Error("Session expired");
      }),
    });
    deps = { ...deps, transport: t };

    const result = await expandDay(deps, "p1", "2026-04-13");

    expect(result).toEqual({ ok: false, reason: "session-expired" });
  });

  it("returns transport-error for generic transport rejections", async () => {
    const t = transport({
      readDay: vi.fn(async () => {
        throw new Error("network down");
      }),
    });
    deps = { ...deps, transport: t };

    const result = await expandDay(deps, "p1", "2026-04-13");

    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "network down",
    });
  });
});
