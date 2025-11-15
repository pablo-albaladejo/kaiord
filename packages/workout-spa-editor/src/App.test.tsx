import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

// Mock File.prototype.text() for testing environment
global.File.prototype.text = vi.fn();

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("should display welcome section when no workout is loaded", () => {
    render(<App />);

    expect(screen.getByText("Welcome to Workout Editor")).toBeInTheDocument();
    expect(screen.getByText("Upload Workout File")).toBeInTheDocument();
  });

  it("should load workout into state and display it when file is uploaded", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create a mock KRD file
    const mockKRD = {
      version: "1.0",
      type: "workout" as const,
      metadata: {
        created: "2025-01-15T10:30:00Z",
        sport: "running",
      },
      extensions: {
        workout: {
          name: "Test Workout",
          sport: "running",
          subSport: "trail",
          steps: [
            {
              stepIndex: 0,
              durationType: "time" as const,
              duration: {
                type: "time" as const,
                seconds: 300,
              },
              targetType: "heart_rate" as const,
              target: {
                type: "heart_rate" as const,
                value: {
                  unit: "zone" as const,
                  value: 2,
                },
              },
              intensity: "warmup" as const,
            },
          ],
        },
      },
    };

    // Mock File.text() to return valid KRD JSON
    vi.mocked(File.prototype.text).mockResolvedValue(JSON.stringify(mockKRD));

    const file = new File([JSON.stringify(mockKRD)], "test-workout.krd", {
      type: "application/json",
    });

    // Find and interact with file input
    const fileInput = screen.getByLabelText("Upload workout file");
    await user.upload(fileInput, file);

    // Wait for workout to be displayed
    await waitFor(() => {
      expect(screen.getByText("Test Workout")).toBeInTheDocument();
    });

    // Verify workout metadata is displayed
    expect(screen.getByText(/Sport: running/)).toBeInTheDocument();
    expect(screen.getByText(/trail/)).toBeInTheDocument();

    // Verify workout step is displayed
    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });
});
