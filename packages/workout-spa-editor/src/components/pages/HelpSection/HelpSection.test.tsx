import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HelpSection } from "./HelpSection";

describe("HelpSection", () => {
  describe("rendering", () => {
    it("should render the main heading", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /help & documentation/i })
      ).toBeInTheDocument();
    });

    it("should render all major sections", () => {
      // Arrange & Act
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
    it("should display creating a workout instructions", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /creating a workout/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/click "create new workout" on the welcome screen/i)
      ).toBeInTheDocument();
    });

    it("should display loading a workout instructions", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /loading a workout/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/supported formats: krd, fit, tcx, zwo/i)
      ).toBeInTheDocument();
    });

    it("should display organizing steps instructions", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /organizing steps/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/drag and drop steps to reorder them/i)
      ).toBeInTheDocument();
    });
  });

  describe("keyboard shortcuts section", () => {
    it("should display file operation shortcuts", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /file operations/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/save workout/i).length).toBeGreaterThan(0);
    });

    it("should display edit operation shortcuts", () => {
      // Arrange & Act
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
      // Arrange & Act
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
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /^selection$/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/select all steps/i)).toBeInTheDocument();
      expect(screen.getByText(/clear selection/i)).toBeInTheDocument();
    });

    it("should display keyboard shortcut keys", () => {
      // Arrange & Act
      const { container } = render(<HelpSection />);

      // Assert
      const kbdElements = container.querySelectorAll("kbd");
      expect(kbdElements.length).toBeGreaterThan(0);
    });
  });

  describe("example workouts section", () => {
    it("should display sweet spot intervals example", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /sweet spot intervals/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/cycling/i).length).toBeGreaterThan(0);
      expect(
        screen.getByText(/classic sweet spot training/i)
      ).toBeInTheDocument();
    });

    it("should display tempo run example", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /tempo run/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/running/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/sustained tempo effort/i)).toBeInTheDocument();
    });

    it("should display swim intervals example", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /swim intervals/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText(/swimming/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/high-intensity intervals/i)).toBeInTheDocument();
    });
  });

  describe("FAQ section", () => {
    it("should display file formats question", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", {
          name: /what file formats are supported/i,
        })
      ).toBeInTheDocument();
      expect(screen.getByText(/the editor supports krd/i)).toBeInTheDocument();
    });

    it("should display repetition block question", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", {
          name: /how do i create a repetition block/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/select multiple steps by clicking/i)
      ).toBeInTheDocument();
    });

    it("should display offline usage question", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /can i use this offline/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/yes! the editor works offline/i)
      ).toBeInTheDocument();
    });

    it("should display training zones question", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /what are training zones/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/training zones are intensity ranges/i)
      ).toBeInTheDocument();
    });

    it("should display export question", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /how do i export my workout/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/click the 'save' button and select/i)
      ).toBeInTheDocument();
    });

    it("should display undo question", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", { name: /can i undo changes/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/yes! use ctrl\+z/i)).toBeInTheDocument();
    });

    it("should display duration types question", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", {
          name: /what's the difference between duration types/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/time-based durations use minutes\/seconds/i)
      ).toBeInTheDocument();
    });

    it("should display library question", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByRole("heading", {
          name: /how do i save workouts to my library/i,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/click the 'save to library' button/i)
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper heading hierarchy", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      const h1 = screen.getByRole("heading", {
        level: 1,
        name: /help & documentation/i,
      });
      const h2Headings = screen.getAllByRole("heading", { level: 2 });
      const h3Headings = screen.getAllByRole("heading", { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2Headings.length).toBeGreaterThan(0);
      expect(h3Headings.length).toBeGreaterThan(0);
    });

    it("should have descriptive text for all sections", () => {
      // Arrange & Act
      render(<HelpSection />);

      // Assert
      expect(
        screen.getByText(
          /learn how to use the workout editor to create and manage/i
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
      // Arrange & Act
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
