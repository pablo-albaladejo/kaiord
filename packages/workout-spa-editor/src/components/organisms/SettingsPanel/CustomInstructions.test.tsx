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

  it("should not say saved while newer text still waits to be saved", async () => {
    // Arrange
    let finish: (ok: boolean) => void = () => {};
    const onSave = vi.fn(
      () => new Promise<boolean>((resolve) => (finish = resolve))
    );
    render(<CustomInstructions value="" onSave={onSave} />);
    type("Knee");
    await act(async () => {
      fireEvent.blur(field());
    });
    type("Knee pain");

    // Act
    await act(async () => {
      finish(true);
    });

    // Assert
    expect(screen.getByRole("status")).not.toHaveTextContent("Saved ✓");
  });

  it("should ignore an older save that lands after a newer one", async () => {
    // Arrange
    const finishers: Array<(ok: boolean) => void> = [];
    const onSave = vi.fn(
      () => new Promise<boolean>((resolve) => finishers.push(resolve))
    );
    render(<CustomInstructions value="" onSave={onSave} />);
    type("Knee");
    await act(async () => {
      fireEvent.blur(field());
    });
    type("Knee pain");
    await act(async () => {
      fireEvent.blur(field());
    });

    // Act
    await act(async () => {
      finishers[1]!(false);
    });
    await act(async () => {
      finishers[0]!(true);
    });

    // Assert
    expect(screen.getByRole("status")).toHaveTextContent(
      "Could not save. Try again."
    );
  });

  it("should try a failed save again when the field is left again", async () => {
    // Arrange
    const onSave = vi
      .fn<(value: string) => Promise<boolean>>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    render(<CustomInstructions value="" onSave={onSave} />);
    type("Knee");
    await act(async () => {
      fireEvent.blur(field());
    });

    // Act
    await act(async () => {
      fireEvent.blur(field());
    });

    // Assert
    expect(onSave).toHaveBeenNthCalledWith(2, "Knee");
    expect(screen.getByRole("status")).toHaveTextContent("Saved ✓");
  });

  it("should not write the same text again when the field is left during its save", async () => {
    // Arrange
    let finish: (ok: boolean) => void = () => {};
    const onSave = vi.fn(
      () => new Promise<boolean>((resolve) => (finish = resolve))
    );
    render(<CustomInstructions value="" onSave={onSave} />);
    type("Knee");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PAST_THE_PAUSE_MS);
    });

    // Act
    await act(async () => {
      fireEvent.blur(field());
    });
    await act(async () => {
      finish(true);
    });

    // Assert
    expect(onSave).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("Saved ✓");
  });

  it("should save a change still pending when it goes away", () => {
    // Arrange
    const onSave = vi.fn(async () => true);
    const { unmount } = render(<CustomInstructions value="" onSave={onSave} />);
    type("Knee");

    // Act
    unmount();

    // Assert
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith("Knee");
  });
});
