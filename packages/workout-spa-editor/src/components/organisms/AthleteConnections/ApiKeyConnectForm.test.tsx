import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("should surface the error message when the key is rejected", async () => {
    // Arrange
    const onConnect = vi
      .fn()
      .mockRejectedValue(new Error("The API key was rejected"));
    render(<ApiKeyConnectForm onConnect={onConnect} onCancel={vi.fn()} />);

    // Act
    typeKey("bad");
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    // Assert
    expect(await screen.findByText(/rejected/i)).toBeInTheDocument();
  });

  it("should disable Connect until a key is entered", () => {
    // Arrange

    // Act
    render(<ApiKeyConnectForm onConnect={vi.fn()} onCancel={vi.fn()} />);

    // Assert
    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();
  });
});
