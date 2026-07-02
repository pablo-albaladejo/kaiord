import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HelpSection } from "./HelpSection";

describe("HelpSection", () => {
  describe("rendering", () => {
    it("should render the main heading", () => {
      // Arrange

      // Act
      render(<HelpSection />);

      // Assert

      expect(
        screen.getByRole("heading", { name: /help & documentation/i })
      ).toBeInTheDocument();
    });

    it("should render all major sections", () => {
      // Arrange

      // Act
      render(<HelpSection />);

      // Assert

      expect(
        screen.getByRole("heading", { name: /getting started/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /keyboard shortcuts/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /example workouts/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /frequently asked questions/i })
      ).toBeInTheDocument();
    });
  });

  describe("getting started section", () => {
    it.each([
      {
        heading: /creating a workout/i,
        body: /click "create new workout" on the welcome screen/i,
      },
      {
        heading: /loading a workout/i,
        body: /supported formats: krd, fit, tcx, zwo/i,
      },
      {
        heading: /organizing steps/i,
        body: /drag and drop steps to reorder them/i,
      },
    ])("should display $heading instructions", ({ heading, body }) => {
      // Arrange

      // Act
      render(<HelpSection />);

      // Assert

      expect(
        screen.getByRole("heading", { name: heading })
      ).toBeInTheDocument();
      expect(screen.getByText(body)).toBeInTheDocument();
    });
  });

  describe("keyboard shortcuts section", () => {
    it("should display file operation shortcuts", () => {
      // Arrange

      // Act
      render(<HelpSection />);

      // Assert

      expect(
        screen.getByRole("heading", { name: /file operations/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/save workout/i).length).toBeGreaterThan(0);
    });

    it("should display edit operation shortcuts", () => {
      // Arrange

      // Act
      render(<HelpSection />);

      // Assert

      expect(
        screen.getByRole("heading", { name: /edit operations/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/undo/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/redo/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/copy selected steps/i)).toBeInTheDocument();
      expect(screen.getByText(/paste steps/i)).toBeInTheDocument();
    });

    it("should display step management shortcuts", () => {
      // Arrange

      // Act
      render(<HelpSection />);

      // Assert

      expect(
        screen.getByRole("heading", { name: /step management/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/move step up/i)).toBeInTheDocument();
      expect(screen.getByText(/move step down/i)).toBeInTheDocument();
      expect(
        screen.getAllByText(/create repetition block/i).length
      ).toBeGreaterThan(0);
      expect(screen.getAllByText(/ungroup block/i).length).toBeGreaterThan(0);
    });

    it("should display selection shortcuts", () => {
      // Arrange

      // Act
      render(<HelpSection />);

      // Assert

      expect(
        screen.getByRole("heading", { name: /^selection$/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/select all steps/i)).toBeInTheDocument();
      expect(screen.getByText(/clear selection/i)).toBeInTheDocument();
    });

    it("should display keyboard shortcut keys", () => {
      // Arrange
      const { container } = render(<HelpSection />);

      // Act
      const kbdElements = container.querySelectorAll("kbd");

      // Assert
      expect(kbdElements.length).toBeGreaterThan(0);
    });
  });

  describe("example workouts section", () => {
    it.each([
      {
        heading: /sweet spot intervals/i,
        body: /classic sweet spot training/i,
      },
      {
        heading: /tempo run/i,
        body: /sustained tempo effort/i,
      },
      {
        heading: /swim intervals/i,
        body: /high-intensity intervals/i,
      },
    ])("should display $heading example", ({ heading, body }) => {
      // Arrange

      // Act
      render(<HelpSection />);

      // Assert

      expect(
        screen.getByRole("heading", { name: heading })
      ).toBeInTheDocument();
      expect(screen.getByText(body)).toBeInTheDocument();
    });
  });

  describe("FAQ section", () => {
    it.each([
      {
        heading: /what file formats are supported/i,
        body: /the editor supports krd/i,
      },
      {
        heading: /how do i create a repetition block/i,
        body: /select multiple steps by clicking/i,
      },
      {
        heading: /can i use this offline/i,
        body: /yes! the editor works offline/i,
      },
      {
        heading: /what are training zones/i,
        body: /training zones are intensity ranges/i,
      },
      {
        heading: /how do i export my workout/i,
        body: /click the 'save' button and select/i,
      },
      {
        heading: /can i undo changes/i,
        body: /yes! use ctrl\+z/i,
      },
      {
        heading: /what's the difference between duration types/i,
        body: /time-based durations use minutes\/seconds/i,
      },
      {
        heading: /how do i save workouts to my library/i,
        body: /click the 'save to library' button/i,
      },
    ])("should display FAQ: $heading", ({ heading, body }) => {
      // Arrange

      // Act
      render(<HelpSection />);

      // Assert

      expect(
        screen.getByRole("heading", { name: heading })
      ).toBeInTheDocument();
      expect(screen.getByText(body)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper heading hierarchy", () => {
      // Arrange
      render(<HelpSection />);

      // Act
      const h1 = screen.getByRole("heading", {
        level: 1,
        name: /help & documentation/i,
      });
      const h2Headings = screen.getAllByRole("heading", { level: 2 });
      const h3Headings = screen.getAllByRole("heading", { level: 3 });

      // Assert
      expect(h1).toBeInTheDocument();
      expect(h2Headings.length).toBeGreaterThan(0);
      expect(h3Headings.length).toBeGreaterThan(0);
    });

    it("should have descriptive text for all sections", () => {
      // Arrange

      // Act
      render(<HelpSection />);

      // Assert

      expect(
        screen.getByText(
          /learn how to use the kaiord editor to create and manage/i
        )
      ).toBeInTheDocument();
    });
  });

  describe("replay tutorial (Requirements 37.5)", () => {
    it("should render replay tutorial button when onReplayTutorial is provided", () => {
      // Arrange
      const mockOnReplayTutorial = vi.fn();

      // Act
      render(<HelpSection onReplayTutorial={mockOnReplayTutorial} />);

      // Assert
      expect(
        screen.getByRole("button", { name: /replay tutorial/i })
      ).toBeInTheDocument();
    });

    it("should not render replay tutorial button when onReplayTutorial is not provided", () => {
      // Arrange

      // Act
      render(<HelpSection />);

      // Assert

      expect(
        screen.queryByRole("button", { name: /replay tutorial/i })
      ).not.toBeInTheDocument();
    });

    it("should call onReplayTutorial when replay button is clicked", async () => {
      // Arrange
      const mockOnReplayTutorial = vi.fn();
      const user = userEvent.setup();
      render(<HelpSection onReplayTutorial={mockOnReplayTutorial} />);

      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      };
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
      });

      // Act
      const replayButton = screen.getByRole("button", {
        name: /replay tutorial/i,
      });
      await user.click(replayButton);

      // Assert
      expect(mockOnReplayTutorial).toHaveBeenCalledOnce();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "workout-spa-onboarding-completed"
      );
    });
  });
});
