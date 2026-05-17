import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import type * as FeatureFlagsModule from "../../lib/feature-flags";
import SettingsPage from "./SettingsPage";

vi.mock("../../lib/feature-flags", async () => {
  const actual = await vi.importActual<typeof FeatureFlagsModule>(
    "../../lib/feature-flags"
  );
  return {
    ...actual,
    useFeatureFlag: vi.fn(),
  };
});

const { useFeatureFlag } = await import("../../lib/feature-flags");
const mockUseFeatureFlag = vi.mocked(useFeatureFlag);

function renderAtPath(path: string) {
  const memory = memoryLocation({ path, record: true });
  const view = render(
    <Router hook={memory.hook}>
      <Route path="/settings/:tab?">
        <SettingsPage />
      </Route>
    </Router>
  );
  return { ...view, memory };
}

describe("SettingsPage", () => {
  beforeEach(() => {
    mockUseFeatureFlag.mockReset();
  });

  describe("flag off", () => {
    it("should not render the stub when ux2026.unifiedSettings is false", () => {
      // Arrange
      mockUseFeatureFlag.mockReturnValue(false);

      // Act
      const { queryByTestId } = renderAtPath("/settings/profile");

      // Assert
      expect(queryByTestId("settings-page")).toBeNull();
    });

    it("should render nothing for an unknown tab when the flag is off", () => {
      // Arrange
      mockUseFeatureFlag.mockReturnValue(false);

      // Act
      renderAtPath("/settings/unknown");

      // Assert
      expect(screen.queryByTestId("settings-page")).toBeNull();
    });
  });

  describe("flag on, valid tab", () => {
    it("should render the stub with the tab name when flag is on", () => {
      // Arrange
      mockUseFeatureFlag.mockReturnValue(true);

      // Act
      renderAtPath("/settings/zones");

      // Assert
      expect(screen.getByTestId("settings-page")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Settings · zones"
      );
      expect(screen.getByTestId("settings-page-stub-note")).toBeInTheDocument();
    });

    it.each([
      ["profile"],
      ["zones"],
      ["connections"],
      ["ai"],
      ["appearance"],
      ["privacy"],
    ])("should render the heading for tab '%s'", (tab) => {
      // Arrange
      mockUseFeatureFlag.mockReturnValue(true);

      // Act
      renderAtPath(`/settings/${tab}`);

      // Assert
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        `Settings · ${tab}`
      );
    });
  });

  describe("flag on, missing tab", () => {
    it("should redirect to /settings/profile when the tab segment is absent", () => {
      // Arrange
      mockUseFeatureFlag.mockReturnValue(true);

      // Act
      const { memory } = renderAtPath("/settings");

      // Assert
      expect(memory.history).toContain("/settings/profile");
    });
  });

  describe("flag on, invalid tab", () => {
    it("should render nothing and not redirect when the tab is unknown", () => {
      // Arrange
      mockUseFeatureFlag.mockReturnValue(true);

      // Act
      const { memory } = renderAtPath("/settings/unknown");

      // Assert
      expect(screen.queryByTestId("settings-page")).toBeNull();
      expect(memory.history).not.toContain("/settings/profile");
    });
  });
});
