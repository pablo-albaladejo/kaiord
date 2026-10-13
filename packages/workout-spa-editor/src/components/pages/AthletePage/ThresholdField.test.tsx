import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ThresholdField } from "./ThresholdField";

const FTP = 250;

const renderField = (onSave: (value: number | undefined) => Promise<boolean>) =>
  render(
    <ThresholdField
      label="FTP (W)"
      shown=""
      parse={(raw) => (raw === "" ? undefined : Number(raw))}
      onSave={onSave}
      invalidMessage="invalid"
      placeholder="250"
      numeric
    />
  );

describe("ThresholdField", () => {
  it("should let the same value be saved again after a failed write", async () => {
    // Arrange
    const onSave = vi.fn().mockResolvedValue(false);
    renderField(onSave);
    const input = screen.getByLabelText("FTP (W)");
    await userEvent.type(input, String(FTP));

    // Act
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    await userEvent.keyboard("{Enter}");

    // Assert
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave).toHaveBeenLastCalledWith(FTP);
  });

  it("should not save on the Enter that confirms an IME composition", () => {
    // Arrange
    const onSave = vi.fn().mockResolvedValue(true);
    renderField(onSave);
    const input = screen.getByLabelText("FTP (W)");
    fireEvent.change(input, { target: { value: String(FTP) } });

    // Act
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });

    // Assert
    expect(onSave).not.toHaveBeenCalled();
  });
});
