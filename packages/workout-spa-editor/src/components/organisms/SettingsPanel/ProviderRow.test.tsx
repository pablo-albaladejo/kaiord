import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import { fireEvent, renderWithProviders, screen } from "../../../test-utils";
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
    <ProviderRow
      provider={p}
      onReplaceKey={vi.fn()}
      onRename={vi.fn()}
      onRemove={onRemove}
    />
  );
  return onRemove;
};

const openMenu = () =>
  userEvent.click(
    screen.getByRole("button", { name: "More actions for Mine" })
  );

describe("ProviderRow", () => {
  it("should say a provider restored from a backup is missing its key", () => {
    // Arrange
    const restored = provider({ apiKey: "", apiKeyMissing: true });

    // Act
    renderRow(restored);

    // Assert
    expect(screen.getByText("Key missing")).toBeInTheDocument();
  });

  it("should not flag a provider that has its key", () => {
    // Arrange
    const keyed = provider();

    // Act
    renderRow(keyed);

    // Assert
    expect(screen.queryByText("Key missing")).not.toBeInTheDocument();
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
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: "Remove" }));
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
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: "Remove" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Cancel" })
    );

    // Assert
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    [{ keyCheck: "valid" as const }, "Key verified"],
    [{ keyCheck: "unverified" as const }, "Key not checked"],
    [{}, "Key not checked"],
    [{ apiKey: "", apiKeyMissing: true }, "Key missing"],
  ])("should state the key status of %o as %s", (extra, status) => {
    // Arrange
    const p = provider(extra);

    // Act
    renderRow(p);

    // Assert
    expect(screen.getByTestId("key-status")).toHaveTextContent(status);
  });

  it("should keep only replacing the key and the overflow menu in the row", () => {
    // Arrange

    // Act
    renderRow(provider());

    // Assert
    expect(
      screen
        .getAllByRole("button")
        .map((b) => b.textContent || b.getAttribute("aria-label"))
    ).toEqual(["Replace key", "More actions for Mine"]);
  });

  it("should rename from the overflow menu", async () => {
    // Arrange
    const onRename = vi.fn();
    renderWithProviders(
      <ProviderRow
        provider={provider()}
        onReplaceKey={vi.fn()}
        onRename={onRename}
        onRemove={vi.fn()}
      />
    );

    // Act
    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: "Rename" }));

    // Assert
    expect(onRename).toHaveBeenCalledOnce();
  });

  // A press that opened the menu can end over an item when the page moves
  // under the pointer (a scroll still running); that release is not a choice.
  it.each(["Rename", "Remove"])(
    "should not %s on a release that did not start on the item",
    async (item) => {
      // Arrange
      const onRename = vi.fn();
      renderWithProviders(
        <ProviderRow
          provider={provider()}
          onReplaceKey={vi.fn()}
          onRename={onRename}
          onRemove={vi.fn()}
        />
      );
      await openMenu();

      // Act
      fireEvent.pointerUp(screen.getByRole("menuitem", { name: item }));

      // Assert
      expect(onRename).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.getByRole("menuitem", { name: item })).toBeVisible();
    }
  );

  it("should name the provider unless the label already does", () => {
    // Arrange
    const named = provider({ label: "Anthropic 2" });

    // Act
    renderRow(named);

    // Assert
    expect(screen.getAllByText(/Anthropic/)).toHaveLength(1);
  });

  it("should name the provider next to a label of the athlete's own", () => {
    // Arrange

    // Act
    renderRow(provider());

    // Assert
    expect(screen.getByText("Anthropic")).toBeInTheDocument();
  });
});
