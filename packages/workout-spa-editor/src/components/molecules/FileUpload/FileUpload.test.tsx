import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KRD } from "../../../types/krd";
import * as importWorkoutModule from "../../../utils/import-workout";
import { FileUpload } from "./FileUpload";

// Mock File.prototype methods for testing environment
global.File.prototype.text = vi.fn();
global.File.prototype.arrayBuffer = vi.fn();

// Mock the import-workout module to avoid actual FIT parsing
vi.mock("../../../utils/import-workout");

describe("FileUpload", () => {
  const mockKRD: KRD = {
    version: "1.0",
    type: "workout",
    metadata: {
      created: "2025-01-15T10:30:00Z",
      sport: "running",
    },
    extensions: {
      workout: {
        name: "Test Workout",
        sport: "running",
        steps: [],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for importWorkout
    vi.mocked(importWorkoutModule.importWorkout).mockImplementation(
      async (file) => {
        // For unsupported formats, throw error
        if (!file.name.match(/\.(fit|tcx|pwx|krd|json)$/i)) {
          throw new Error(
            "Unsupported file format. Supported formats: .fit, .tcx, .pwx, .krd, .json"
          );
        }

        // For KRD files, parse the JSON
        if (file.name.endsWith(".krd") || file.name.endsWith(".json")) {
          const buffer = await file.arrayBuffer();
          const text = new TextDecoder().decode(buffer);
          return JSON.parse(text) as KRD;
        }
        // For other formats, return mockKRD
        return mockKRD;
      }
    );
  });

  it("should render upload button", () => {
    // Arrange & Act
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

    // Assert
    const fileInput = screen.getByLabelText(/upload workout file/i);
    expect(fileInput).toBeInTheDocument();
  });

  it("should call onFileLoad with valid KRD file", async () => {
    // Arrange
    const onFileLoad = vi.fn();
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={onFileLoad} />);

    // Mock File.arrayBuffer() to return valid KRD JSON as buffer
    const jsonString = JSON.stringify(mockKRD);
    const buffer = new TextEncoder().encode(jsonString).buffer;
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValue(buffer);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([jsonString], "workout.krd", {
      type: "application/json",
    });

    // Act
    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(onFileLoad).toHaveBeenCalledWith(mockKRD);
    });
  });

  it("should call onError with invalid JSON", async () => {
    // Arrange
    const onError = vi.fn();
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} onError={onError} />);

    // Mock File.arrayBuffer() to return invalid JSON as buffer
    const invalidJson = "invalid json {";
    const buffer = new TextEncoder().encode(invalidJson).buffer;
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValue(buffer);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([invalidJson], "workout.krd", {
      type: "application/json",
    });

    // Act
    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it("should display error message with retry button for invalid JSON", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    // Mock File.arrayBuffer() to return invalid JSON as buffer
    const invalidJson = "invalid json {";
    const buffer = new TextEncoder().encode(invalidJson).buffer;
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValue(buffer);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([invalidJson], "workout.krd", {
      type: "application/json",
    });

    // Act
    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("KRD Import Failed")).toBeInTheDocument();
      expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
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
    const onError = vi.fn();
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} onError={onError} />);

    const invalidKRD = { version: "1.0" }; // Missing required fields
    const jsonString = JSON.stringify(invalidKRD);
    const buffer = new TextEncoder().encode(jsonString).buffer;

    // Mock File.arrayBuffer() to return invalid KRD
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValue(buffer);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([jsonString], "workout.krd", {
      type: "application/json",
    });

    // Act
    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining("File validation failed"),
        expect.any(Array)
      );
    });
  });

  it("should display validation errors with field references", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    const invalidKRD = { version: "1.0" }; // Missing required fields
    const jsonString = JSON.stringify(invalidKRD);
    const buffer = new TextEncoder().encode(jsonString).buffer;

    // Mock File.arrayBuffer() to return invalid KRD
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValue(buffer);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([jsonString], "workout.krd", {
      type: "application/json",
    });

    // Act
    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Validation Failed")).toBeInTheDocument();
      expect(screen.getByText("Validation errors:")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /try again/i })
      ).toBeInTheDocument();
    });
  });

  it("should display file name after successful load", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    // Mock File.arrayBuffer() to return valid KRD JSON as buffer
    const jsonString = JSON.stringify(mockKRD);
    const buffer = new TextEncoder().encode(jsonString).buffer;
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValue(buffer);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([jsonString], "test-workout.krd", {
      type: "application/json",
    });

    // Act
    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/loaded: test-workout.krd/i)).toBeInTheDocument();
    });
  });

  it("should be disabled when disabled prop is true", () => {
    // Arrange & Act
    render(<FileUpload onFileLoad={vi.fn()} disabled={true} />);

    // Assert
    const button = screen.getByRole("button", { name: /upload workout file/i });
    expect(button).toBeDisabled();
  });

  it("should accept multiple file formats by default", () => {
    // Arrange & Act
    render(<FileUpload onFileLoad={vi.fn()} />);

    // Assert
    const fileInput = screen.getByLabelText(/upload workout file/i);
    expect(fileInput).toHaveAttribute("accept", ".fit,.tcx,.pwx,.krd,.json");
  });

  it("should accept custom file types", () => {
    // Arrange & Act
    render(<FileUpload onFileLoad={vi.fn()} accept=".json" />);

    // Assert
    const fileInput = screen.getByLabelText(/upload workout file/i);
    expect(fileInput).toHaveAttribute("accept", ".json");
  });

  it("should retry file upload when Try Again button is clicked", async () => {
    // Arrange
    const onFileLoad = vi.fn();
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={onFileLoad} />);

    // First attempt - invalid JSON
    const invalidJson = "invalid json {";
    const invalidBuffer = new TextEncoder().encode(invalidJson).buffer;
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValueOnce(invalidBuffer);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const invalidFile = new File([invalidJson], "workout.krd", {
      type: "application/json",
    });

    await user.upload(fileInput, invalidFile);

    await waitFor(() => {
      expect(screen.getByText("KRD Import Failed")).toBeInTheDocument();
    });

    // Second attempt - valid KRD
    const jsonString = JSON.stringify(mockKRD);
    const validBuffer = new TextEncoder().encode(jsonString).buffer;
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValueOnce(validBuffer);

    const validFile = new File([jsonString], "workout.krd", {
      type: "application/json",
    });

    // Act - click retry button
    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);

    // Upload valid file
    await user.upload(fileInput, validFile);

    // Assert
    await waitFor(() => {
      expect(onFileLoad).toHaveBeenCalledWith(mockKRD);
      expect(screen.queryByText("KRD Import Failed")).not.toBeInTheDocument();
    });
  });

  it("should dismiss error when Dismiss button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    // Mock File.arrayBuffer() to return invalid JSON as buffer
    const invalidJson = "invalid json {";
    const buffer = new TextEncoder().encode(invalidJson).buffer;
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValue(buffer);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([invalidJson], "workout.krd", {
      type: "application/json",
    });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText("KRD Import Failed")).toBeInTheDocument();
    });

    // Act - click dismiss button
    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    await user.click(dismissButton);

    // Assert
    await waitFor(() => {
      expect(screen.queryByText("KRD Import Failed")).not.toBeInTheDocument();
    });
  });

  it("should clear error when new file is selected", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    // First upload - invalid JSON
    const invalidJson = "invalid json {";
    const invalidBuffer = new TextEncoder().encode(invalidJson).buffer;
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValueOnce(invalidBuffer);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const invalidFile = new File([invalidJson], "workout.krd", {
      type: "application/json",
    });

    await user.upload(fileInput, invalidFile);

    await waitFor(() => {
      expect(screen.getByText("KRD Import Failed")).toBeInTheDocument();
    });

    // Second upload - valid KRD
    const jsonString = JSON.stringify(mockKRD);
    const validBuffer = new TextEncoder().encode(jsonString).buffer;
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValueOnce(validBuffer);

    const validFile = new File([jsonString], "valid-workout.krd", {
      type: "application/json",
    });

    // Act - upload new file
    await user.upload(fileInput, validFile);

    // Assert
    await waitFor(() => {
      expect(screen.queryByText("KRD Import Failed")).not.toBeInTheDocument();
      expect(
        screen.getByText(/loaded: valid-workout.krd/i)
      ).toBeInTheDocument();
    });
  });

  it("should display format badge for KRD file", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    // Mock File.arrayBuffer() to return valid KRD JSON as buffer
    const jsonString = JSON.stringify(mockKRD);
    const buffer = new TextEncoder().encode(jsonString).buffer;
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValue(buffer);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([jsonString], "workout.krd", {
      type: "application/json",
    });

    // Act
    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("KRD")).toBeInTheDocument();
      expect(screen.getByText(/loaded: workout.krd/i)).toBeInTheDocument();
    });
  });

  it("should display format badge for FIT file", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    // Mock File.arrayBuffer() to return valid KRD JSON as buffer (simulating FIT conversion)
    const jsonString = JSON.stringify(mockKRD);
    const buffer = new TextEncoder().encode(jsonString).buffer;
    vi.mocked(File.prototype.arrayBuffer).mockResolvedValue(buffer);

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const fitData = new Uint8Array([1, 2, 3]);
    const file = new File([fitData], "workout.fit", {
      type: "application/octet-stream",
    });

    // Act
    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("FIT")).toBeInTheDocument();
      expect(screen.getByText(/loaded: workout.fit/i)).toBeInTheDocument();
    });
  });

  // Note: Testing unsupported file formats in a browser environment is challenging
  // because the file input's accept attribute and browser behavior can prevent
  // the file from being selected. The actual code correctly handles unsupported
  // formats by checking the file extension in detectFormat() and throwing an
  // "Unsupported Format" error. This is tested indirectly through the file-format-detector tests.
});
