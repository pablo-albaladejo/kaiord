/**
 * SaveToLibraryDialog Component Tests
 *
 * Tests for the SaveToLibraryDialog component.
 */

import { KRD } from "@kaiord/core";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addTemplate } from "../../../application/library/add-template";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { SaveToLibraryDialog } from "./SaveToLibraryDialog";

// Mock the addTemplate use case so we can spy on its arguments without
// exercising the in-memory persistence layer.
vi.mock("../../../application/library/add-template", () => ({
  addTemplate: vi.fn(),
}));

// Mock thumbnail generation
vi.mock("./generate-thumbnail", () => ({
  generateThumbnail: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
}));

// Use ToastContextProvider directly (without the Radix ToastProvider /
// ToastRenderer wrappers from AppToastProvider). The dialog only needs
// useToastContext() to resolve; mounting the Radix viewport leaks an
// auto-dismiss setTimeout that fires after jsdom teardown and crashes
// the suite ("ReferenceError: document is not defined").
const renderDialog = (
  props: React.ComponentProps<typeof SaveToLibraryDialog>
) =>
  render(
    <ToastContextProvider>
      <PersistenceProvider persistence={createInMemoryPersistence()}>
        <SaveToLibraryDialog {...props} />
      </PersistenceProvider>
    </ToastContextProvider>
  );

describe("SaveToLibraryDialog", () => {
  const mockKRD: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "cycling",
    },
    extensions: {
      structured_workout: {
        name: "Test Workout",
        sport: "cycling",
        steps: [],
      },
    },
  };

  const mockAddTemplate = vi.mocked(addTemplate);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: resolve with a stub template so the success path runs.
    mockAddTemplate.mockResolvedValue({
      id: "stub",
      name: "stub",
      sport: "cycling",
      krd: mockKRD,
      tags: [],
      createdAt: "",
      updatedAt: "",
    });
  });

  describe("rendering", () => {
    it("should render dialog when open", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      renderDialog({
        workout,
        open: true,
        onOpenChange: vi.fn(),
      });

      // Assert
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Save to Library")).toBeInTheDocument();
    });

    it("should not render dialog when closed", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      renderDialog({ workout, open: false, onOpenChange: vi.fn() });

      // Assert
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render all form fields", () => {
      // Arrange
      const workout = mockKRD;

      // Act
      renderDialog({
        workout,
        open: true,
        onOpenChange: vi.fn(),
      });

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

      renderDialog({ workout, open: true, onOpenChange });

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test Workout");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      // Assert
      await waitFor(() => {
        expect(mockAddTemplate).toHaveBeenCalledWith(
          expect.anything(),
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

      renderDialog({ workout, open: true, onOpenChange });

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test Workout");
      await user.type(screen.getByLabelText(/tags/i), "intervals, endurance");
      await user.selectOptions(screen.getByLabelText(/difficulty/i), "hard");
      await user.type(screen.getByLabelText(/notes/i), "Great workout");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      // Assert
      await waitFor(() => {
        expect(mockAddTemplate).toHaveBeenCalledWith(
          expect.anything(),
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

      renderDialog({ workout, open: true, onOpenChange });

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

      renderDialog({ workout, open: true, onOpenChange });

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
      renderDialog({
        workout,
        open: true,
        onOpenChange: vi.fn(),
      });

      // Assert
      const saveButton = screen.getByRole("button", { name: /^save$/i });
      expect(saveButton).toBeDisabled();
    });

    it("should enable save button when name is provided", async () => {
      // Arrange
      const user = userEvent.setup();
      const workout = mockKRD;

      renderDialog({ workout, open: true, onOpenChange: vi.fn() });

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

      renderDialog({ workout, open: true, onOpenChange: vi.fn() });

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

      renderDialog({ workout, open: true, onOpenChange: vi.fn() });

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test");
      await user.type(screen.getByLabelText(/tags/i), "tag1, tag2, tag3");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      // Assert
      await waitFor(() => {
        expect(mockAddTemplate).toHaveBeenCalledWith(
          expect.anything(),
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

      renderDialog({ workout, open: true, onOpenChange: vi.fn() });

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test");
      await user.type(screen.getByLabelText(/tags/i), "  tag1  ,  tag2  ");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      // Assert
      await waitFor(() => {
        expect(mockAddTemplate).toHaveBeenCalledWith(
          expect.anything(),
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

      renderDialog({ workout, open: true, onOpenChange: vi.fn() });

      // Act
      await user.type(screen.getByLabelText(/workout name/i), "Test");
      await user.type(screen.getByLabelText(/tags/i), "tag1,,tag2,  ,tag3");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      // Assert
      await waitFor(() => {
        expect(mockAddTemplate).toHaveBeenCalledWith(
          expect.anything(),
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
