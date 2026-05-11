import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { KRD } from "../../../types/krd";
import { ToastProvider } from "../../atoms/Toast";
import { SaveButton } from "./SaveButton";
// eslint-disable-next-line no-magic-numbers -- test fixtures use literal values for clarity
const MOCK_BUFFER_BYTES_3 = [1, 2, 3] as const;

// Mock the export-workout utility
vi.mock("../../../utils/export-workout");

// Mock the ExportFormatSelector component
vi.mock("../ExportFormatSelector/ExportFormatSelector", () => ({
  ExportFormatSelector: ({
    currentFormat,
    onFormatChange,
    disabled,
  }: {
    currentFormat: string;
    onFormatChange: (format: string) => void;
    disabled?: boolean;
  }) => (
    <div>
      <button
        type="button"
        aria-label="Select export format"
        disabled={disabled}
        onClick={() => {
          /* dropdown toggle */
        }}
      >
        {currentFormat.toUpperCase()}
      </button>
      <button
        type="button"
        aria-label="FIT"
        disabled={disabled}
        onClick={() => onFormatChange("fit")}
      >
        FIT
      </button>
      <button
        type="button"
        aria-label="TCX"
        disabled={disabled}
        onClick={() => onFormatChange("tcx")}
      >
        TCX
      </button>
      <button
        type="button"
        aria-label="ZWO"
        disabled={disabled}
        onClick={() => onFormatChange("zwo")}
      >
        ZWO
      </button>
    </div>
  ),
}));

// Import after mocking
const { exportWorkout, downloadWorkout } =
  await import("../../../utils/export-workout");

const TOAST_WAIT_MS = 3000;
const PROGRESS_PERCENT_30 = 30;
const PROGRESS_PERCENT_60 = 60;
const EXPECTED_RETRY_CALL_COUNT = 2;
const MOCK_BUFFER_BYTES = MOCK_BUFFER_BYTES_3;

