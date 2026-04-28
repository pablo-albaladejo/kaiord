/**
 * coaching-account helpers — unit tests
 */

import { describe, expect, it } from "vitest";

import { linkCoachingAccount, unlinkCoachingAccount } from "./coaching-account";
import type { LinkedCoachingAccount } from "./coaching-account";
import type { Profile } from "./profile";

const baseProfile: Profile = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Test",
  sportZones: {},
  linkedAccounts: [],
  createdAt: "2026-04-28T00:00:00.000Z",
  updatedAt: "2026-04-28T00:00:00.000Z",
};

const t2g = (
  overrides: Partial<LinkedCoachingAccount> = {}
): LinkedCoachingAccount => ({
  source: "train2go",
  externalUserId: "28035",
  externalUserName: "Pablo",
  linkedAt: "2026-04-28T10:00:00.000Z",
  ...overrides,
});

describe("linkCoachingAccount", () => {
  it("appends an account when none of that source exists", () => {
    const account = t2g();

    const result = linkCoachingAccount(baseProfile, account);

    expect(result.linkedAccounts).toEqual([account]);
  });

  it("preserves accounts of other sources", () => {
    const tp = t2g({ source: "trainingpeaks", externalUserId: "tp-1" });
    const profile = { ...baseProfile, linkedAccounts: [tp] };
    const t2gAccount = t2g();

    const result = linkCoachingAccount(profile, t2gAccount);

    expect(result.linkedAccounts).toHaveLength(2);
    expect(result.linkedAccounts).toContainEqual(tp);
    expect(result.linkedAccounts).toContainEqual(t2gAccount);
  });

  it("replaces an existing entry of the same source (one-per-source invariant)", () => {
    const old = t2g({ externalUserId: "111", externalUserName: "Old" });
    const profile = { ...baseProfile, linkedAccounts: [old] };
    const fresh = t2g({ externalUserId: "222", externalUserName: "New" });

    const result = linkCoachingAccount(profile, fresh);

    expect(result.linkedAccounts).toEqual([fresh]);
  });

  it("source comparison is case-sensitive (canonical lowercase ASCII)", () => {
    const lower = t2g({ source: "train2go", externalUserId: "111" });
    const profile = { ...baseProfile, linkedAccounts: [lower] };
    const upper = t2g({ source: "Train2Go", externalUserId: "222" });

    const result = linkCoachingAccount(profile, upper);

    // Different source keys → both kept
    expect(result.linkedAccounts).toHaveLength(2);
  });

  it("does not mutate the input profile", () => {
    const account = t2g();

    linkCoachingAccount(baseProfile, account);

    expect(baseProfile.linkedAccounts).toEqual([]);
  });
});

describe("unlinkCoachingAccount", () => {
  it("removes an entry of the given source", () => {
    const account = t2g();
    const profile = { ...baseProfile, linkedAccounts: [account] };

    const result = unlinkCoachingAccount(profile, "train2go");

    expect(result.linkedAccounts).toEqual([]);
  });

  it("preserves accounts of other sources", () => {
    const t2gAccount = t2g();
    const tp = t2g({ source: "trainingpeaks", externalUserId: "tp-1" });
    const profile = { ...baseProfile, linkedAccounts: [t2gAccount, tp] };

    const result = unlinkCoachingAccount(profile, "train2go");

    expect(result.linkedAccounts).toEqual([tp]);
  });

  it("is a no-op when the source is not linked", () => {
    const tp = t2g({ source: "trainingpeaks", externalUserId: "tp-1" });
    const profile = { ...baseProfile, linkedAccounts: [tp] };

    const result = unlinkCoachingAccount(profile, "train2go");

    expect(result.linkedAccounts).toEqual([tp]);
  });

  it("does not mutate the input profile", () => {
    const account = t2g();
    const profile = { ...baseProfile, linkedAccounts: [account] };

    unlinkCoachingAccount(profile, "train2go");

    expect(profile.linkedAccounts).toEqual([account]);
  });
});
