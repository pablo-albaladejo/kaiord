/**
 * ProfileEditView wiring test.
 *
 * Regression guard for the auto-save follow-up: a Personal Data edit MUST reach
 * the persisting `onChange` (ProfileManagerDialog auto-saves it). The tab was
 * previously wired to a state-only setter, so physiology edits never persisted.
 */

import { describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen, userEvent } from "../../../../test-utils";
import type { ProfileFormData } from "../types";
import { ProfileEditView } from "./ProfileEditView";

describe("ProfileEditView", () => {
  it("should forward a Personal Data edit to the persisting onChange", async () => {
    // Arrange
    const onChange = vi.fn();
    const formData: ProfileFormData = { name: "Athlete", bodyWeight: 70 };
    renderWithProviders(
      <ProfileEditView
        formData={formData}
        onChange={onChange}
        onCancel={vi.fn()}
      />
    );

    // Act
    await userEvent.click(screen.getByRole("tab", { name: "Personal Data" }));
    await userEvent.selectOptions(
      screen.getByLabelText("Activity Level"),
      "moderate"
    );

    // Assert
    expect(onChange).toHaveBeenLastCalledWith({
      ...formData,
      activityLevel: "moderate",
    });
  });

  // Zones have one editor, on /athlete/zones/:sport (audit P-01), and
  // external accounts have one home, Connections (audit P-14).
  it("should open on Personal Data as its only tab", () => {
    // Arrange

    // Act
    renderWithProviders(
      <ProfileEditView
        formData={{ name: "Athlete" }}
        onChange={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert
    const tabs = screen.getAllByRole("tab").map((tab) => tab.textContent);
    expect(tabs).toEqual(["Personal Data"]);
    expect(screen.getByRole("tab", { name: "Personal Data" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
