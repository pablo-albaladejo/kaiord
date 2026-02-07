/**
 * WorkoutLibrary Component Tests
 *
 * Tests for the WorkoutLibrary component covering:
 * - Rendering with different states
 * - Search functionality
 * - Tag filtering
 * - Sorting options
 * - Load and delete actions
 * - Preview functionality
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLibraryStore } from "../../../store/library-store";
import type { WorkoutTemplate } from "../../../types/workout-library";
import { WorkoutLibrary } from "./WorkoutLibrary";

// Mock the library store
vi.mock("../../../store/library-store");

describe("WorkoutLibrary", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnLoadWorkout = vi.fn();
  const mockDeleteTemplate = vi.fn();
  const mockGetAllTags = vi.fn();

  const mockTemplates: Array<WorkoutTemplate> = [
    {
      id: "1",
      name: "Morning Run",
      sport: "running",
      krd: {
        version: "1.0",
        type: "structured_workout",
        metadata: { created: "2025-01-15T10:00:00Z", sport: "running" },
        extensions: {
          structured_workout: {
            name: "Morning Run",
            sport: "running",
            steps: [],
          },
        },
      },
      tags: ["easy", "recovery"],
      difficulty: "easy",
      duration: 1800,
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "2",
      name: "Interval Training",
      sport: "cycling",
      krd: {
        version: "1.0",
        type: "structured_workout",
        metadata: { created: "2025-01-16T10:00:00Z", sport: "cycling" },
        extensions: {
          structured_workout: {
            name: "Interval Training",
            sport: "cycling",
            steps: [],
          },
        },
      },
      tags: ["hard", "intervals"],
      difficulty: "hard",
      duration: 3600,
      createdAt: "2025-01-16T10:00:00Z",
      updatedAt: "2025-01-16T10:00:00Z",
    },
    {
      id: "3",
      name: "Easy Swim",
      sport: "swimming",
      krd: {
        version: "1.0",
        type: "structured_workout",
        metadata: { created: "2025-01-17T10:00:00Z", sport: "swimming" },
        extensions: {
          structured_workout: {
            name: "Easy Swim",
            sport: "swimming",
            steps: [],
          },
        },
      },
      tags: ["easy", "technique"],
      difficulty: "moderate",
      duration: 2400,
      createdAt: "2025-01-17T10:00:00Z",
      updatedAt: "2025-01-17T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllTags.mockReturnValue([
      "easy",
      "recovery",
      "hard",
      "intervals",
      "technique",
    ]);
    vi.mocked(useLibraryStore).mockReturnValue({
      templates: mockTemplates,
      deleteTemplate: mockDeleteTemplate,
      getAllTags: mockGetAllTags,
      addTemplate: vi.fn(),
      updateTemplate: vi.fn(),
      getTemplate: vi.fn(),
      searchTemplates: vi.fn(),
      filterByTags: vi.fn(),
      filterBySport: vi.fn(),
    });
  });

  describe("rendering", () => {
    it("should render with workout grid", () => {
      // Arrange & Act
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Assert
      expect(screen.getByText("Workout Library")).toBeInTheDocument();
      expect(
        screen.getByText("Browse and load your saved workouts.")
      ).toBeInTheDocument();
      expect(screen.getAllByTestId("workout-card")).toHaveLength(3);
    });

    it("should render empty state when no workouts", () => {
      // Arrange
      vi.mocked(useLibraryStore).mockReturnValue({
        templates: [],
        deleteTemplate: mockDeleteTemplate,
        getAllTags: vi.fn().mockReturnValue([]),
        addTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        getTemplate: vi.fn(),
        searchTemplates: vi.fn(),
        filterByTags: vi.fn(),
        filterBySport: vi.fn(),
      });

      // Act
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Assert
      expect(screen.getByText("Your library is empty")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Create your first workout and save it to your library to get started."
        )
      ).toBeInTheDocument();
    });

    it("should render workout cards with correct information", () => {
      // Arrange & Act
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Assert
      expect(screen.getByText("Morning Run")).toBeInTheDocument();
      expect(screen.getByText("Interval Training")).toBeInTheDocument();
      expect(screen.getByText("Easy Swim")).toBeInTheDocument();
      expect(screen.getByText("running")).toBeInTheDocument();
      expect(screen.getByText("cycling")).toBeInTheDocument();
      expect(screen.getByText("swimming")).toBeInTheDocument();
    });

    it("should render difficulty badges", () => {
      // Arrange & Act
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Assert
      const cards = screen.getAllByTestId("workout-card");
      // Cards are sorted by date desc: Easy Swim (moderate), Interval Training (hard), Morning Run (easy)
      expect(within(cards[0]).getByText("moderate")).toBeInTheDocument();
      // For "hard" and "easy", there are multiple matches (difficulty badge + tag), so we just verify they exist
      expect(within(cards[1]).getAllByText("hard").length).toBeGreaterThan(0);
      expect(within(cards[2]).getAllByText("easy").length).toBeGreaterThan(0);
    });

    it("should render tags for each workout", () => {
      // Arrange & Act
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Assert
      const cards = screen.getAllByTestId("workout-card");
      // Cards are sorted by date desc: Easy Swim (Jan 17), Interval Training (Jan 16), Morning Run (Jan 15)
      expect(within(cards[0]).getByText("technique")).toBeInTheDocument();
      expect(within(cards[1]).getByText("intervals")).toBeInTheDocument();
      expect(within(cards[2]).getByText("recovery")).toBeInTheDocument();
    });
  });

  describe("search functionality", () => {
    it("should filter workouts by search query", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const searchInput = screen.getByPlaceholderText("Search workouts...");
      await user.type(searchInput, "run");

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Morning Run")).toBeInTheDocument();
        expect(screen.queryByText("Interval Training")).not.toBeInTheDocument();
        expect(screen.queryByText("Easy Swim")).not.toBeInTheDocument();
      });
    });

    it("should show no results message when search has no matches", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const searchInput = screen.getByPlaceholderText("Search workouts...");
      await user.type(searchInput, "nonexistent");

      // Assert
      await waitFor(() => {
        expect(screen.getByText("No workouts found")).toBeInTheDocument();
        expect(
          screen.getByText("No workouts match your current filters.")
        ).toBeInTheDocument();
      });
    });

    it("should be case insensitive", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const searchInput = screen.getByPlaceholderText("Search workouts...");
      await user.type(searchInput, "MORNING");

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Morning Run")).toBeInTheDocument();
      });
    });
  });

  describe("tag filtering", () => {
    it("should filter workouts by selected tags", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const easyTagButton = screen.getAllByRole("button", { name: "easy" })[0];
      await user.click(easyTagButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Morning Run")).toBeInTheDocument();
        expect(screen.getByText("Easy Swim")).toBeInTheDocument();
        expect(screen.queryByText("Interval Training")).not.toBeInTheDocument();
      });
    });

    it("should filter by multiple tags (AND logic)", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const easyTagButton = screen.getAllByRole("button", { name: "easy" })[0];
      const recoveryTagButton = screen.getByRole("button", {
        name: "recovery",
      });
      await user.click(easyTagButton);
      await user.click(recoveryTagButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Morning Run")).toBeInTheDocument();
        expect(screen.queryByText("Easy Swim")).not.toBeInTheDocument();
        expect(screen.queryByText("Interval Training")).not.toBeInTheDocument();
      });
    });

    it("should toggle tag selection", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const easyTagButton = screen.getAllByRole("button", { name: "easy" })[0];
      await user.click(easyTagButton);
      await user.click(easyTagButton);

      // Assert
      await waitFor(() => {
        expect(screen.getAllByTestId("workout-card")).toHaveLength(3);
      });
    });
  });

  describe("sorting", () => {
    it("should sort by date descending by default", () => {
      // Arrange & Act
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Assert
      const cards = screen.getAllByTestId("workout-card");
      expect(within(cards[0]).getByText("Easy Swim")).toBeInTheDocument();
      expect(
        within(cards[1]).getByText("Interval Training")
      ).toBeInTheDocument();
      expect(within(cards[2]).getByText("Morning Run")).toBeInTheDocument();
    });

    it("should sort by name descending by default", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const sortBySelect = screen.getByLabelText("Sort By");
      await user.selectOptions(sortBySelect, "name");

      // Assert
      await waitFor(() => {
        const cards = screen.getAllByTestId("workout-card");
        // Name sort descending: Morning Run, Interval Training, Easy Swim
        expect(within(cards[0]).getByText("Morning Run")).toBeInTheDocument();
        expect(
          within(cards[1]).getByText("Interval Training")
        ).toBeInTheDocument();
        expect(within(cards[2]).getByText("Easy Swim")).toBeInTheDocument();
      });
    });

    it("should toggle sort direction", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const sortBySelect = screen.getByLabelText("Sort By");
      const sortOrderSelect = screen.getByLabelText("Order");
      await user.selectOptions(sortBySelect, "name");
      await user.selectOptions(sortOrderSelect, "asc");

      // Assert
      await waitFor(() => {
        const cards = screen.getAllByTestId("workout-card");
        // Name sort ascending: Easy Swim, Interval Training, Morning Run
        expect(within(cards[0]).getByText("Easy Swim")).toBeInTheDocument();
        expect(
          within(cards[1]).getByText("Interval Training")
        ).toBeInTheDocument();
        expect(within(cards[2]).getByText("Morning Run")).toBeInTheDocument();
      });
    });

    it("should sort by difficulty", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Verify initial order (date descending)
      let cards = screen.getAllByTestId("workout-card");
      expect(within(cards[0]).getByText("Easy Swim")).toBeInTheDocument();

      // Act
      const sortBySelect = screen.getByLabelText("Sort By");
      await user.selectOptions(sortBySelect, "difficulty");

      // Assert - Wait for re-render and verify new order
      await waitFor(
        () => {
          cards = screen.getAllByTestId("workout-card");
          // Difficulty sort descending: hard (3), moderate (2), easy (1)
          const firstCardName = within(cards[0]).getByRole(
            "heading"
          ).textContent;
          expect(firstCardName).toBe("Interval Training");
        },
        { timeout: 3000 }
      );
    });
  });

  describe("load workout", () => {
    it("should call onLoadWorkout immediately when no current workout", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
          hasCurrentWorkout={false}
        />
      );

      // Act
      const cards = screen.getAllByTestId("workout-card");
      const loadButton = within(cards[0]).getByRole("button", { name: "Load" });
      await user.click(loadButton);

      // Assert
      // Cards are sorted by date desc, so first card is Easy Swim (id: "3")
      expect(mockOnLoadWorkout).toHaveBeenCalledWith(
        expect.objectContaining({ id: "3", name: "Easy Swim" })
      );
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should show confirmation dialog when current workout exists", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
          hasCurrentWorkout={true}
        />
      );

      // Act
      const cards = screen.getAllByTestId("workout-card");
      const loadButton = within(cards[0]).getByRole("button", { name: "Load" });
      await user.click(loadButton);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText("Replace Current Workout?")
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            /Loading this workout will replace your current workout/i
          )
        ).toBeInTheDocument();
      });
      expect(mockOnLoadWorkout).not.toHaveBeenCalled();
    });

    it("should load workout when confirmed", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
          hasCurrentWorkout={true}
        />
      );

      // Act
      const cards = screen.getAllByTestId("workout-card");
      const loadButton = within(cards[0]).getByRole("button", { name: "Load" });
      await user.click(loadButton);

      const confirmButton = await screen.findByRole("button", {
        name: "Load Workout",
      });
      await user.click(confirmButton);

      // Assert
      // Cards are sorted by date desc, so first card is Easy Swim (id: "3")
      expect(mockOnLoadWorkout).toHaveBeenCalledWith(
        expect.objectContaining({ id: "3", name: "Easy Swim" })
      );
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should cancel load when Cancel is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
          hasCurrentWorkout={true}
        />
      );

      // Act
      const cards = screen.getAllByTestId("workout-card");
      const loadButton = within(cards[0]).getByRole("button", { name: "Load" });
      await user.click(loadButton);

      const cancelButton = await screen.findByRole("button", {
        name: "Cancel",
      });
      await user.click(cancelButton);

      // Assert
      expect(mockOnLoadWorkout).not.toHaveBeenCalled();
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });

    it("should show confirmation when loading from preview dialog", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
          hasCurrentWorkout={true}
        />
      );

      // Act
      const cards = screen.getAllByTestId("workout-card");
      const previewButton = within(cards[0]).getByRole("button", {
        name: "Preview",
      });
      await user.click(previewButton);

      const loadButton = await screen.findByRole("button", {
        name: "Load Workout",
      });
      await user.click(loadButton);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText("Replace Current Workout?")
        ).toBeInTheDocument();
      });
    });
  });

  describe("delete workout", () => {
    it("should show confirmation dialog when delete is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const cards = screen.getAllByTestId("workout-card");
      const deleteButton = within(cards[0]).getByLabelText("Delete Easy Swim");
      await user.click(deleteButton);

      // Assert
      expect(screen.getByText("Delete Workout")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete "Easy Swim"\?/)
      ).toBeInTheDocument();
      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });

    it("should delete workout when confirmed", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const cards = screen.getAllByTestId("workout-card");
      const deleteButton = within(cards[0]).getByLabelText("Delete Easy Swim");
      await user.click(deleteButton);

      // Click the Delete button in the modal
      const confirmButton = screen.getByRole("button", { name: /delete/i });
      await user.click(confirmButton);

      // Assert
      // Cards are sorted by date desc, so first card is Easy Swim (id: "3")
      expect(mockDeleteTemplate).toHaveBeenCalledWith("3");
    });

    it("should cancel delete when Cancel is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const cards = screen.getAllByTestId("workout-card");
      const deleteButton = within(cards[0]).getByLabelText("Delete Easy Swim");
      await user.click(deleteButton);

      // Click the Cancel button in the modal
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Assert
      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
  });

  describe("preview functionality", () => {
    it("should show preview dialog when Preview button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const cards = screen.getAllByTestId("workout-card");
      const previewButton = within(cards[0]).getByRole("button", {
        name: "Preview",
      });
      await user.click(previewButton);

      // Assert - Preview dialog shows workout name as title
      await waitFor(() => {
        const previewHeading = screen.getByRole("heading", {
          name: "Easy Swim",
        });
        expect(previewHeading).toBeInTheDocument();

        // Verify sport and difficulty badges are present (multiple instances exist)
        expect(screen.getAllByText("swimming").length).toBeGreaterThan(0);
        expect(screen.getAllByText("moderate").length).toBeGreaterThan(0);
      });
    });

    it("should load workout from preview dialog", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const cards = screen.getAllByTestId("workout-card");
      const previewButton = within(cards[0]).getByRole("button", {
        name: "Preview",
      });
      await user.click(previewButton);

      const loadButton = await screen.findByRole("button", {
        name: "Load Workout",
      });
      await user.click(loadButton);

      // Assert
      // Cards are sorted by date desc, so first card is Easy Swim (id: "3")
      expect(mockOnLoadWorkout).toHaveBeenCalledWith(
        expect.objectContaining({ id: "3", name: "Easy Swim" })
      );
    });

    it("should close preview dialog", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const cards = screen.getAllByTestId("workout-card");
      const previewButton = within(cards[0]).getByRole("button", {
        name: "Preview",
      });
      await user.click(previewButton);

      const closeButton = await screen.findByLabelText("Close preview");
      await user.click(closeButton);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText("Details")).not.toBeInTheDocument();
      });
    });
  });

  describe("results count", () => {
    it("should display correct results count", () => {
      // Arrange & Act
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Assert
      expect(screen.getByText("Showing 3 of 3 workouts")).toBeInTheDocument();
    });

    it("should update results count when filtered", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <WorkoutLibrary
          open={true}
          onOpenChange={mockOnOpenChange}
          onLoadWorkout={mockOnLoadWorkout}
        />
      );

      // Act
      const searchInput = screen.getByPlaceholderText("Search workouts...");
      await user.type(searchInput, "run");

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Showing 1 of 3 workouts")).toBeInTheDocument();
      });
    });
  });
});
