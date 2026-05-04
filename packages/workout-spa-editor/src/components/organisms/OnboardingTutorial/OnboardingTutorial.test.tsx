/**
 * OnboardingTutorial Component Tests
 *
 * Tests for the onboarding tutorial component including:
 * - Rendering with different steps
 * - Navigation between steps
 * - Skip and complete functionality
 * - localStorage persistence
 * - Element highlighting
 */

import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen, userEvent } from "../../../test-utils";
import {
  hasCompletedOnboarding,
  OnboardingTutorial,
  resetOnboarding,
  type TutorialStep,
} from "./OnboardingTutorial";

// ============================================
// Test Data
// ============================================

const mockSteps: Array<TutorialStep> = [
  {
    title: "Welcome",
    description: "Welcome to the Workout SPA Editor!",
    position: "center",
  },
  {
    title: "Create Workout",
    description: "Click here to create a new workout",
    targetSelector: "#create-button",
    position: "bottom",
  },
  {
    title: "Add Steps",
    description: "Add workout steps using this button",
    targetSelector: "#add-step-button",
    position: "right",
  },
];

// ============================================
// Setup & Teardown
// ============================================

describe("OnboardingTutorial", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ============================================
  // Rendering Tests
  // ============================================

  describe("rendering", () => {
    it("should render when open is true", () => {
      // Arrange & Act
      // Arrange

      // Act

      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Assert

      // Assert

      expect(screen.getByText("Welcome")).toBeInTheDocument();
      expect(
        screen.getByText("Welcome to the Workout SPA Editor!")
      ).toBeInTheDocument();
    });

    it("should not render when open is false", () => {
      // Arrange & Act
      // Arrange

      // Act

      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={false}
          onOpenChange={vi.fn()}
        />
      );

      // Assert

      // Assert

      expect(screen.queryByText("Welcome")).not.toBeInTheDocument();
    });

    it("should display first step by default", () => {
      // Arrange & Act
      // Arrange

      // Act

      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Assert

      // Assert

      expect(screen.getByText("Welcome")).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });

    it("should display progress bar", () => {
      // Arrange & Act
      // Arrange

      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Assert

      // Act

      const progressBar = screen.getByRole("progressbar");

      // Assert

      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute("aria-valuenow", "1");
      expect(progressBar).toHaveAttribute("aria-valuemax", "3");
    });

    it("should display skip button", () => {
      // Arrange & Act
      // Arrange

      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Assert - There are two skip buttons (X icon and Skip text button)

      // Act

      const skipButtons = screen.getAllByRole("button", { name: /skip/i });

      // Assert

      expect(skipButtons.length).toBeGreaterThanOrEqual(1);
    });

    it("should display close button", () => {
      // Arrange & Act
      // Arrange

      // Act

      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Assert

      // Assert

      expect(screen.getByLabelText("Skip tutorial")).toBeInTheDocument();
    });
  });

  // ============================================
  // Navigation Tests
  // ============================================

  describe("navigation", () => {
    it("should navigate to next step when next button is clicked", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Act

      // Act

      await user.click(screen.getByRole("button", { name: /next/i }));

      // Assert

      // Assert

      expect(screen.getByText("Create Workout")).toBeInTheDocument();
      expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    });

    it("should navigate to previous step when previous button is clicked", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Navigate to second step
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Act
      const prevButtons = screen.getAllByRole("button");
      const prevButton = prevButtons.find((btn) => btn.querySelector("svg")); // Button with ChevronLeft icon

      // Act

      await user.click(prevButton!);

      // Assert

      // Assert

      expect(screen.getByText("Welcome")).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });

    it("should disable previous button on first step", () => {
      // Arrange & Act
      // Arrange

      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Assert - Previous button exists but is disabled
      const buttons = screen.getAllByRole("button");

      // Act

      const prevButton = buttons.find(
        (btn) => btn.querySelector("svg") && btn.disabled
      );

      // Assert

      expect(prevButton).toBeDefined();
    });

    it("should show complete button on last step", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Act - Navigate to last step
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Act

      await user.click(screen.getByRole("button", { name: /next/i }));

      // Assert

      // Assert

      expect(
        screen.getByRole("button", { name: /finish/i })
      ).toBeInTheDocument();
      expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    });

    it("should update progress bar as user navigates", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Act

      const progressBar = screen.getByRole("progressbar");

      // Assert initial state

      // Assert

      expect(progressBar).toHaveAttribute("aria-valuenow", "1");

      // Act - Navigate to second step
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Assert
      expect(progressBar).toHaveAttribute("aria-valuenow", "2");
    });
  });

  // ============================================
  // Skip & Complete Tests
  // ============================================

  describe("skip and complete", () => {
    it("should call onOpenChange when skip button is clicked", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      // Act

      // Act

      await user.click(screen.getByRole("button", { name: /^skip$/i }));

      // Assert

      // Assert

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onOpenChange when close button is clicked", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      // Act

      // Act

      await user.click(screen.getByLabelText("Skip tutorial"));

      // Assert

      // Assert

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onComplete when complete button is clicked", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const onComplete = vi.fn();
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
          onComplete={onComplete}
        />
      );

      // Navigate to last step
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Act

      // Act

      await user.click(screen.getByRole("button", { name: /finish/i }));

      // Assert

      // Assert

      expect(onComplete).toHaveBeenCalled();
    });

    it("should save completion state to localStorage when skipped", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Act

      // Act

      await user.click(screen.getByRole("button", { name: /^skip$/i }));

      // Assert

      // Assert

      expect(localStorage.getItem("workout-spa-onboarding-completed")).toBe(
        "true"
      );
    });

    it("should save completion state to localStorage when completed", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Navigate to last step
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Act

      // Act

      await user.click(screen.getByRole("button", { name: /finish/i }));

      // Assert

      // Assert

      expect(localStorage.getItem("workout-spa-onboarding-completed")).toBe(
        "true"
      );
    });

    it("should use custom storage key when provided", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const customKey = "custom-onboarding-key";
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
          storageKey={customKey}
        />
      );

      // Act

      // Act

      await user.click(screen.getByRole("button", { name: /^skip$/i }));

      // Assert

      // Assert

      expect(localStorage.getItem(customKey)).toBe("true");
    });

    it("should reset to first step after completion", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { rerender } = renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      // Navigate to last step and complete
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /finish/i }));

      // Act - Reopen tutorial

      // Act

      rerender(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      // Assert

      // Assert

      expect(screen.getByText("Welcome")).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    });
  });

  // ============================================
  // Element Highlighting Tests
  // ============================================

  describe("element highlighting", () => {
    it("should not highlight element when no targetSelector is provided", () => {
      // Arrange
      // Arrange

      const stepsWithoutTarget: Array<TutorialStep> = [
        {
          title: "Welcome",
          description: "Welcome message",
        },
      ];

      // Act
      renderWithProviders(
        <OnboardingTutorial
          steps={stepsWithoutTarget}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Assert - No highlight element with ring should be rendered

      // Act

      const highlight = document.querySelector(".ring-4.ring-primary-500");

      // Assert

      expect(highlight).not.toBeInTheDocument();
    });

    it("should attempt to highlight element when targetSelector is provided", async () => {
      // Arrange
      // Arrange

      const targetElement = document.createElement("button");
      targetElement.id = "create-button";
      document.body.appendChild(targetElement);

      // Act
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Navigate to step with target
      const user = userEvent.setup();

      // Act

      await user.click(screen.getByRole("button", { name: /next/i }));

      // Assert

      // Assert

      await waitFor(() => {
        const highlight = document.querySelector(".ring-4.ring-primary-500");
        expect(highlight).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // Utility Function Tests
  // ============================================

  describe("utility functions", () => {
    describe("hasCompletedOnboarding", () => {
      it("should return false when onboarding not completed", () => {
        // Arrange & Act
        // Arrange

        // Act

        const result = hasCompletedOnboarding();

        // Assert

        // Assert

        expect(result).toBe(false);
      });

      it("should return true when onboarding completed", () => {
        // Arrange
        // Arrange

        localStorage.setItem("workout-spa-onboarding-completed", "true");

        // Act

        // Act

        const result = hasCompletedOnboarding();

        // Assert

        // Assert

        expect(result).toBe(true);
      });

      it("should use custom storage key when provided", () => {
        // Arrange
        // Arrange

        const customKey = "custom-key";
        localStorage.setItem(customKey, "true");

        // Act

        // Act

        const result = hasCompletedOnboarding(customKey);

        // Assert

        // Assert

        expect(result).toBe(true);
      });

      it("should return false on localStorage error", () => {
        // Arrange
        // Arrange

        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
          throw new Error("Storage error");
        });

        // Act

        // Act

        const result = hasCompletedOnboarding();

        // Assert

        // Assert

        expect(result).toBe(false);
      });
    });

    describe("resetOnboarding", () => {
      it("should remove completion state from localStorage", () => {
        // Arrange
        // Arrange

        localStorage.setItem("workout-spa-onboarding-completed", "true");

        // Act

        // Act

        resetOnboarding();

        // Assert

        // Assert

        expect(
          localStorage.getItem("workout-spa-onboarding-completed")
        ).toBeNull();
      });

      it("should use custom storage key when provided", () => {
        // Arrange
        // Arrange

        const customKey = "custom-key";
        localStorage.setItem(customKey, "true");

        // Act

        // Act

        resetOnboarding(customKey);

        // Assert

        // Assert

        expect(localStorage.getItem(customKey)).toBeNull();
      });

      it("should handle localStorage errors gracefully", () => {
        // Arrange
        // Arrange

        const consoleErrorSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
          throw new Error("Storage error");
        });

        // Act

        // Act

        resetOnboarding();

        // Assert

        // Assert

        expect(consoleErrorSpy).toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // Position Tests
  // ============================================

  describe("positioning", () => {
    it("should apply center position by default", () => {
      // Arrange & Act
      // Arrange

      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Assert

      // Act

      const dialog = screen.getByRole("dialog");

      // Assert

      expect(dialog).toHaveClass("left-[50%]");
      expect(dialog).toHaveClass("top-[50%]");
    });

    it("should apply bottom position when specified", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Act - Navigate to step with bottom position
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Assert

      // Act

      const dialog = screen.getByRole("dialog");

      // Assert

      expect(dialog).toHaveClass("bottom-[10%]");
    });

    it("should apply right position when specified", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Act - Navigate to step with right position
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Assert

      // Act

      const dialog = screen.getByRole("dialog");

      // Assert

      expect(dialog).toHaveClass("right-[10%]");
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================

  describe("accessibility", () => {
    it("should have proper ARIA labels", () => {
      // Arrange & Act
      // Arrange

      // Act

      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Assert

      // Assert

      expect(screen.getByLabelText("Skip tutorial")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Tutorial progress: step 1 of 3/)
      ).toBeInTheDocument();
    });

    it("should have proper dialog role", () => {
      // Arrange & Act
      // Arrange

      // Act

      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Assert

      // Assert

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should have describedby attribute", () => {
      // Arrange & Act
      // Arrange

      renderWithProviders(
        <OnboardingTutorial
          steps={mockSteps}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Assert

      // Act

      const dialog = screen.getByRole("dialog");

      // Assert

      expect(dialog).toHaveAttribute("aria-describedby");
      expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    });
  });
});