// Helper to render with ToastProvider
const renderWithToast = (ui: ReactElement) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe("SaveButton", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clear pending Radix Toast timers to prevent "document is not defined"
    // errors when toast auto-dismiss fires after jsdom teardown (Node 24.x)
    const id = setTimeout(() => {}, 0);
    for (let i = 1; i <= Number(id); i++) {
      clearTimeout(i);
    }
    cleanup();
  });

  describe("rendering", () => {
    it("should render save button with default text", () => {
      // Arrange & Act
      // Arrange

      // Act

      renderWithToast(<SaveButton workout={mockKRD} />);

      // Assert

      // Assert

      expect(
        screen.getByRole("button", { name: /save workout/i })
      ).toBeInTheDocument();
    });

    it("should render format selector", () => {
      // Arrange & Act
      // Arrange

      // Act

      renderWithToast(<SaveButton workout={mockKRD} />);

      // Assert

      // Assert

      expect(
        screen.getByRole("button", { name: /select export format/i })
      ).toBeInTheDocument();
    });

    it("should render download icon", () => {
      // Arrange & Act
      // Arrange

      renderWithToast(<SaveButton workout={mockKRD} />);

      // Assert
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act

      const icon = button.querySelector("svg");

      // Assert

      expect(icon).toBeInTheDocument();
    });

    it("should apply custom className to container", () => {
      // Arrange & Act
      // Arrange

      renderWithToast(
        <SaveButton workout={mockKRD} className="custom-class" />
      );

      // Assert
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act

      const container = button.closest(".custom-class");

      // Assert

      expect(container).toBeInTheDocument();
    });
  });

  describe("save functionality", () => {
    it("should export workout in default KRD format when button is clicked", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const mockBuffer = new Uint8Array(MOCK_BUFFER_BYTES);
      vi.mocked(exportWorkout).mockResolvedValue(mockBuffer);

      // Act
      renderWithToast(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act

      await user.click(button);

      // Assert

      // Assert

      await waitFor(() => {
        expect(exportWorkout).toHaveBeenCalledWith(
          mockKRD,
          "krd",
          expect.any(Function)
        );
        expect(downloadWorkout).toHaveBeenCalledWith(
          mockBuffer,
          "test_workout.krd",
          "krd"
        );
      });
    });

    it("should show success notification with format name", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const mockBuffer = new Uint8Array(MOCK_BUFFER_BYTES);
      vi.mocked(exportWorkout).mockImplementation(async () => mockBuffer);

      renderWithToast(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act
      await user.click(button);

      // Assert - Wait for toast to appear

      // Act

      const title = await screen.findByText(
        "Workout Saved",
        {},
        { timeout: TOAST_WAIT_MS }
      );

      // Assert

      expect(title).toBeInTheDocument();
      const description = await screen.findByText(
        /"Test Workout" has been saved as KRD/,
        {},
        { timeout: TOAST_WAIT_MS }
      );
      expect(description).toBeInTheDocument();
    });

    it("should generate correct filename for workout without name", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const workoutWithoutName: KRD = {
        ...mockKRD,
        extensions: {
          structured_workout: {
            sport: "cycling",
            steps: [],
          },
        },
      };
      const mockBuffer = new Uint8Array(MOCK_BUFFER_BYTES);
      vi.mocked(exportWorkout).mockResolvedValue(mockBuffer);

      renderWithToast(<SaveButton workout={workoutWithoutName} />);
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act

      // Act

      await user.click(button);

      // Assert

      // Assert

      await waitFor(() => {
        expect(downloadWorkout).toHaveBeenCalledWith(
          mockBuffer,
          "workout.krd",
          "krd"
        );
      });
    });

    it("should not export when disabled", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();

      // Act
      renderWithToast(<SaveButton workout={mockKRD} disabled={true} />);
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act

      await user.click(button);

      // Assert

      // Assert

      expect(exportWorkout).not.toHaveBeenCalled();
    });
  });

  describe("multi-format save", () => {
    it("should export workout in FIT format when selected", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const mockBuffer = new Uint8Array(MOCK_BUFFER_BYTES);
      vi.mocked(exportWorkout).mockImplementation(async () => mockBuffer);

      renderWithToast(<SaveButton workout={mockKRD} />);

      // Act - Select FIT format
      const fitOption = screen.getByRole("button", { name: /FIT/i });
      await user.click(fitOption);

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save workout/i });

      // Act

      await user.click(saveButton);

      // Assert

      // Assert

      await waitFor(() => {
        expect(exportWorkout).toHaveBeenCalledWith(
          mockKRD,
          "fit",
          expect.any(Function)
        );
        expect(downloadWorkout).toHaveBeenCalledWith(
          mockBuffer,
          "test_workout.fit",
          "fit"
        );
      });
    });

    it("should export workout in TCX format when selected", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const mockBuffer = new Uint8Array(MOCK_BUFFER_BYTES);
      vi.mocked(exportWorkout).mockImplementation(async () => mockBuffer);

      renderWithToast(<SaveButton workout={mockKRD} />);

      // Act - Select TCX format
      const tcxOption = screen.getByRole("button", { name: /TCX/i });
      await user.click(tcxOption);

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save workout/i });

      // Act

      await user.click(saveButton);

      // Assert

      // Assert

      await waitFor(() => {
        expect(exportWorkout).toHaveBeenCalledWith(
          mockKRD,
          "tcx",
          expect.any(Function)
        );
        expect(downloadWorkout).toHaveBeenCalledWith(
          mockBuffer,
          "test_workout.tcx",
          "tcx"
        );
      });
    });

    it("should export workout in ZWO format when selected", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const mockBuffer = new Uint8Array(MOCK_BUFFER_BYTES);
      vi.mocked(exportWorkout).mockImplementation(async () => mockBuffer);

      renderWithToast(<SaveButton workout={mockKRD} />);

      // Act - Select ZWO format
      const zwoOption = screen.getByRole("button", { name: /ZWO/i });
      await user.click(zwoOption);

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save workout/i });

      // Act

      await user.click(saveButton);

      // Assert

      // Assert

      await waitFor(() => {
        expect(exportWorkout).toHaveBeenCalledWith(
          mockKRD,
          "zwo",
          expect.any(Function)
        );
        expect(downloadWorkout).toHaveBeenCalledWith(
          mockBuffer,
          "test_workout.zwo",
          "zwo"
        );
      });
    });

    it("should show success notification with correct format name", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const mockBuffer = new Uint8Array(MOCK_BUFFER_BYTES);
      vi.mocked(exportWorkout).mockImplementation(async () => mockBuffer);

      renderWithToast(<SaveButton workout={mockKRD} />);

      // Act - Select FIT format
      const fitOption = screen.getByRole("button", { name: /FIT/i });
      await user.click(fitOption);

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save workout/i });
      await user.click(saveButton);

      // Assert - Wait for toast to appear

      // Act

      const title = await screen.findByText(
        "Workout Saved",
        {},
        { timeout: TOAST_WAIT_MS }
      );

      // Assert

      expect(title).toBeInTheDocument();
      const description = await screen.findByText(
        /"Test Workout" has been saved as FIT/,
        {},
        { timeout: TOAST_WAIT_MS }
      );
      expect(description).toBeInTheDocument();
    });

    it("should generate correct filename with format extension", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const mockBuffer = new Uint8Array(MOCK_BUFFER_BYTES);
      vi.mocked(exportWorkout).mockResolvedValue(mockBuffer);

      renderWithToast(<SaveButton workout={mockKRD} />);

      // Act - Select TCX format
      const tcxOption = screen.getByRole("button", { name: /TCX/i });
      await user.click(tcxOption);

      // Click save button
      const saveButton = screen.getByRole("button", { name: /save workout/i });

      // Act

      await user.click(saveButton);

      // Assert

      // Assert

      await waitFor(() => {
        expect(downloadWorkout).toHaveBeenCalledWith(
          mockBuffer,
          "test_workout.tcx",
          "tcx"
        );
      });
    });
  });

  describe("error handling", () => {
    it("should display error notification when export fails", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      vi.mocked(exportWorkout).mockImplementation(async () => {
        throw new Error("Export failed");
      });

      // Act
      renderWithToast(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });
      await user.click(button);

      // Assert - Wait for error toast to appear

      // Act

      const errorTitle = await screen.findByText(
        "Export Failed",
        {},
        { timeout: TOAST_WAIT_MS }
      );

      // Assert

      expect(errorTitle).toBeInTheDocument();
      // Find error message in toast description (more specific)
      const errorMessages = await screen.findAllByText(
        "Export failed",
        {},
        { timeout: TOAST_WAIT_MS }
      );
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    it("should allow retry after export error", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const mockBuffer = new Uint8Array(MOCK_BUFFER_BYTES);

      let callCount = 0;
      vi.mocked(exportWorkout).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("Export failed");
        }
        return mockBuffer;
      });

      renderWithToast(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });

      // First attempt fails
      await user.click(button);

      // Wait for error toast

      // Act

      const errorTitle = await screen.findByText(
        "Export Failed",
        {},
        { timeout: TOAST_WAIT_MS }
      );

      // Assert

      expect(errorTitle).toBeInTheDocument();

      // Act - Click save button again
      await user.click(button);

      // Assert - Second save should succeed
      await waitFor(
        () => {
          expect(callCount).toBe(EXPECTED_RETRY_CALL_COUNT);
        },
        { timeout: TOAST_WAIT_MS }
      );

      const successTitle = await screen.findByText(
        "Workout Saved",
        {},
        { timeout: TOAST_WAIT_MS }
      );
      expect(successTitle).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("should be disabled when disabled prop is true", () => {
      // Arrange & Act
      // Arrange

      renderWithToast(<SaveButton workout={mockKRD} disabled={true} />);

      // Assert

      // Act

      const button = screen.getByRole("button", { name: /save workout/i });

      // Assert

      expect(button).toBeDisabled();
    });
  });

  describe("loading states", () => {
    it("should show spinner during export", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      vi.mocked(exportWorkout).mockImplementation(
        async (krd, format, onProgress) => {
          onProgress?.(PROGRESS_PERCENT_30);

          await new Promise((resolve) => setTimeout(resolve, 100));
          return new Uint8Array(MOCK_BUFFER_BYTES);
        }
      );

      renderWithToast(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act

      // Act

      const clickPromise = user.click(button);

      // Assert - check for spinner

      // Assert

      await waitFor(() => {
        const spinner = document.querySelector(".animate-spin");
        expect(spinner).toBeInTheDocument();
      });

      await clickPromise;
      // Wait for all async operations to complete
      await waitFor(() => {
        expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
      });
    });

    it("should show Saving... text during export", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      vi.mocked(exportWorkout).mockImplementation(
        async (krd, format, onProgress) => {
          onProgress?.(PROGRESS_PERCENT_30);

          await new Promise((resolve) => setTimeout(resolve, 100));
          return new Uint8Array(MOCK_BUFFER_BYTES);
        }
      );

      renderWithToast(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act

      // Act

      const clickPromise = user.click(button);

      // Assert

      // Assert

      await waitFor(() => {
        expect(screen.getByText("Saving...")).toBeInTheDocument();
      });

      await clickPromise;
      // Wait for all async operations to complete
      await waitFor(() => {
        expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
      });
    });

    it("should disable button during export", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      vi.mocked(exportWorkout).mockImplementation(
        async (krd, format, onProgress) => {
          onProgress?.(PROGRESS_PERCENT_30);

          await new Promise((resolve) => setTimeout(resolve, 100));
          return new Uint8Array(MOCK_BUFFER_BYTES);
        }
      );

      renderWithToast(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act

      // Act

      const clickPromise = user.click(button);

      // Assert

      // Assert

      await waitFor(() => {
        const savingButton = screen.getByRole("button", { name: /saving/i });
        expect(savingButton).toBeDisabled();
      });

      await clickPromise;
      // Wait for all async operations to complete
      await waitFor(() => {
        expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
      });
    });

    it("should disable format selector during export", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      vi.mocked(exportWorkout).mockImplementation(
        async (krd, format, onProgress) => {
          onProgress?.(PROGRESS_PERCENT_30);

          await new Promise((resolve) => setTimeout(resolve, 100));
          return new Uint8Array(MOCK_BUFFER_BYTES);
        }
      );

      renderWithToast(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act

      // Act

      const clickPromise = user.click(button);

      // Assert - format selector should be disabled

      // Assert

      await waitFor(() => {
        const formatButton = screen.getByRole("button", {
          name: /select export format/i,
        });
        expect(formatButton).toBeDisabled();
      });

      await clickPromise;
      // Wait for all async operations to complete
      await waitFor(() => {
        expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
      });
    });

    it("should display progress bar during export", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      vi.mocked(exportWorkout).mockImplementation(
        async (krd, format, onProgress) => {
          onProgress?.(PROGRESS_PERCENT_30);
          // eslint-disable-next-line no-magic-numbers -- timer-test arbitrary tick boundary, not domain-modeled
          await new Promise((resolve) => setTimeout(resolve, 50));
          onProgress?.(PROGRESS_PERCENT_60);
          // eslint-disable-next-line no-magic-numbers -- timer-test arbitrary tick boundary, not domain-modeled
          await new Promise((resolve) => setTimeout(resolve, 50));
          return new Uint8Array(MOCK_BUFFER_BYTES);
        }
      );

      renderWithToast(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act

      // Act

      const clickPromise = user.click(button);

      // Assert - check for progress bar

      // Assert

      await waitFor(() => {
        const progressBar = screen.queryByRole("progressbar");
        expect(progressBar).toBeInTheDocument();
      });

      await clickPromise;
      // Wait for all async operations to complete
      await waitFor(() => {
        expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
      });
    });

    it("should update progress bar value during export", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      vi.mocked(exportWorkout).mockImplementation(
        async (krd, format, onProgress) => {
          onProgress?.(PROGRESS_PERCENT_30);
          // eslint-disable-next-line no-magic-numbers -- timer-test arbitrary tick boundary, not domain-modeled
          await new Promise((resolve) => setTimeout(resolve, 50));
          onProgress?.(PROGRESS_PERCENT_60);
          // eslint-disable-next-line no-magic-numbers -- timer-test arbitrary tick boundary, not domain-modeled
          await new Promise((resolve) => setTimeout(resolve, 50));
          return new Uint8Array(MOCK_BUFFER_BYTES);
        }
      );

      renderWithToast(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });

      // Act

      // Act

      const clickPromise = user.click(button);

      // Assert - check progress bar updates

      // Assert

      await waitFor(() => {
        const progressBar = screen.queryByRole("progressbar");
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute("aria-valuenow");
      });

      await clickPromise;
      // Wait for all async operations to complete
      await waitFor(() => {
        expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("should have proper button role", () => {
      // Arrange & Act
      // Arrange

      renderWithToast(<SaveButton workout={mockKRD} />);

      // Assert

      // Act

      const button = screen.getByRole("button", { name: /save workout/i });

      // Assert

      expect(button).toBeInTheDocument();
    });

    it("should be keyboard accessible", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      const mockBuffer = new Uint8Array(MOCK_BUFFER_BYTES);
      vi.mocked(exportWorkout).mockResolvedValue(mockBuffer);

      // Act
      renderWithToast(<SaveButton workout={mockKRD} />);
      const button = screen.getByRole("button", { name: /save workout/i });
      button.focus();

      // Act

      await user.keyboard("{Enter}");

      // Assert

      // Assert

      await waitFor(() => {
        expect(exportWorkout).toHaveBeenCalled();
      });
    });
  });
});
