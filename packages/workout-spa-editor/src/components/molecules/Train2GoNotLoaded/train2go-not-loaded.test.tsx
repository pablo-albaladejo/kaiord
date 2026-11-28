import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getTranslate } from "../../../i18n/use-translate";
import {
  toastTrain2GoNotLoaded,
  train2GoNotLoadedMessage,
} from "./train2go-not-loaded";

const NOT_LOADED =
  "Part of the Kaiord App did not load, so nothing was asked of Train2Go. Reload the App to load it again.";
const t = getTranslate("coaching");

describe("train2GoNotLoadedMessage", () => {
  it("should word the App's own failure", () => {
    // Arrange

    // Act
    const message = train2GoNotLoadedMessage("app-part-not-loaded", t);

    // Assert
    expect(message).toBe(NOT_LOADED);
  });

  it("should leave any other failure to its own notice", () => {
    // Arrange

    // Act
    const message = train2GoNotLoadedMessage("transport-error", t);

    // Assert
    expect(message).toBeNull();
  });
});

describe("toastTrain2GoNotLoaded", () => {
  it("should say nothing was asked of Train2Go, with Reload", () => {
    // Arrange
    const toasts = { error: vi.fn() };

    // Act
    toastTrain2GoNotLoaded(toasts, t);
    render(<>{toasts.error.mock.calls[0]?.[2]?.action}</>);

    // Assert
    expect(toasts.error).toHaveBeenCalledWith(NOT_LOADED, undefined, {
      action: expect.anything(),
    });
    expect(screen.getByTestId("reload-app-button")).toBeInTheDocument();
  });

  it("should put the sentence under the title of what was not done", () => {
    // Arrange
    const toasts = { error: vi.fn() };

    // Act
    toastTrain2GoNotLoaded(toasts, t, "Your zones were not synced.");

    // Assert
    expect(toasts.error).toHaveBeenCalledWith(
      "Your zones were not synced.",
      NOT_LOADED,
      { action: expect.anything() }
    );
  });
});
