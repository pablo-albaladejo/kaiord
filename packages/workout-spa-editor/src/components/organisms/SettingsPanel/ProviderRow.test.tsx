import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { renderWithProviders, screen } from "../../../test-utils";
import { ProviderRow } from "./ProviderRow";

const provider = (extra: Partial<LlmProviderConfig> = {}) => ({
  id: "ai-1",
  type: "anthropic" as const,
  apiKey: "sk-ant-secret-abcd",
  label: "Mine",
  isDefault: true,
  createdAt: 1,
  ...extra,
});

const renderRow = (p: LlmProviderConfig, onRemove = vi.fn()) => {
  renderWithProviders(
    <ProviderRow provider={p} onEdit={vi.fn()} onRemove={onRemove} />
  );
  return onRemove;
};

describe("ProviderRow", () => {
  it("should say a provider restored from a backup is missing its key", () => {
    // Arrange
    const restored = provider({ apiKey: "", apiKeyMissing: true });

    // Act
    renderRow(restored);

    // Assert
    expect(screen.getByText("Missing key")).toBeInTheDocument();
  });

  it("should not flag a provider that has its key", () => {
    // Arrange
    const keyed = provider();

    // Act
    renderRow(keyed);

    // Assert
    expect(screen.queryByText("Missing key")).not.toBeInTheDocument();
  });

  it("should show only the last four characters of the key", () => {
    // Arrange
    const keyed = provider();

    // Act
    renderRow(keyed);

    // Assert
    expect(screen.getByText("••••abcd")).toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("sk-ant-secret");
  });

  it.each(["abcd", "xyz"])(
    "should show only the mask when the whole key is %s",
    (apiKey) => {
      // Arrange
      const shortKey = provider({ apiKey });

      // Act
      renderRow(shortKey);

      // Assert
      expect(screen.getByText("••••")).toBeInTheDocument();
      expect(document.body.innerHTML).not.toContain(apiKey);
    }
  );

  it("should offer no provider-level default, which the main model replaces", () => {
    // Arrange
    const flagged = provider({ isDefault: true });

    // Act
    renderRow(flagged);

    // Assert
    expect(screen.queryByText("Default")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /set default/i })
    ).not.toBeInTheDocument();
  });

  it("should remove only after the removal is confirmed", async () => {
    // Arrange
    const onRemove = renderRow(provider());

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    const dialog = await screen.findByRole("dialog");
    const notYet = onRemove.mock.calls.length;
    await userEvent.click(
      screen.getAllByRole("button", { name: "Remove" }).at(-1)!
    );

    // Assert
    expect(dialog).toHaveTextContent("Mine");
    expect(notYet).toBe(0);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("should keep the provider when the removal is cancelled", async () => {
    // Arrange
    const onRemove = renderRow(provider());

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Cancel" })
    );

    // Assert
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
