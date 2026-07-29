import { describe, expect, it } from "vitest";

import type {
  ConnectionSource,
  ConnectionSourceStatus,
} from "../../../application/connections/connection-source";
import { detailKeyFor } from "./connection-card-copy";

const source = (
  status: ConnectionSourceStatus,
  overrides: Partial<ConnectionSource> = {}
): ConnectionSource =>
  ({
    id: "garmin",
    mechanism: "bridge",
    bridgeId: "garmin-bridge",
    status,
    bridgeDetected: true,
    disconnected: false,
    needsReauth: false,
    outdated: false,
    ...overrides,
  }) as ConnectionSource;

describe("detailKeyFor", () => {
  it("should tell an outdated bridge to update rather than to sign in", () => {
    // Arrange
    // The discriminating state, and the one the product actually produces:
    // `outdatedExtension()` returns `{outdated: true, needsReauth: false}`, and
    // its `error` drives the card to `attention`. A fixture with both flags set
    // would prove nothing — `needsReauth` is read first among the survivors.
    const outdated = source("attention", { outdated: true });

    // Act
    const key = detailKeyFor(outdated);

    // Assert
    expect(key).toBe("detail.outdated");
    expect(key).not.toBe("detail.noAccess");
  });

  it("should state a failed read without naming its cause when nothing else is known", () => {
    // Arrange
    // The same status reached without a version mismatch. Without this the
    // outdated branch could swallow every attention card and still look green.
    // This is also the branch the Garmin card lands on: `gcApi.ok === false`
    // is all the probe has, and it is set by an unusable token, a Garmin 5xx
    // and a network blip alike.
    const readFailed = source("attention");

    // Act
    const key = detailKeyFor(readFailed);

    // Assert
    expect(key).toBe("detail.noAccess");
  });

  it("should ask for access to be granted again when the bridge says so", () => {
    // Arrange
    const reauth = source("attention", { needsReauth: true });

    // Act
    const key = detailKeyFor(reauth);

    // Assert
    expect(key).toBe("detail.needsReauth");
  });

  it("should say an absent extension is absent rather than disconnected", () => {
    // Arrange
    // Both are true of a source the user unlinked and then uninstalled; the
    // blocking one is the missing extension, which is the one with no control.
    const gone = source("available", {
      bridgeDetected: false,
      disconnected: true,
    });

    // Act
    const key = detailKeyFor(gone);

    // Assert
    expect(key).toBe("detail.notDetected");
  });
});
