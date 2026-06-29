import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { KRD } from "../../../types/krd";
import { FileUpload } from "./FileUpload";
import {
  CLEANUP_WAIT_MS,
  FILE_SIZE_REJECT,
  MOCK_WAIT_MS,
  PLACEHOLDER_BYTES,
  PROGRESS_MILESTONES,
} from "./test-fixtures";

// Mock the import-workout module
vi.mock("../../../utils/import-workout", () => ({
  importWorkout: vi.fn(),
  ImportError: class ImportError extends Error {
    format: string | null;
    cause?: unknown;
    constructor(message: string, format: string | null, cause?: unknown) {
      super(message);
      this.name = "ImportError";
      this.format = format;
      this.cause = cause;
    }
  },
}));

describe("FileUpload", () => {
  const mockKRD: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      structured_workout: {
        name: "Test Workout",
        sport: "running",
        steps: [],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    cleanup();
    // Wait for any pending async operations to complete before tearing down
    await new Promise((resolve) => setTimeout(resolve, CLEANUP_WAIT_MS));
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("should render upload button", () => {
    // Arrange

    // Act

    render(<FileUpload onFileLoad={vi.fn()} />);

    // Assert

    expect(
      screen.getByRole("button", { name: /upload workout file/i })
    ).toBeInTheDocument();
  });

  it("should trigger file input when button is clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);
    const button = screen.getByRole("button", { name: /upload workout file/i });

    // Act

    await user.click(button);

    const fileInput = screen.getByLabelText(/upload workout file/i);

    // Assert

    expect(fileInput).toBeInTheDocument();
  });

  it("should call onFileLoad with valid KRD file", async () => {
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockResolvedValue(mockKRD);

    const onFileLoad = vi.fn();
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={onFileLoad} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(mockKRD)], "workout.krd", {
      type: "application/json",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    await waitFor(() => {
      expect(onFileLoad).toHaveBeenCalledWith(mockKRD);
    });
  });

  it("should call onError with invalid file", async () => {
    // Arrange

    const { importWorkout, ImportError } =
      await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockRejectedValue(
      new ImportError("Failed to parse file", "krd")
    );

    const onError = vi.fn();
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} onError={onError} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File(["invalid content"], "workout.krd", {
      type: "application/json",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it("should display error message with retry button for invalid file", async () => {
    // Arrange

    const { importWorkout, ImportError } =
      await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockRejectedValue(
      new ImportError("Failed to parse file", "krd")
    );

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File(["invalid content"], "workout.krd", {
      type: "application/json",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Import Failed")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /try again/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /dismiss/i })
      ).toBeInTheDocument();
    });
  });

  it("should call onError with invalid KRD schema", async () => {
    // Arrange

    const { importWorkout, ImportError } =
      await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockRejectedValue(
      new ImportError("Validation failed", "krd")
    );

    const onError = vi.fn();
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} onError={onError} />);

    const invalidKRD = { version: "1.0" }; // Missing required fields

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(invalidKRD)], "workout.krd", {
      type: "application/json",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it("should display error for invalid file", async () => {
    // Arrange

    const { importWorkout, ImportError } =
      await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockRejectedValue(
      new ImportError("Validation failed", "krd")
    );

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const invalidKRD = { version: "1.0" }; // Missing required fields

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(invalidKRD)], "workout.krd", {
      type: "application/json",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Import Failed")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /try again/i })
      ).toBeInTheDocument();
    });
  });

  it("should display file name and format badge after successful load", async () => {
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockResolvedValue(mockKRD);

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(mockKRD)], "test-workout.krd", {
      type: "application/json",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    await waitFor(() => {
      expect(screen.getByText(/loaded: test-workout.krd/i)).toBeInTheDocument();
      expect(
        screen.getByRole("status", { name: /file format: krd/i })
      ).toBeInTheDocument();
    });
  });

  it("should be disabled when disabled prop is true", () => {
    // Arrange

    render(<FileUpload onFileLoad={vi.fn()} disabled={true} />);

    // Act

    const button = screen.getByRole("button", { name: /upload workout file/i });

    // Assert

    expect(button).toBeDisabled();
  });

  it("should accept multiple file formats by default", () => {
    // Arrange

    render(<FileUpload onFileLoad={vi.fn()} />);

    // Act

    const fileInput = screen.getByLabelText(/upload workout file/i);

    // Assert

    expect(fileInput).toHaveAttribute(
      "accept",
      ".fit,.tcx,.zwo,.krd,.json,.gcn"
    );
  });

  it("should accept custom file types", () => {
    // Arrange

    render(<FileUpload onFileLoad={vi.fn()} accept=".json" />);

    // Act

    const fileInput = screen.getByLabelText(/upload workout file/i);

    // Assert

    expect(fileInput).toHaveAttribute("accept", ".json");
  });

  it("should reject files larger than 10 MB", async () => {
    // Arrange

    const onError = vi.fn();
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} onError={onError} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);

    // Create a file larger than 10 MB (11 MB)
    const largeContent = new ArrayBuffer(
      FILE_SIZE_REJECT.megabytes *
        FILE_SIZE_REJECT.kilobytesPerMegabyte *
        FILE_SIZE_REJECT.bytesPerKilobyte
    );
    const file = new File([largeContent], "large-workout.krd", {
      type: "application/json",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
      expect(screen.getByText("File too large")).toBeInTheDocument();
    });
  });

  it("should retry file upload when Try Again button is clicked", async () => {
    // Arrange

    const { importWorkout, ImportError } =
      await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockRejectedValueOnce(
      new ImportError("Failed to parse file", "krd")
    );

    const onFileLoad = vi.fn();
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={onFileLoad} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const invalidFile = new File(["invalid content"], "workout.krd", {
      type: "application/json",
    });

    // Act

    await user.upload(fileInput, invalidFile);

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Import Failed")).toBeInTheDocument();
    });

    // Second attempt - valid KRD.
    vi.mocked(importWorkout).mockResolvedValueOnce(mockKRD);

    const validFile = new File([JSON.stringify(mockKRD)], "workout.krd", {
      type: "application/json",
    });

    // Click retry, then upload the valid file.
    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);
    await user.upload(fileInput, validFile);
    await waitFor(() => {
      expect(onFileLoad).toHaveBeenCalledWith(mockKRD);
      expect(screen.queryByText("Import Failed")).not.toBeInTheDocument();
    });
  });

  it("should dismiss error when Dismiss button is clicked", async () => {
    // Arrange

    const { importWorkout, ImportError } =
      await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockRejectedValue(
      new ImportError("Failed to parse file", "krd")
    );

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File(["invalid content"], "workout.krd", {
      type: "application/json",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Import Failed")).toBeInTheDocument();
    });

    // Clicking dismiss clears the error.
    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    await user.click(dismissButton);
    await waitFor(() => {
      expect(screen.queryByText("Import Failed")).not.toBeInTheDocument();
    });
  });

  it("should clear error when new file is selected", async () => {
    // Arrange

    const { importWorkout, ImportError } =
      await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockRejectedValueOnce(
      new ImportError("Failed to parse file", "krd")
    );

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const invalidFile = new File(["invalid content"], "workout.krd", {
      type: "application/json",
    });

    // Act

    await user.upload(fileInput, invalidFile);

    // Assert

    await waitFor(() => {
      expect(screen.getByText("Import Failed")).toBeInTheDocument();
    });

    // Second upload - valid KRD.
    vi.mocked(importWorkout).mockResolvedValueOnce(mockKRD);

    const validFile = new File([JSON.stringify(mockKRD)], "valid-workout.krd", {
      type: "application/json",
    });

    // Uploading a new file clears the previous error.
    await user.upload(fileInput, validFile);
    await waitFor(() => {
      expect(screen.queryByText("Import Failed")).not.toBeInTheDocument();
      expect(
        screen.getByText(/loaded: valid-workout.krd/i)
      ).toBeInTheDocument();
    });
  });

  it("should show format badge for FIT files", async () => {
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockResolvedValue(mockKRD);

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([new Uint8Array(PLACEHOLDER_BYTES)], "workout.fit", {
      type: "application/octet-stream",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    await waitFor(() => {
      expect(
        screen.getByRole("status", { name: /file format: fit/i })
      ).toBeInTheDocument();
    });
  });

  it("should show format badge for TCX files", async () => {
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockResolvedValue(mockKRD);

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File(["<xml></xml>"], "workout.tcx", {
      type: "application/xml",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    await waitFor(() => {
      expect(
        screen.getByRole("status", { name: /file format: tcx/i })
      ).toBeInTheDocument();
    });
  });

  it("should show format badge for ZWO files", async () => {
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockResolvedValue(mockKRD);

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File(["<xml></xml>"], "workout.zwo", {
      type: "application/xml",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    await waitFor(() => {
      expect(
        screen.getByRole("status", { name: /file format: zwo/i })
      ).toBeInTheDocument();
    });
  });

  it("should display conversion progress during import", async () => {
    // Arrange
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockImplementation(async (file, onProgress) => {
      onProgress?.(PROGRESS_MILESTONES.midway);
      // Simulate delay to keep loading state
      await new Promise((resolve) => setTimeout(resolve, MOCK_WAIT_MS.short));
      onProgress?.(PROGRESS_MILESTONES.takeoff);
      await new Promise((resolve) => setTimeout(resolve, MOCK_WAIT_MS.short));
      return mockKRD;
    });

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(mockKRD)], "workout.krd", {
      type: "application/json",
    });

    // Act

    const uploadPromise = user.upload(fileInput, file);

    // Assert

    // Check for the progress bar while loading.
    await waitFor(() => {
      const progressBar = screen.queryByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
    });

    await uploadPromise;
  });

  it("should show converting status during import", async () => {
    // Arrange
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockImplementation(async (file, onProgress) => {
      onProgress?.(PROGRESS_MILESTONES.midway);
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, MOCK_WAIT_MS.medium));
      return mockKRD;
    });

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(mockKRD)], "workout.fit", {
      type: "application/octet-stream",
    });

    // Act

    await user.upload(fileInput, file);

    // Assert

    // The converting message may disappear quickly.
    expect(screen.getByText(/converting workout.fit/i)).toBeInTheDocument();
  });

  it("should show spinner during conversion", async () => {
    // Arrange
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockImplementation(async (file, onProgress) => {
      onProgress?.(PROGRESS_MILESTONES.midway);
      await new Promise((resolve) => setTimeout(resolve, MOCK_WAIT_MS.medium));
      return mockKRD;
    });

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(mockKRD)], "workout.krd", {
      type: "application/json",
    });

    // Act

    const uploadPromise = user.upload(fileInput, file);

    // Assert

    // Check for the spinner.
    await waitFor(() => {
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    await uploadPromise;
  });

  it("should disable UI during conversion", async () => {
    // Arrange
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockImplementation(async (file, onProgress) => {
      onProgress?.(PROGRESS_MILESTONES.midway);
      await new Promise((resolve) => setTimeout(resolve, MOCK_WAIT_MS.long));
      return mockKRD;
    });

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(mockKRD)], "workout.krd", {
      type: "application/json",
    });

    // Act

    const uploadPromise = user.upload(fileInput, file);

    // Assert

    // The button should be disabled during loading.
    await waitFor(() => {
      const button = screen.queryByRole("button", {
        name: /loading/i,
      });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    await uploadPromise;
  });

  it("should display time estimate during long conversion", async () => {
    // Arrange
    // Arrange

    const { importWorkout } = await import("../../../utils/import-workout");
    vi.mocked(importWorkout).mockImplementation(async (file, onProgress) => {
      onProgress?.(PROGRESS_MILESTONES.early);
      await new Promise((resolve) => setTimeout(resolve, MOCK_WAIT_MS.medium));
      onProgress?.(PROGRESS_MILESTONES.rampUp);
      await new Promise((resolve) => setTimeout(resolve, MOCK_WAIT_MS.medium));
      onProgress?.(PROGRESS_MILESTONES.midway);
      await new Promise((resolve) => setTimeout(resolve, MOCK_WAIT_MS.medium));
      return mockKRD;
    });

    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(mockKRD)], "workout.krd", {
      type: "application/json",
    });

    // Act

    const uploadPromise = user.upload(fileInput, file);

    // Assert

    // Check for the time estimate.
    await waitFor(
      () => {
        expect(screen.getByText(/remaining/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await uploadPromise;
  });
});
