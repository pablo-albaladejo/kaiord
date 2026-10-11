import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { renderWithProviders, screen } from "../../../test-utils";
import { ProviderRow } from "./ProviderRow";

const provider = (extra: Partial<LlmProviderConfig> = {}) => ({
  id: "ai-1",
  type: "anthropic" as const,
  apiKey: "sk-key",
  label: "Mine",
  isDefault: false,
  createdAt: 1,
  ...extra,
});

const renderRow = (p: LlmProviderConfig) =>
  renderWithProviders(
    <ProviderRow
      provider={p}
      onEdit={vi.fn()}
      onRemove={vi.fn()}
      onSetDefault={vi.fn()}
    />
  );

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
});
