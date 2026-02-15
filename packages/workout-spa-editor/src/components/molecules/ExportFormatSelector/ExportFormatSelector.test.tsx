/**
 * ExportFormatSelector Component Tests
 *
 * Tests format selection, validation, warnings, and user interactions.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { KRD } from "../../../types/krd";
import { ExportFormatSelector } from "./ExportFormatSelector";

describe("ExportFormatSelector", () => {
  const mockWorkout: KRD = {
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

  describe("rendering", () => {
    it("should render with current format", () => {
      // Arrange & Act
      render(
        <ExportFormatSelector
          currentFormat="fit"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Assert
      const button = screen.getByRole("button", {
        name: /select export format/i,
      });
      expect(button).toBeInTheDocument();
      expect(screen.getByText("FIT")).toBeInTheDocument();
      expect(screen.getByText("(.fit)")).toBeInTheDocument();
    });

    it("should render all format options when opened", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Act
      await user.click(
        screen.getByRole("button", { name: /select export format/i })
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      const options = screen.getAllByRole("menuitem");
      expect(options).toHaveLength(5);

      expect(screen.getAllByText("FIT")).toHaveLength(1);
      expect(screen.getAllByText("TCX")).toHaveLength(1);
      expect(screen.getAllByText("ZWO")).toHaveLength(1);
      expect(screen.getAllByText("GCN")).toHaveLength(1);
      expect(screen.getAllByText("KRD")).toHaveLength(2); // One in button, one in dropdown
    });

    it("should show format descriptions", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Act
      await user.click(
        screen.getByRole("button", { name: /select export format/i })
      );

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(
            /Garmin FIT format - Binary format for fitness devices/i
          )
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Training Center XML - Garmin's XML workout format/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Zwift Workout - XML format for Zwift platform/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Kaiord format - JSON-based canonical workout format/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Garmin Connect JSON - Structured workout for Garmin Connect API/i
        )
      ).toBeInTheDocument();
    });

    it("should show compatibility information", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Act
      await user.click(
        screen.getByRole("button", { name: /select export format/i })
      );

      // Assert
      await waitFor(() => {
        expect(screen.getAllByText("Garmin devices")).toHaveLength(2); // FIT and GCN
      });

      expect(screen.getAllByText("Garmin Connect")).toHaveLength(3); // FIT, TCX, and GCN
      expect(screen.getAllByText("TrainingPeaks")).toHaveLength(2); // FIT and TCX
      expect(screen.getByText("Zwift")).toBeInTheDocument();
    });

    it("should highlight selected format", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="tcx"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Act
      await user.click(
        screen.getByRole("button", { name: /select export format/i })
      );

      // Assert
      await waitFor(() => {
        const tcxOption = screen
          .getAllByRole("menuitem")
          .find((opt) => opt.textContent?.includes("TCX"));
        expect(tcxOption).toHaveAttribute("aria-current", "true");
      });
    });
  });

  describe("interactions", () => {
    it("should call onFormatChange when format is selected", async () => {
      // Arrange
      const handleFormatChange = vi.fn();
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={handleFormatChange}
          workout={mockWorkout}
        />
      );

      // Act
      await user.click(
        screen.getByRole("button", { name: /select export format/i })
      );

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      const fitOption = screen
        .getAllByRole("menuitem")
        .find((opt) => opt.textContent?.includes("FIT"));
      await user.click(fitOption!);

      // Assert
      expect(handleFormatChange).toHaveBeenCalledWith("fit");
    });

    it("should close dropdown after selection", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Act
      await user.click(
        screen.getByRole("button", { name: /select export format/i })
      );

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      const tcxOption = screen
        .getAllByRole("menuitem")
        .find((opt) => opt.textContent?.includes("TCX"));
      await user.click(tcxOption!);

      // Assert
      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    it("should toggle dropdown on button click", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      const button = screen.getByRole("button", {
        name: /select export format/i,
      });

      // Act - Open
      await user.click(button);

      // Assert - Open
      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      // Act - Close
      await user.click(button);

      // Assert - Closed
      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    it("should not open dropdown when disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
          disabled
        />
      );

      // Act
      await user.click(
        screen.getByRole("button", { name: /select export format/i })
      );

      // Assert
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("should validate workout before format change", async () => {
      // Arrange
      const handleFormatChange = vi.fn();
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={handleFormatChange}
          workout={undefined}
        />
      );

      // Act
      await user.click(
        screen.getByRole("button", { name: /select export format/i })
      );

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      const fitOption = screen
        .getAllByRole("menuitem")
        .find((opt) => opt.textContent?.includes("FIT"));
      await user.click(fitOption!);

      // Assert
      expect(handleFormatChange).not.toHaveBeenCalled();
      expect(
        screen.getByText(/Cannot export structured workout/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/workout: No workout to export/i)
      ).toBeInTheDocument();
    });

    it("should show validation errors for invalid workout", async () => {
      // Arrange
      const invalidWorkout = {
        version: "1.0",
      } as KRD;
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={invalidWorkout}
        />
      );

      // Act
      await user.click(
        screen.getByRole("button", { name: /select export format/i })
      );

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      const fitOption = screen
        .getAllByRole("menuitem")
        .find((opt) => opt.textContent?.includes("FIT"));
      await user.click(fitOption!);

      // Assert
      expect(
        screen.getByText(/Cannot export structured workout/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/type: Missing type/i)).toBeInTheDocument();
      expect(
        screen.getByText(/metadata: Missing metadata/i)
      ).toBeInTheDocument();
    });

    it("should allow format change for valid workout", async () => {
      // Arrange
      const handleFormatChange = vi.fn();
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={handleFormatChange}
          workout={mockWorkout}
        />
      );

      // Act
      await user.click(
        screen.getByRole("button", { name: /select export format/i })
      );

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      const fitOption = screen
        .getAllByRole("menuitem")
        .find((opt) => opt.textContent?.includes("FIT"));
      await user.click(fitOption!);

      // Assert
      expect(handleFormatChange).toHaveBeenCalledWith("fit");
      expect(
        screen.queryByText(/Cannot export structured workout/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("warnings", () => {
    it("should show warning for FIT format", () => {
      // Arrange & Act
      render(
        <ExportFormatSelector
          currentFormat="fit"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Assert
      expect(
        screen.getByText(/FIT format may not support all workout features/i)
      ).toBeInTheDocument();
    });

    it("should show warning for TCX format", () => {
      // Arrange & Act
      render(
        <ExportFormatSelector
          currentFormat="tcx"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Assert
      expect(
        screen.getByText(/TCX format has limited support for advanced targets/i)
      ).toBeInTheDocument();
    });

    it("should show warning for ZWO format", () => {
      // Arrange & Act
      render(
        <ExportFormatSelector
          currentFormat="zwo"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Assert
      expect(
        screen.getByText(/ZWO format only supports cycling workouts/i)
      ).toBeInTheDocument();
    });

    it("should show warning for GCN format", () => {
      // Arrange & Act
      render(
        <ExportFormatSelector
          currentFormat="gcn"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Assert
      expect(
        screen.getByText(/GCN format is designed for the Garmin Connect API/i)
      ).toBeInTheDocument();
    });

    it("should not show warning for KRD format", () => {
      // Arrange & Act
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Assert
      expect(
        screen.queryByText(/may not support all workout features/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("states", () => {
    it("should be disabled when disabled prop is true", () => {
      // Arrange & Act
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
          disabled
        />
      );

      // Assert
      const button = screen.getByRole("button", {
        name: /select export format/i,
      });
      expect(button).toBeDisabled();
    });

    it("should apply custom className", () => {
      // Arrange & Act
      const { container } = render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
          className="custom-class"
        />
      );

      // Assert
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA attributes", () => {
      // Arrange & Act
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Assert
      const button = screen.getByRole("button", {
        name: /select export format/i,
      });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).toHaveAttribute("aria-haspopup", "menu");
    });

    it("should update aria-expanded when opened", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="krd"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      const button = screen.getByRole("button", {
        name: /select export format/i,
      });

      // Act
      await user.click(button);

      // Assert
      await waitFor(() => {
        expect(button).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("should mark selected option with aria-selected", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ExportFormatSelector
          currentFormat="fit"
          onFormatChange={vi.fn()}
          workout={mockWorkout}
        />
      );

      // Act
      await user.click(
        screen.getByRole("button", { name: /select export format/i })
      );

      // Assert
      await waitFor(() => {
        const fitOption = screen
          .getAllByRole("menuitem")
          .find((opt) => opt.textContent?.includes("FIT"));
        expect(fitOption).toHaveAttribute("aria-current", "true");
      });
    });
  });
});
