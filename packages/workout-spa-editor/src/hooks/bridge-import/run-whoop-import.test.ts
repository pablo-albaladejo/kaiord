/**
 * The WHOOP import at the message contract with the extension (#1091): a
 * held sign-in whose token names no account id cannot import anything, and
 * the import says so instead of finishing as if it had run. With no sign-in
 * held there is nothing to import and nothing to say.
 */
import { afterEach, describe, expect, it } from "vitest";

import type { PersistencePort } from "../../ports/persistence-port";
import {
  currentExtension,
  previousExtension,
  uninstallFakeExtension,
} from "../../test-utils/fake-bridge-extension";
import { runWhoopImport } from "./run-whoop-import";

const EXT = "whoop-ext";
const PERSISTENCE = {} as PersistencePort;

afterEach(() => uninstallFakeExtension());

describe("runWhoopImport", () => {
  it("should refuse, naming the missing account, when the current extension holds a sign-in with no account id", async () => {
    // Arrange
    const sent = currentExtension({}, { status: { connected: true } });

    // Act
    const outcome = await runWhoopImport(PERSISTENCE, EXT, "p1").catch(
      (e: unknown) => e
    );

    // Assert
    expect(outcome).toMatchObject({ reason: "no-account-id" });
    expect(sent.map((m) => m.action)).toEqual(["read-user-id", "status"]);
  });

  it("should refuse the same way for the extension one protocol behind", async () => {
    // Arrange
    const sent = previousExtension({
      status: { connected: true, userId: null, capturedAt: 1 },
    });

    // Act
    const outcome = await runWhoopImport(PERSISTENCE, EXT, "p1").catch(
      (e: unknown) => e
    );

    // Assert
    expect(outcome).toMatchObject({ reason: "no-account-id" });
    expect(sent.some((m) => m.action === "request")).toBe(false);
  });

  it("should import nothing and say nothing when no WHOOP sign-in is held", async () => {
    // Arrange
    const sent = currentExtension({}, { status: { connected: false } });

    // Act
    const outcome = await runWhoopImport(PERSISTENCE, EXT, "p1");

    // Assert
    expect(outcome).toBeUndefined();
    expect(sent.some((m) => m.action === "request")).toBe(false);
  });
});
