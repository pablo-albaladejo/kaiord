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

const PROFILE_ID = "00000000-0000-4000-8000-0000000000a1";

describe("ProfileEditView", () => {
  it("should forward a Personal Data edit to the persisting onChange", async () => {
    // Arrange
    const onChange = vi.fn();
    const formData: ProfileFormData = { name: "Athlete", bodyWeight: 70 };
    renderWithProviders(
      <ProfileEditView
        profileId={PROFILE_ID}
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

  // Zones have one editor, on /athlete/zones/:sport (audit P-01).
  it("should open on Personal Data without a Training Zones tab", () => {
    // Arrange
    // Act
    renderWithProviders(
      <ProfileEditView
        profileId={PROFILE_ID}
        formData={{ name: "Athlete" }}
        onChange={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert
    const tabs = screen.getAllByRole("tab").map((tab) => tab.textContent);
    expect(tabs).toEqual(["Personal Data", "Linked Accounts"]);
    expect(screen.getByRole("tab", { name: "Personal Data" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
