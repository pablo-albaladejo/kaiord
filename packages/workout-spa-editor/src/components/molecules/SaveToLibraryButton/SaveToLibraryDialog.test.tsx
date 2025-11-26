/**
 * SaveToLibraryDialog Component Tests
 *
 * Tests for the SaveToLibraryDialog component.
 */

import { KRD } from "@kaiord/core";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLibraryStore } from "../../../store/library-store";
import { AppToastProvider } from "../../providers/AppToastProvider";
import { SaveToLibraryDialog } from "./SaveToLibraryDialog";

// Mock the library store
vi.mock("../../../store/library-store", () => ({
  useLibraryStore: vi.fn(),
}));

// Mock thumbnail generation
vi.mock("./generate-thumbnail", () => ({
  generateThumbnail: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
}));

describe("SaveToLibraryDialog", () => {
  const mockKRD: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "cycling",
        steps: [],
      },
    },
  };

  const mockAddTemplate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLibraryStore).mockReturnValue({
      addTemplate: mockAddTemplate,
      templates: [],
      updateTemplate: vi.fn(),
      deleteTemplate: vi.fn(),
      getTemplate: vi.fn(),
      searchTemplates: vi.fn(),
      filterByTags: vi.fn(),
      filterBySport: vi.fn(),
      getAllTags: vi.fn(),
    });
  });

  describe("rendering", () => {
    it("should render dialog when open", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={vi.fn()}
          />
        </AppToastProvider>
      );

      // Assert
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Save to Library")).toBeInTheDocument();
    });

    it("should not render dialog when closed", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={false}
            onOpenChange={vi.fn()}
          />
        </AppToastProvider>
      );

      // Assert
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render all form fields", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={vi.fn()}
          />
        </AppToastProvider>
      );

      // Assert
      expect(screen.getByLabelText(/workout name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should save workout with name only", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;
      const onOpenChange = vi.fn();

      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={onOpenChange}
          />
        </AppToastProvider>
      );

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test Workout");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      // Assert
      await waitFor(() => {
        expect(mockAddTemplate).toHaveBeenCalledWith(
          "Test Workout",
          "cycling",
          workout,
          expect.objectContaining({
            tags: [],
          })
        );
      });
    });

    it("should save workout with all fields", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;
      const onOpenChange = vi.fn();

      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={onOpenChange}
          />
        </AppToastProvider>
      );

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test Workout");
      await user.type(screen.getByLabelText(/tags/i), "intervals, endurance");
      await user.selectOptions(screen.getByLabelText(/difficulty/i), "hard");
      await user.type(screen.getByLabelText(/notes/i), "Great workout");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      // Assert
      await waitFor(() => {
        expect(mockAddTemplate).toHaveBeenCalledWith(
          "Test Workout",
          "cycling",
          workout,
          expect.objectContaining({
            tags: ["intervals", "endurance"],
            difficulty: "hard",
            notes: "Great workout",
          })
        );
      });
    });

    it("should close dialog after successful save", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;
      const onOpenChange = vi.fn();

      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={onOpenChange}
          />
        </AppToastProvider>
      );

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test Workout");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      // Assert
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("should close dialog when cancel is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;
      const onOpenChange = vi.fn();

      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={onOpenChange}
          />
        </AppToastProvider>
      );

      // Act
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Assert
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("validation", () => {
    it("should disable save button when name is empty", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={vi.fn()}
          />
        </AppToastProvider>
      );

      // Assert
      const saveButton = screen.getByRole("button", { name: /^save$/i });
      expect(saveButton).toBeDisabled();
    });

    it("should enable save button when name is provided", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;

      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={vi.fn()}
          />
        </AppToastProvider>
      );

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test");

      // Assert
      const saveButton = screen.getByRole("button", { name: /^save$/i });
      expect(saveButton).toBeEnabled();
    });

    it("should show character count for notes", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;

      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={vi.fn()}
          />
        </AppToastProvider>
      );

      // Act
      await user.type(screen.getByLabelText(/notes/i), "Test notes");

      // Assert
      expect(screen.getByText(/10\/1000 characters/i)).toBeInTheDocument();
    });
  });

  describe("tag parsing", () => {
    it("should parse comma-separated tags", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;

      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={vi.fn()}
          />
        </AppToastProvider>
      );

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test");
      await user.type(screen.getByLabelText(/tags/i), "tag1, tag2, tag3");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      // Assert
      await waitFor(() => {
        expect(mockAddTemplate).toHaveBeenCalledWith(
          "Test",
          expect.any(String),
          workout,
          expect.objectContaining({
            tags: ["tag1", "tag2", "tag3"],
          })
        );
      });
    });

    it("should trim whitespace from tags", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;

      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={vi.fn()}
          />
        </AppToastProvider>
      );

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test");
      await user.type(screen.getByLabelText(/tags/i), "  tag1  ,  tag2  ");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      // Assert
      await waitFor(() => {
        expect(mockAddTemplate).toHaveBeenCalledWith(
          "Test",
          expect.any(String),
          workout,
          expect.objectContaining({
            tags: ["tag1", "tag2"],
          })
        );
      });
    });

    it("should filter out empty tags", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;

      render(
        <AppToastProvider>
          <SaveToLibraryDialog
            workout={workout}
            open={true}
            onOpenChange={vi.fn()}
          />
        </AppToastProvider>
      );

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test");
      await user.type(screen.getByLabelText(/tags/i), "tag1,,tag2,  ,tag3");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      // Assert
      await waitFor(() => {
        expect(mockAddTemplate).toHaveBeenCalledWith(
          "Test",
          expect.any(String),
          workout,
          expect.objectContaining({
            tags: ["tag1", "tag2", "tag3"],
          })
        );
      });
    });
  });
});
