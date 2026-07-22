import { afterEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "../bridge/bridge-transport";
import {
  GarminBodyCompositionError,
  pushGarminBodyComposition,
} from "./garmin-body-composition-transport";

vi.mock("../bridge/bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);
const PUSH_BODY_COMPOSITION_TIMEOUT_MS = 15_000;
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
