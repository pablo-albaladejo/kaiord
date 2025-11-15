import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { KRD } from "../../../types/krd";
import { FileUpload } from "./FileUpload";

// Mock File.prototype.text() for testing environment
global.File.prototype.text = vi.fn();

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

    // Mock File.text() to return valid KRD JSON
    vi.mocked(File.prototype.text).mockResolvedValue(JSON.stringify(mockKRD));

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

  it("should call onError with invalid JSON", async () => {
    // Arrange
    const onError = vi.fn();
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} onError={onError} />);

    // Mock File.text() to return invalid JSON
    vi.mocked(File.prototype.text).mockResolvedValue("invalid json {");

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File(["invalid json {"], "workout.krd", {
      type: "application/json",
    });

    // Act
    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
      const [[errorMessage]] = vi.mocked(onError).mock.calls;
      expect(errorMessage).toContain("Failed to parse JSON");
    });
  });

  it("should display error message with retry button for invalid JSON", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    // Mock File.text() to return invalid JSON
    vi.mocked(File.prototype.text).mockResolvedValue("invalid json {");

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File(["invalid json {"], "workout.krd", {
      type: "application/json",
    });

    // Act
    await user.upload(fileInput, file);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Invalid File Format")).toBeInTheDocument();
      expect(screen.getByText(/Failed to parse JSON/i)).toBeInTheDocument();
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

    // Mock File.text() to return invalid KRD
    vi.mocked(File.prototype.text).mockResolvedValue(
      JSON.stringify(invalidKRD)
    );

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(invalidKRD)], "workout.krd", {
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

    // Mock File.text() to return invalid KRD
    vi.mocked(File.prototype.text).mockResolvedValue(
      JSON.stringify(invalidKRD)
    );

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(invalidKRD)], "workout.krd", {
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

    // Mock File.text() to return valid KRD JSON
    vi.mocked(File.prototype.text).mockResolvedValue(JSON.stringify(mockKRD));

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File([JSON.stringify(mockKRD)], "test-workout.krd", {
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
    vi.mocked(File.prototype.text).mockResolvedValueOnce("invalid json {");

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const invalidFile = new File(["invalid json {"], "workout.krd", {
      type: "application/json",
    });

    await user.upload(fileInput, invalidFile);

    await waitFor(() => {
      expect(screen.getByText("Invalid File Format")).toBeInTheDocument();
    });

    // Second attempt - valid KRD
    vi.mocked(File.prototype.text).mockResolvedValueOnce(
      JSON.stringify(mockKRD)
    );

    const validFile = new File([JSON.stringify(mockKRD)], "workout.krd", {
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
      expect(screen.queryByText("Invalid File Format")).not.toBeInTheDocument();
    });
  });

  it("should dismiss error when Dismiss button is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    // Mock File.text() to return invalid JSON
    vi.mocked(File.prototype.text).mockResolvedValue("invalid json {");

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const file = new File(["invalid json {"], "workout.krd", {
      type: "application/json",
    });

    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText("Invalid File Format")).toBeInTheDocument();
    });

    // Act - click dismiss button
    const dismissButton = screen.getByRole("button", { name: /dismiss/i });
    await user.click(dismissButton);

    // Assert
    await waitFor(() => {
      expect(screen.queryByText("Invalid File Format")).not.toBeInTheDocument();
    });
  });

  it("should clear error when new file is selected", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<FileUpload onFileLoad={vi.fn()} />);

    // First upload - invalid JSON
    vi.mocked(File.prototype.text).mockResolvedValueOnce("invalid json {");

    const fileInput = screen.getByLabelText(/upload workout file/i);
    const invalidFile = new File(["invalid json {"], "workout.krd", {
      type: "application/json",
    });

    await user.upload(fileInput, invalidFile);

    await waitFor(() => {
      expect(screen.getByText("Invalid File Format")).toBeInTheDocument();
    });

    // Second upload - valid KRD
    vi.mocked(File.prototype.text).mockResolvedValueOnce(
      JSON.stringify(mockKRD)
    );

    const validFile = new File([JSON.stringify(mockKRD)], "valid-workout.krd", {
      type: "application/json",
    });

    // Act - upload new file
    await user.upload(fileInput, validFile);

    // Assert
    await waitFor(() => {
      expect(screen.queryByText("Invalid File Format")).not.toBeInTheDocument();
      expect(
        screen.getByText(/loaded: valid-workout.krd/i)
      ).toBeInTheDocument();
    });
  });
});
