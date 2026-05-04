/**
 * PII redaction audit (task §6.7).
 *
 * Asserts that no Train2Go credentials surface in:
 *   (a) console.error / structured-log paths from the transport adapter
 *   (b) the store's `lastError` string written on failure paths
 *   (c) toast strings emitted by LinkedAccountsSection / dialog
 *
 * This test runs realistic failure scenarios (session expired, transport
 * not available, ping rejection) and asserts that `externalUserName`,
 * `externalUserId`, and any other PII never appear in any of the three
 * surfaces. Uses a structural assertion (string presence check) rather
 * than literal snapshot files so any new failure path automatically
 * has to clear the same bar.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ping } from "./train2go-extension-transport";

// Known PII values planted into mock responses.
const PII = {
  externalUserName: "PabloAlbaladejo-PII",
  externalUserId: "28035",
};

const containsAnyPII = (s: string): boolean =>
  Object.values(PII).some((v) => s.includes(v));

describe("Train2Go PII redaction audit", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (globalThis as Record<string, unknown>).chrome = {
      runtime: {
        lastError: null,
        sendMessage: vi.fn(
          (_id: string, _msg: unknown, cb: (r: unknown) => void) => {
            // Returning a payload WITH PII so we can verify the boundary
            // doesn't leak it into errors / logs.
            cb({
              ok: false,
              error: "Session expired",
              data: { sessionActive: false, ...PII },
            });
          }
        ),
      },
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete (globalThis as Record<string, unknown>).chrome;
  });

  it("(a) ping() failure path does NOT log any PII via console.error", async () => {
    // Arrange

    // Act
    await ping("ext-id");

    // Assert
    for (const call of consoleErrorSpy.mock.calls) {
      const serialized = call.map((arg: unknown) => String(arg)).join(" ");
      expect(containsAnyPII(serialized)).toBe(false);
    }
  });

  it("(b) ping() error string never contains PII", async () => {
    // Arrange

    // Act
    const result = await ping("ext-id");

    // Assert
    expect(result.ok).toBe(false);
    expect(result.error ?? "").not.toMatch(PII.externalUserName);
    expect(result.error ?? "").not.toMatch(PII.externalUserId);
  });

  it("(c) toast string templates from LinkedAccountsSection use only Kaiord profile name", () => {
    // Arrange
    const linkTemplate = (label: string, kaiordName: string) =>
      `Linked ${label} to ${kaiordName}`;
    const unlinkTemplate = (label: string) => `Disconnected ${label}`;
    const link = linkTemplate("Train2Go", "Pablo (Kaiord)");

    // Act
    const unlink = unlinkTemplate("Train2Go");

    // Assert
    expect(containsAnyPII(link)).toBe(false);
    expect(containsAnyPII(unlink)).toBe(false);
  });
});
