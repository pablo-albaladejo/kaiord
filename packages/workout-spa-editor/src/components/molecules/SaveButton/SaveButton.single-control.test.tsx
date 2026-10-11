import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { KRD } from "../../../types/krd";
import { ToastProvider } from "../../atoms/Toast";
import { SaveButton } from "./SaveButton";

vi.mock("../../../utils/export-workout");

const { exportWorkout, downloadWorkout } =
  await import("../../../utils/export-workout");

const workout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-10-11T08:00:00Z", sport: "running" },
  extensions: {
    structured_workout: {
      name: "Rodaje auditoría",
      sport: "running",
      steps: [],
    },
  },
};

describe("SaveButton with the real format menu", () => {
  it("should download from one control: open it and pick the format", async () => {
    // Arrange
    const user = userEvent.setup();
    const buffer = new Uint8Array([1]);
    vi.mocked(exportWorkout).mockResolvedValue(buffer);
    render(
      <ToastProvider>
        <SaveButton workout={workout} />
      </ToastProvider>
    );
    const control = screen.getByRole("button", { name: /download a file/i });

    // Act
    await user.click(control);
    await user.click(screen.getByTestId("export-format-option-fit"));

    // Assert
    expect(screen.getAllByRole("button", { name: /download a file/i })).toEqual(
      [control]
    );
    expect(control).toHaveAttribute("aria-haspopup", "menu");
    await waitFor(() =>
      expect(downloadWorkout).toHaveBeenCalledWith(
        buffer,
        "rodaje_auditoria.fit",
        "fit"
      )
    );
    expect(
      await screen.findByText("Downloaded as rodaje_auditoria.fit")
    ).toBeInTheDocument();
  });
});
