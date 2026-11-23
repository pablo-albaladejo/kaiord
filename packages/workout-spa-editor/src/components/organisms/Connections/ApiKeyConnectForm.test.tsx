import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ApiKeyRefusedError } from "../../../types/api-key-refused-error";
import { ApiKeyConnectForm } from "./ApiKeyConnectForm";

const typeKey = (value: string) => {
  fireEvent.change(screen.getByLabelText("API key"), { target: { value } });
};

describe("ApiKeyConnectForm", () => {
  it("should submit the trimmed key to onConnect", async () => {
    // Arrange
    const onConnect = vi.fn().mockResolvedValue(undefined);
    render(<ApiKeyConnectForm onConnect={onConnect} onCancel={vi.fn()} />);

    // Act
    typeKey("  my-key  ");
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    // Assert
    await waitFor(() => expect(onConnect).toHaveBeenCalledWith("my-key"));
  });

  it("should say the provider rejected the key when it did", async () => {
    // Arrange
    const onConnect = vi
      .fn()
      .mockRejectedValue(new ApiKeyRefusedError("rejected"));
    render(<ApiKeyConnectForm onConnect={onConnect} onCancel={vi.fn()} />);

    // Act
    typeKey("bad");
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    // Assert
    expect(
      await screen.findByText(
        "The provider did not accept this API key. Check it and try again."
      )
    ).toBeInTheDocument();
  });

  it("should state no cause for an unrecognised failure, never its text", async () => {
    // Arrange
    const onConnect = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch: internal detail"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ApiKeyConnectForm onConnect={onConnect} onCancel={vi.fn()} />);

    // Act
    typeKey("key");
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    // Assert
    expect(
      await screen.findByText("Could not connect. Try again.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/internal detail/)).not.toBeInTheDocument();
  });

  it("should disable Connect until a key is entered", () => {
    // Arrange

    // Act
    render(<ApiKeyConnectForm onConnect={vi.fn()} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();
  });
});
