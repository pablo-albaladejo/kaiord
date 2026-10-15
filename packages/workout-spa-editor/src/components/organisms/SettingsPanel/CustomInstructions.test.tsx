import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CustomInstructions } from "./CustomInstructions";

const PAST_THE_PAUSE_MS = 1000;

const field = () => screen.getByLabelText(/additional instructions/i);

const type = (value: string) =>
  fireEvent.change(field(), { target: { value } });

describe("CustomInstructions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not write while the athlete is still typing", () => {
    // Arrange
    const onSave = vi.fn(async () => true);
    render(<CustomInstructions value="" onSave={onSave} />);

    // Act
    type("K");
    type("Kn");
    type("Kne");

    // Assert
    expect(onSave).not.toHaveBeenCalled();
    expect(field()).toHaveValue("Kne");
  });

  it("should save once after a pause, and say it was saved", async () => {
    // Arrange
    const onSave = vi.fn(async () => true);
    render(<CustomInstructions value="" onSave={onSave} />);
    type("K");
    type("Knee");

    // Act
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PAST_THE_PAUSE_MS);
    });

    // Assert
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("Knee");
    expect(screen.getByRole("status")).toHaveTextContent("Saved ✓");
  });

  it("should save right away when the field loses focus", async () => {
    // Arrange
    const onSave = vi.fn(async () => true);
    render(<CustomInstructions value="" onSave={onSave} />);
    type("Knee");

    // Act
    await act(async () => {
      fireEvent.blur(field());
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PAST_THE_PAUSE_MS);
    });

    // Assert
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("Knee");
  });

  it("should not save on blur when nothing changed", async () => {
    // Arrange
    const onSave = vi.fn(async () => true);
    render(<CustomInstructions value="Knee" onSave={onSave} />);

    // Act
    await act(async () => {
      fireEvent.blur(field());
    });

    // Assert
    expect(onSave).not.toHaveBeenCalled();
    expect(field()).toHaveValue("Knee");
  });

  it("should say so when the save fails", async () => {
    // Arrange
    const onSave = vi.fn(async () => false);
    render(<CustomInstructions value="" onSave={onSave} />);
    type("Knee");

    // Act
    await act(async () => {
      fireEvent.blur(field());
    });

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent(
      "Could not save. Try again."
    );
  });
});
