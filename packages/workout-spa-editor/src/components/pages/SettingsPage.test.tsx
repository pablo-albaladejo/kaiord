import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { useFeatureFlag } from "../../lib/feature-flags";
import SettingsPage from "./SettingsPage";

function renderAtPath(path: string) {
  const { hook } = memoryLocation({ path, record: true });
  return render(
    <Router hook={hook}>
      <SettingsPage />
    </Router>
  );
}

describe("SettingsPage", () => {
  describe("flag off (default)", () => {
    it("should not render the page stub when ux2026.unifiedSettings is false", () => {
      // Arrange

      // Act

      const enabled = useFeatureFlag("ux2026.unifiedSettings");
      const { queryByTestId } = renderAtPath("/settings/profile");

      // Assert

      expect(enabled).toBe(false);
      expect(queryByTestId("settings-page")).toBeNull();
    });
  });

  describe("redirect", () => {
    it("should render nothing for an unknown tab when the flag is off", () => {
      // Arrange

      // Act

      renderAtPath("/settings/unknown");

      // Assert

      expect(screen.queryByTestId("settings-page")).toBeNull();
    });
  });
});
