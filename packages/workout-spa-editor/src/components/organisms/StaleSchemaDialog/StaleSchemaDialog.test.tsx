import { describe, expect, it, vi } from "vitest";

import { render, screen, userEvent } from "../../../test-utils";
import { StaleSchemaDialog } from "./StaleSchemaDialog";

const renderDialog = (
  overrides: Partial<Parameters<typeof StaleSchemaDialog>[0]> = {}
) => {
  const props = {
    hasDraft: false,
    tryAgainLater: false,
    reloading: false,
    onDownloadDraft: vi.fn(),
    onReload: vi.fn(),
    ...overrides,
  };
  render(<StaleSchemaDialog {...props} />);
  return props;
};

describe("StaleSchemaDialog", () => {
  it("should say Kaiord was updated in another window", () => {
    // Arrange
    renderDialog();

    // Act
    const title = screen.getByRole("dialog", {
      name: "Kaiord was updated in another window",
    });

    // Assert
    expect(title).toBeInTheDocument();
    expect(screen.queryByTestId("stale-try-later")).not.toBeInTheDocument();
  });

  it("should tell the user that saved data stays safe in the browser", () => {
    // Arrange
    renderDialog();

    // Act
    const note = screen.getByText(
      "Everything already saved stays in this browser, untouched, for the newer version to open."
    );

    // Assert
    expect(note).toBeInTheDocument();
  });

  it("should stay open on Escape", async () => {
    // Arrange
    const user = userEvent.setup();
    renderDialog();

    // Act
    await user.keyboard("{Escape}");

    // Assert
    expect(screen.getByTestId("stale-schema-dialog")).toBeInTheDocument();
  });

  it("should offer the draft only when one exists", async () => {
    // Arrange
    const user = userEvent.setup();
    const withDraft = renderDialog({ hasDraft: true });

    // Act
    await user.click(screen.getByRole("button", { name: "Download draft" }));

    // Assert
    expect(withDraft.onDownloadDraft).toHaveBeenCalledTimes(1);
  });

  it("should hide the draft action without a draft", () => {
    // Arrange
    renderDialog({ hasDraft: false });

    // Act
    const draft = screen.queryByRole("button", { name: "Download draft" });

    // Assert
    expect(draft).not.toBeInTheDocument();
  });

  it("should retry and show the try-again line when asked", async () => {
    // Arrange
    const user = userEvent.setup();
    const props = renderDialog({ tryAgainLater: true });

    // Act
    await user.click(screen.getByRole("button", { name: "Retry" }));

    // Assert
    expect(props.onReload).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("stale-try-later")).toHaveTextContent(
      "Try again in a few minutes."
    );
  });
});
