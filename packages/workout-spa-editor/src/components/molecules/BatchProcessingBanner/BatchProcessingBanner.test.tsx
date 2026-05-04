import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BatchProcessingBanner } from "./BatchProcessingBanner";

describe("BatchProcessingBanner", () => {
  it("should render nothing when no raw workouts and not processing", () => {
    // Arrange

    // Act

    const { container } = render(
      <BatchProcessingBanner
        rawCount={0}
        isProcessing={false}
        progress={null}
        onProcess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(container.firstChild).toBeNull();
  });

  it("should show raw count and process button when idle", () => {
    // Arrange

    // Act

    render(
      <BatchProcessingBanner
        rawCount={3}
        isProcessing={false}
        progress={null}
        onProcess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByText(/3 raw workouts/)).toBeInTheDocument();
    expect(screen.getByText("Process all with AI")).toBeInTheDocument();
  });

  it("should call onProcess when button clicked", async () => {
    // Arrange

    const user = userEvent.setup();
    const onProcess = vi.fn();

    render(
      <BatchProcessingBanner
        rawCount={2}
        isProcessing={false}
        progress={null}
        onProcess={onProcess}
        onCancel={vi.fn()}
      />
    );

    // Act

    await user.click(screen.getByText("Process all with AI"));

    // Assert

    expect(onProcess).toHaveBeenCalled();
  });

  it("should show progress during processing", () => {
    // Arrange

    // Act

    render(
      <BatchProcessingBanner
        rawCount={3}
        isProcessing={true}
        progress={{
          total: 3,
          processed: 1,
          succeeded: 1,
          failed: 0,
          current: null,
        }}
        onProcess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByTestId("batch-progress")).toHaveTextContent(
      "Processing 1 of 3"
    );
  });

  it("should show cancel button during processing", async () => {
    // Arrange

    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <BatchProcessingBanner
        rawCount={3}
        isProcessing={true}
        progress={{
          total: 3,
          processed: 0,
          succeeded: 0,
          failed: 0,
          current: null,
        }}
        onProcess={vi.fn()}
        onCancel={onCancel}
      />
    );

    // Act

    await user.click(screen.getByLabelText("Cancel batch processing"));

    // Assert

    expect(onCancel).toHaveBeenCalled();
  });

  it("should show progress counter as X of N", () => {
    // Arrange

    // Act

    render(
      <BatchProcessingBanner
        rawCount={5}
        isProcessing={true}
        progress={{
          total: 5,
          processed: 2,
          succeeded: 2,
          failed: 0,
          current: null,
        }}
        onProcess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByTestId("batch-progress")).toHaveTextContent(
      "Processing 2 of 5"
    );
  });

  it("should use singular form for 1 raw workout", () => {
    // Arrange

    // Act

    render(
      <BatchProcessingBanner
        rawCount={1}
        isProcessing={false}
        progress={null}
        onProcess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByText(/1 raw workout this/)).toBeInTheDocument();
  });

  it("should render the per-bucket breakdown from progress.counts", () => {
    // Arrange

    // Act

    render(
      <BatchProcessingBanner
        rawCount={5}
        isProcessing={true}
        progress={{
          total: 5,
          processed: 2,
          succeeded: 1,
          failed: 1,
          current: "w3",
          counts: { queued: 2, processing: 1, succeeded: 1, failed: 1 },
          byId: {
            w1: "succeeded",
            w2: "failed",
            w3: "processing",
            w4: "queued",
            w5: "queued",
          },
        }}
        onProcess={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    // Assert

    expect(screen.getByTestId("batch-count-queued")).toHaveTextContent(
      "Queued 2"
    );
    expect(screen.getByTestId("batch-count-processing")).toHaveTextContent(
      "Processing 1"
    );
    expect(screen.getByTestId("batch-count-succeeded")).toHaveTextContent(
      "Succeeded 1"
    );
    expect(screen.getByTestId("batch-count-failed")).toHaveTextContent(
      "Failed 1"
    );
  });
});
