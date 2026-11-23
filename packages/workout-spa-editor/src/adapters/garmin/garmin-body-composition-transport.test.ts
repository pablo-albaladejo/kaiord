import { afterEach, describe, expect, it, vi } from "vitest";

import { SPA_ACTION_TIMEOUT_MS } from "../../application/garmin-placement/placement-timing";
import {
  GarminBodyCompositionError,
  pushGarminBodyComposition,
} from "./garmin-body-composition-transport";

// An extension one protocol behind (the store version): it refuses the
// thin Bridge's `request`, so each case is its legacy action's answer.
const { legacySend } = vi.hoisted(() => ({ legacySend: vi.fn() }));
vi.mock("../bridge/bridge-transport", () => ({
  sendBridgeMessage: (id: string, message: { action?: string }, t: number) =>
    message?.action === "request"
      ? Promise.resolve({
          ok: false,
          protocolVersion: 1,
          error: "Origin or action not permitted",
          retryable: false,
        })
      : legacySend(id, message, t),
}));

const mockedSend = legacySend;
const PUSH_BODY_COMPOSITION_TIMEOUT_MS = SPA_ACTION_TIMEOUT_MS;
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
// eslint-disable-next-line no-magic-numbers -- fixed FIT byte payload for the assertion
const FIT_BYTES = [1, 2, 3, 4] as const;

describe("pushGarminBodyComposition", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should send push-body-composition with the fit bytes as a number array", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { uploadId: "abc" },
    });
    const fit = new Uint8Array(FIT_BYTES);

    // Act
    await pushGarminBodyComposition("ext-9", fit);

    // Assert
    expect(mockedSend).toHaveBeenCalledWith(
      "ext-9",
      { action: "push-body-composition", fit: [...FIT_BYTES] },
      PUSH_BODY_COMPOSITION_TIMEOUT_MS
    );
  });

  it("should throw without redetect on a generic bridge failure", async () => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: false, error: "Upload failed" });

    // Act
    const act = pushGarminBodyComposition("ext-9", new Uint8Array([1]));

    // Assert
    await expect(act).rejects.toBeInstanceOf(GarminBodyCompositionError);
    await expect(act).rejects.toMatchObject({ redetect: false });
  });

  it.each([
    { scenario: "401 Unauthorized", status: HTTP_UNAUTHORIZED },
    { scenario: "403 Forbidden", status: HTTP_FORBIDDEN },
  ])("should mark redetect on a $scenario response", async ({ status }) => {
    // Arrange
    mockedSend.mockResolvedValue({ ok: false, error: "Auth", status });

    // Act
    const act = pushGarminBodyComposition("ext-9", new Uint8Array([1]));

    // Assert
    await expect(act).rejects.toMatchObject({ redetect: true });
  });
});
