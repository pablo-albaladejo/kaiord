import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ConflictItem, FieldKey } from "../../types/coaching-zones";
import { zonesOfferKind } from "./zones-offer-kind";
import {
  openZonesOffer,
  rememberZonesOffer,
  settleZonesOffer,
  subscribeZonesOffers,
} from "./zones-offer-memo";

const FTP: ConflictItem = {
  field: "cycling.thresholds.ftp" as FieldKey,
  current: 200,
  incoming: 268,
};
const BAND: ConflictItem = {
  field: "cycling.heartRateZones.z4.maxBpm" as FieldKey,
  current: 180,
  incoming: 174,
};

describe("rememberZonesOffer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should call a set of different numbers new once, then not again", () => {
    // Arrange
    const first = rememberZonesOffer("p1", [FTP]);

    // Act
    const second = rememberZonesOffer("p1", [FTP]);

    // Assert
    expect([first, second]).toEqual([true, false]);
  });

  it("should call a changed set new again", () => {
    // Arrange
    rememberZonesOffer("p1", [FTP]);

    // Act
    const changed = rememberZonesOffer("p1", [FTP, BAND]);

    // Assert
    expect(changed).toBe(true);
  });

  it("should keep each athlete's offer apart", () => {
    // Arrange
    rememberZonesOffer("p1", [FTP]);

    // Act
    const other = rememberZonesOffer("p2", [FTP]);

    // Assert
    expect(other).toBe(true);
    expect(openZonesOffer("p1")).toEqual([FTP]);
  });

  it("should forget the offer once Train2Go agrees, so a later difference is offered again", () => {
    // Arrange
    rememberZonesOffer("p1", [FTP]);
    rememberZonesOffer("p1", []);

    // Act
    const again = rememberZonesOffer("p1", [FTP]);

    // Assert
    expect(again).toBe(true);
  });
});

describe("openZonesOffer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should keep an offer open after its notice is gone, until it is settled", () => {
    // Arrange
    rememberZonesOffer("p1", [FTP, BAND]);
    const before = openZonesOffer("p1");

    // Act
    settleZonesOffer("p1");

    // Assert
    expect(before).toEqual([FTP, BAND]);
    expect(openZonesOffer("p1")).toEqual([]);
  });

  it("should not reopen a settled offer when the same numbers come back", () => {
    // Arrange
    rememberZonesOffer("p1", [FTP]);
    settleZonesOffer("p1");

    // Act
    const isNew = rememberZonesOffer("p1", [FTP]);

    // Assert
    expect(isNew).toBe(false);
    expect(openZonesOffer("p1")).toEqual([]);
  });

  it("should survive a reload: the offer is read back from this device", () => {
    // Arrange
    rememberZonesOffer("p1", [FTP]);
    const stored = localStorage.getItem("kaiord.zones-offered");
    localStorage.clear();

    // Act
    if (stored !== null) localStorage.setItem("kaiord.zones-offered", stored);

    // Assert
    expect(openZonesOffer("p1")).toEqual([FTP]);
  });

  it("should read unreadable storage as no offer", () => {
    // Arrange
    localStorage.setItem("kaiord.zones-offered", "{not json");

    // Act
    const open = openZonesOffer("p1");

    // Assert
    expect(open).toEqual([]);
  });

  it("should tell a subscriber when an offer opens or settles", () => {
    // Arrange
    const listener = vi.fn();
    const unsubscribe = subscribeZonesOffers(listener);

    // Act
    rememberZonesOffer("p1", [FTP]);
    settleZonesOffer("p1");
    unsubscribe();

    // Assert
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("zonesOfferKind", () => {
  it.each([
    { conflicts: [FTP], kind: "thresholds" },
    { conflicts: [BAND], kind: "zones" },
    { conflicts: [FTP, BAND], kind: "both" },
  ])("should name $kind for what differs", ({ conflicts, kind }) => {
    // Arrange
    // Act
    const named = zonesOfferKind(conflicts);

    // Assert
    expect(named).toBe(kind);
  });
});
