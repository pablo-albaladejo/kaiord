/**
 * coaching-account helpers — unit tests
 */

import { describe, expect, it } from "vitest";

import type { LinkedCoachingAccount } from "./coaching-account";
import { linkCoachingAccount, unlinkCoachingAccount } from "./coaching-account";
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
  it("should append an account when none of that source exists", () => {
    // Arrange

    const account = t2g();

    // Act

    const result = linkCoachingAccount(baseProfile, account);

    // Assert

    expect(result.linkedAccounts).toEqual([account]);
  });

  it("should preserve accounts of other sources", () => {
    // Arrange

    const tp = t2g({ source: "trainingpeaks", externalUserId: "tp-1" });
    const profile = { ...baseProfile, linkedAccounts: [tp] };
    const t2gAccount = t2g();

    // Act

    const result = linkCoachingAccount(profile, t2gAccount);

    // Assert

    expect(result.linkedAccounts).toHaveLength(2);
    expect(result.linkedAccounts).toContainEqual(tp);
    expect(result.linkedAccounts).toContainEqual(t2gAccount);
  });

  it("should replace an existing entry of the same source (one-per-source invariant)", () => {
    // Arrange

    const old = t2g({ externalUserId: "111", externalUserName: "Old" });
    const profile = { ...baseProfile, linkedAccounts: [old] };
    const fresh = t2g({ externalUserId: "222", externalUserName: "New" });

    // Act

    const result = linkCoachingAccount(profile, fresh);

    // Assert

    expect(result.linkedAccounts).toEqual([fresh]);
  });

  it("should treat source comparison as case-sensitive (canonical lowercase ASCII)", () => {
    // Arrange

    const lower = t2g({ source: "train2go", externalUserId: "111" });
    const profile = { ...baseProfile, linkedAccounts: [lower] };
    const upper = t2g({ source: "Train2Go", externalUserId: "222" });

    // Act

    const result = linkCoachingAccount(profile, upper);

    // Different source keys → both kept

    // Assert

    expect(result.linkedAccounts).toHaveLength(2);
  });

  it("should not mutate the input profile", () => {
    // Arrange

    const account = t2g();

    // Act

    linkCoachingAccount(baseProfile, account);

    // Assert

    expect(baseProfile.linkedAccounts).toEqual([]);
  });
});

describe("unlinkCoachingAccount", () => {
  it("should remove an entry of the given source", () => {
    // Arrange

    const account = t2g();
    const profile = { ...baseProfile, linkedAccounts: [account] };

    // Act

    const result = unlinkCoachingAccount(profile, "train2go");

    // Assert

    expect(result.linkedAccounts).toEqual([]);
  });

  it("should preserve accounts of other sources", () => {
    // Arrange

    const t2gAccount = t2g();
    const tp = t2g({ source: "trainingpeaks", externalUserId: "tp-1" });
    const profile = { ...baseProfile, linkedAccounts: [t2gAccount, tp] };

    // Act

    const result = unlinkCoachingAccount(profile, "train2go");

    // Assert

    expect(result.linkedAccounts).toEqual([tp]);
  });

  it("should be a no-op when the source is not linked", () => {
    // Arrange

    const tp = t2g({ source: "trainingpeaks", externalUserId: "tp-1" });
    const profile = { ...baseProfile, linkedAccounts: [tp] };

    // Act

    const result = unlinkCoachingAccount(profile, "train2go");

    // Assert

    expect(result.linkedAccounts).toEqual([tp]);
  });

  it("should not mutate the input profile", () => {
    // Arrange

    const account = t2g();
    const profile = { ...baseProfile, linkedAccounts: [account] };

    // Act

    unlinkCoachingAccount(profile, "train2go");

    // Assert

    expect(profile.linkedAccounts).toEqual([account]);
  });
});
