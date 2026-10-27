import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StaleReloadOutcome } from "../../../lib/stale-schema-reload";
import { render, screen, userEvent } from "../../../test-utils";
import { StaleSchemaScreen } from "./StaleSchemaScreen";

const reloadIntoNewerCode = vi.hoisted(() =>
  vi.fn<(options: { auto: boolean }) => Promise<StaleReloadOutcome>>()
);
vi.mock("../../../lib/stale-schema-reload", () => ({ reloadIntoNewerCode }));

const renderScreen = (autoUpdate: boolean) =>
  render(
    <StrictMode>
      <StaleSchemaScreen
        autoUpdate={autoUpdate}
        hasDraft={false}
        onDownloadDraft={vi.fn()}
      />
    </StrictMode>
  );

describe("StaleSchemaScreen", () => {
  beforeEach(() => {
    reloadIntoNewerCode.mockReset();
  });

  it("should try the newer worker once at boot and offer a retry when it cannot", async () => {
    // Arrange
    reloadIntoNewerCode.mockResolvedValue("try-again");

    // Act
    renderScreen(true);

    // Assert
    expect(await screen.findByTestId("stale-try-later")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    expect(reloadIntoNewerCode).toHaveBeenCalledTimes(1);
    expect(reloadIntoNewerCode).toHaveBeenCalledWith({ auto: true });
  });

  it("should leave a plain Reload at boot without a registration", async () => {
    // Arrange
    reloadIntoNewerCode.mockResolvedValue("no-registration");

    // Act
    renderScreen(true);

    // Assert
    expect(await screen.findByRole("button", { name: "Reload" })).toBeEnabled();
    expect(screen.queryByTestId("stale-try-later")).not.toBeInTheDocument();
  });

  it("should wait for a click mid-session and then try", async () => {
    // Arrange
    const user = userEvent.setup();
    reloadIntoNewerCode.mockResolvedValue("reloading");
    renderScreen(false);
    const beforeClick = reloadIntoNewerCode.mock.calls.length;

    // Act
    await user.click(screen.getByRole("button", { name: "Reload" }));

    // Assert
    expect(beforeClick).toBe(0);
    expect(reloadIntoNewerCode).toHaveBeenCalledWith({ auto: false });
  });
});
