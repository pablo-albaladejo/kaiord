/**
 * ProfileManager Component Tests
 *
 * Tests for profile management with redesigned layout.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProfileStore } from "../../../store/profile-store";
import { renderWithProviders } from "../../../test-utils";
import { ProfileManager } from "./ProfileManager";

describe("ProfileManager", () => {
  beforeEach(() => {
    useProfileStore.setState({
      profiles: [],
      activeProfileId: null,
    });
  });

  describe("rendering", () => {
    it("should render when open", () => {
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      expect(
        screen.getByRole("heading", { name: /profile manager/i })
      ).toBeInTheDocument();
    });

    it("should display empty state when no profiles exist", () => {
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText(/no profiles yet/i)).toBeInTheDocument();
    });

    it("should display profile count", () => {
      const { createProfile } = useProfileStore.getState();
      createProfile("Test Profile");

      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText(/saved profiles \(1\)/i)).toBeInTheDocument();
    });

    it("should not show Edit Profile card", () => {
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.queryByText("Edit Profile")).not.toBeInTheDocument();
    });
  });

  describe("profile creation", () => {
    it("should create a new profile with name only", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      await user.type(screen.getByLabelText(/^name$/i), "New Profile");
      await user.click(screen.getByRole("button", { name: /create profile/i }));

      const state = useProfileStore.getState();
      expect(state.profiles).toHaveLength(1);
      expect(state.profiles[0].name).toBe("New Profile");
    });

    it("should disable create button when name is empty", () => {
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      expect(
        screen.getByRole("button", { name: /create profile/i })
      ).toBeDisabled();
    });

    it("should clear form after creating profile", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      await user.type(screen.getByLabelText(/^name$/i), "Test");
      await user.click(screen.getByRole("button", { name: /create profile/i }));

      expect(screen.getByLabelText(/^name$/i)).toHaveValue("");
    });
  });

  describe("profile editing", () => {
    it("should show tabs when editing a profile", async () => {
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Original", { ftp: 200, maxHeartRate: 180 });
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      await user.click(screen.getByRole("button", { name: /^edit$/i }));

      expect(
        screen.getByRole("tab", { name: /training zones/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /personal data/i })
      ).toBeInTheDocument();
    });

    it("should show sport zone editor by default when editing", async () => {
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Athlete", { ftp: 250, maxHeartRate: 180 });
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      await user.click(screen.getByRole("button", { name: /^edit$/i }));

      // Training zones tab is default, so sport tabs should be visible
      expect(screen.getByRole("tab", { name: "Cycling" })).toBeInTheDocument();
    });
  });

  describe("profile deletion", () => {
    it("should show delete confirmation dialog", async () => {
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Profile 1");
      createProfile("Profile 2");
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      const deleteButtons = screen.getAllByRole("button", {
        name: /^delete profile$/i,
      });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /delete profile/i })
        ).toBeInTheDocument();
      });
    });

    it("should delete profile after confirmation", async () => {
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Profile 1");
      createProfile("Profile 2");
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      const deleteButtons = screen.getAllByRole("button", {
        name: /^delete profile$/i,
      });
      await user.click(deleteButtons[0]);

      const deleteButton = await screen.findByRole("button", {
        name: /^delete$/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        const state = useProfileStore.getState();
        expect(state.profiles).toHaveLength(1);
      });
    });

    it("should disable delete button when only one profile exists", () => {
      const { createProfile } = useProfileStore.getState();
      createProfile("Only Profile");

      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      expect(
        screen.getByRole("button", { name: /^delete profile$/i })
      ).toBeDisabled();
    });
  });

  describe("active profile", () => {
    it("should set active profile", async () => {
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Profile 1");
      const profile2 = createProfile("Profile 2");

      useProfileStore.setState({
        activeProfileId: useProfileStore.getState().profiles[0].id,
      });

      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      const setActiveButtons = screen.getAllByRole("button", {
        name: /set active/i,
      });
      await user.click(setActiveButtons[0]);

      const state = useProfileStore.getState();
      expect(state.activeProfileId).toBe(profile2.id);
    });
  });

  describe("profile import", () => {
    it("should have import input element", () => {
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      const input = document.getElementById(
        "import-profile"
      ) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "file");
      expect(input).toHaveAttribute("accept", ".json");
    });

    it("should show import button", () => {
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText(/import profile/i)).toBeInTheDocument();
    });
  });
});
