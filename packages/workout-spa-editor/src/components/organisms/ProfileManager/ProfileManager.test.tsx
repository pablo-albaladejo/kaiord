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
import type { Profile } from "../../../types/profile";
import {
  DEFAULT_HEART_RATE_ZONES,
  DEFAULT_POWER_ZONES,
} from "../../../types/profile";
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
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /delete profile/i })
        ).toBeInTheDocument();
      });
      const confirmButtons = screen.getAllByRole("button", {
        name: /^delete$/i,
      });
      await user.click(confirmButtons[1]);

      // Assert
      const state = useProfileStore.getState();
      expect(state.profiles).toHaveLength(1);
      expect(
        state.profiles.find((p) => p.id === "profile1.id")
      ).toBeUndefined();
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
      const profile = createProfile("Profile");
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /set active/i }));

      // Assert
      const state = useProfileStore.getState();
      expect(state.activeProfileId).toBe(profile.id);
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
      createProfile("Profile 1");
      const profile2 = createProfile("Profile 2");
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /set active/i }));

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/switched to profile: profile 1/i)
        ).toBeInTheDocument();
      });
    });

    it("should display active profile name in notification", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("My Training Profile");
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /set active/i }));

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/switched to profile: my training profile/i)
        ).toBeInTheDocument();
      });
    });

    it("should hide notification after timeout", async () => {
      // Arrange
      vi.useFakeTimers();
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Profile 1");
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /set active/i }));

      // Assert - notification appears
      await waitFor(() => {
        expect(
          screen.getByText(/switched to profile: profile 1/i)
        ).toBeInTheDocument();
      });

      // Act - advance timers
      vi.advanceTimersByTime(3000);

      // Assert - notification disappears
      await waitFor(() => {
        expect(
          screen.queryByText(/switched to profile: profile 1/i)
        ).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it("should have proper accessibility attributes", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Profile 1");
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /set active/i }));

      // Assert
      await waitFor(() => {
        const notification = screen.getByRole("status");
        expect(notification).toHaveAttribute("aria-live", "polite");
        expect(notification).toHaveTextContent(
          /switched to profile: profile 1/i
        );
      });
    });
  });

  describe("profile export", () => {
    it("should trigger export when button clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const { createProfile } = useProfileStore.getState();
      createProfile("Export Test", {
        ftp: 300,
        maxHeartRate: 195,
      });

      // Mock URL methods
      const mockClick = vi.fn();
      const link = {
        click: mockClick,
      } as unknown as HTMLAnchorElement;
      vi.spyOn(document, "createElement").mockImplementation((tag) => {
        if (tag === "a") {
          return link;
        }
        return document.createElement(tag);
      });
      global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      global.URL.revokeObjectURL = vi.fn();

      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /export profile/i }));

      // Assert
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe("profile import", () => {
    it("should import valid profile", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      const validProfile: Profile = {
        id: crypto.randomUUID(),
        name: "Imported Profile",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        powerZones: DEFAULT_POWER_ZONES,
        heartRateZones: DEFAULT_HEART_RATE_ZONES,
        ftp: 300,
        maxHeartRate: 195,
      };

      const file = new File([JSON.stringify(validProfile)], "profile.json", {
        type: "application/json",
      });

      // Act
      const input = document.getElementById(
        "import-profile"
      ) as HTMLInputElement;
      await user.upload(input, file);

      // Assert
      await waitFor(() => {
        const state = useProfileStore.getState();
        expect(state.profiles).toHaveLength(1);
        expect(state.profiles[0].name).toBe("Imported Profile");
      });
    });

    it("should show error for invalid profile", async () => {
      // Arrange
      const user = userEvent.setup();
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={vi.fn()} />
      );

      const invalidProfile = {
        name: "Invalid",
        // Missing required fields
      };

      const file = new File([JSON.stringify(invalidProfile)], "invalid.json", {
        type: "application/json",
      });

      // Act
      const input = document.getElementById(
        "import-profile"
      ) as HTMLInputElement;
      await user.upload(input, file);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/import failed/i)).toBeInTheDocument();
      });
    });
  });

  describe("dialog controls", () => {
    it("should call onOpenChange when close button clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const handleOpenChange = vi.fn();
      renderWithProviders(
        <ProfileManager open={true} onOpenChange={handleOpenChange} />
      );

      // Act
      await user.click(screen.getByRole("button", { name: /close/i }));

      // Assert
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
