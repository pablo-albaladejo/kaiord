import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { formatOptions } from "./format-options";
import { FormatDropdown } from "./FormatDropdown";

const renderClosed = (onToggle: () => void) =>
  render(
    <FormatDropdown
      isOpen={false}
      currentFormat="krd"
      formatOptions={formatOptions}
      onToggle={onToggle}
      onFormatSelect={vi.fn()}
      disabled={false}
      label="Download a file"
    />
  );

describe("FormatDropdown opened from the keyboard", () => {
  it.each(["{Enter}", " "])(
    "should open the closed menu with %s, since it is the only download control",
    async (key) => {
      // Arrange
      const user = userEvent.setup();
      const onToggle = vi.fn();
      renderClosed(onToggle);
      screen.getByRole("button", { name: "Download a file" }).focus();

      // Act
      await user.keyboard(key);

      // Assert
      expect(onToggle).toHaveBeenCalledTimes(1);
    }
  );
});
