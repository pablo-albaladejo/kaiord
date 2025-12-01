/**
 * ProfileManager Component Tests
 *
 * Tests for profile management functionality including create, edit, delete,
 * import, export operations, and profile switching.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProfileStore } from "../../../store/profile-store";
import { renderWithProviders } from "../../../test-utils";
import { ProfileManager } from "./ProfileManager";

describe("ProfileManager", () => {
  // Reset store state before each test
  beforeEach(() => {
    useProfileStore.setState({
      profiles: [],
      activeProfileId: null,
    });
  });

  describe("rendering", () => {
    it("should render when open", () => {
      // Arrange & Act
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Assert
      expect(
        screen.getByRole("heading", { name: /profile manager/i })
      ).toBeInTheDocument();
    });

    it("should display empty state when no profiles exist", () => {
      // Arrange & Act
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Assert
      expect(screen.getByText(/no profiles yet/i)).toBeInTheDocument();
    });

    it("should display profile count", () => {
      // Arrange
      const { createProfile } = useProfileStore.getState();
      createProfile("Test Profile");

      // Act
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Assert
      expect(screen.getByText(/saved profiles \(1\)/i)).toBeInTheDocument();
    });
  });

  describe("profile creation", () => {
    it("should create a new profile with name only", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.type(screen.getByLabelText(/^name$/i), "New Profile");
      await user.click(screen.getByRole("button", { name: /create profile/i }));

      // Assert
      const state = useProfileStore.getState();
      expect(state.profiles).toHaveLength(1);
      expect(state.profiles[0].name).toBe("New Profile");
    });

    it("should create a profile with all fields", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.type(screen.getByLabelText(/^name$/i), "Complete Profile");
      await user.type(screen.getByLabelText(/body weight/i), "70");
      await user.type(screen.getByLabelText(/ftp/i), "250");
      await user.type(screen.getByLabelText(/max hr/i), "190");
      await user.click(screen.getByRole("button", { name: /create profile/i }));

      // Assert
      const state = useProfileStore.getState();
      expect(state.profiles[0]).toMatchObject({
        name: "Complete Profile",
        bodyWeight: 70,
        ftp: 250,
        maxHeartRate: 190,
      });
    });

    it("should disable create button when name is empty", () => {
      // Arrange & Act
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Assert
      expect(
        screen.getByRole("button", { name: /create profile/i })
      ).toBeDisabled();
    });

    it("should clear form after creating profile", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.type(screen.getByLabelText(/^name$/i), "Test");
      await user.click(screen.getByRole("button", { name: /create profile/i }));

      // Assert
      expect(screen.getByLabelText(/^name$/i)).toHaveValue("");
    });
  });

  describe("profile editing", () => {
    it("should populate form when editing profile", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Original", {
        ftp: 200,
        maxHeartRate: 180,
      });
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /^edit$/i }));

      // Assert
      expect(screen.getByLabelText(/^name$/i)).toHaveValue("Original");
      expect(screen.getByLabelText(/ftp/i)).toHaveValue(200);
      expect(screen.getByLabelText(/max hr/i)).toHaveValue(180);
    });

    it("should save edited profile", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Original");
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /^edit$/i }));
      await user.clear(screen.getByLabelText(/^name$/i));
      await user.type(screen.getByLabelText(/^name$/i), "Updated");
      await user.click(screen.getByRole("button", { name: /save changes/i }));

      // Assert
      const state = useProfileStore.getState();
      expect(state.profiles[0].name).toBe("Updated");
    });

    it("should cancel editing profile", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Original");
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /^edit$/i }));
      await user.clear(screen.getByLabelText(/^name$/i));
      await user.type(screen.getByLabelText(/^name$/i), "Changed");
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Assert
      const state = useProfileStore.getState();
      expect(state.profiles[0].name).toBe("Original");
      expect(screen.getByLabelText(/^name$/i)).toHaveValue("");
    });
  });

  describe("profile deletion", () => {
    it("should show delete confirmation dialog", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Profile 1");
      createProfile("Profile 2");
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      const deleteButtons = screen.getAllByRole("button", {
        name: /^delete profile$/i,
      });
      await user.click(deleteButtons[0]);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /delete profile/i })
        ).toBeInTheDocument();
      });
    });

    it("should delete profile after confirmation", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Profile 1");
      createProfile("Profile 2");
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      const deleteButtons = screen.getAllByRole("button", {
        name: /^delete profile$/i,
      });
      await user.click(deleteButtons[0]);

      // Wait for confirmation dialog
      const deleteButton = await screen.findByRole("button", {
        name: /^delete$/i,
      });
      await user.click(deleteButton);

      // Assert
      await waitFor(() => {
        const state = useProfileStore.getState();
        expect(state.profiles).toHaveLength(1);
        expect(
          state.profiles.find((p) => p.id === "profile1.id")
        ).toBeUndefined();
      });
    });

    it("should disable delete button when only one profile exists", () => {
      // Arrange
      const { createProfile } = useProfileStore.getState();
      createProfile("Only Profile");

      // Act
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Assert
      expect(
        screen.getByRole("button", { name: /^delete profile$/i })
      ).toBeDisabled();
    });
  });

  describe("active profile", () => {
    it("should set active profile", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Profile 1");
      const profile2 = createProfile("Profile 2");

      // Set first profile as active
      useProfileStore.setState({
        activeProfileId: useProfileStore.getState().profiles[0].id,
      });

      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act - Click "Set Active" on the second profile
      const setActiveButtons = screen.getAllByRole("button", {
        name: /set active/i,
      });
      await user.click(setActiveButtons[0]);

      // Assert
      const state = useProfileStore.getState();
      expect(state.activeProfileId).toBe(profile2.id);
    });

    it("should not show set active button for active profile", () => {
      // Arrange
      const { createProfile } = useProfileStore.getState();
      const profile = createProfile("Profile");
      useProfileStore.setState({ activeProfileId: profile.id });

      // Act
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Assert
      expect(
        screen.queryByRole("button", { name: /set active/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("profile switching notification", () => {
    it("should show notification when switching profiles", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      const profile1 = createProfile("Profile 1");
      const profile2 = createProfile("Profile 2");

      // Set first profile as active
      useProfileStore.setState({ activeProfileId: profile1.id });

      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act - Click "Set Active" on Profile 2
      const setActiveButtons = screen.getAllByRole("button", {
        name: /set active/i,
      });
      await user.click(setActiveButtons[0]);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/switched to profile: profile 2/i)
        ).toBeInTheDocument();
      });
    });

    it("should display active profile name in notification", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      const profile1 = createProfile("Default Profile");
      const profile2 = createProfile("My Training Profile");

      // Set first profile as active
      useProfileStore.setState({ activeProfileId: profile1.id });

      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act - Click "Set Active" on "My Training Profile"
      const setActiveButtons = screen.getAllByRole("button", {
        name: /set active/i,
      });
      await user.click(setActiveButtons[0]);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/switched to profile: my training profile/i)
        ).toBeInTheDocument();
      });
    });

    // TODO: Add test for notification timeout behavior
    // The notification auto-hide feature needs to be implemented first

    // TODO: Add test for accessibility attributes
    // Need to add role="status" and aria-live="polite" to notification component
  });

  describe("profile import", () => {
    it("should have import input element", () => {
      // Arrange
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Assert
      const input = document.getElementById(
        "import-profile"
      ) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "file");
      expect(input).toHaveAttribute("accept", ".json");
    });

    it("should show import button", () => {
      // Arrange
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Assert
      expect(screen.getByText(/import profile/i)).toBeInTheDocument();
    });
  });

  // TODO: Add tests for profile export functionality
  // Export button and URL.createObjectURL need to be properly implemented

  // TODO: Add test for dialog close button
  // Need to verify close button exists and triggers onOpenChange
});
