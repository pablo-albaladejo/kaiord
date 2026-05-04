import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  describe("rendering", () => {
    it("should render copy button with correct label", () => {
      // Arrange & Act
      // Arrange

      render(<CopyButton stepIndex={0} onCopy={vi.fn()} />);

      // Assert

      // Act

      const button = screen.getByRole("button", { name: "Copy step 1" });

      // Assert

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("title", "Copy step to clipboard");
    });

    it("should render with clipboard icon", () => {
      // Arrange & Act
      // Arrange

      render(<CopyButton stepIndex={0} onCopy={vi.fn()} />);

      // Assert

      // Act

      const button = screen.getByTestId("copy-step-button");

      // Assert

      expect(button.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onCopy when clicked", async () => {
      // Arrange
      // Arrange

      const handleCopy = vi.fn();
      const user = userEvent.setup();
      render(<CopyButton stepIndex={2} onCopy={handleCopy} />);

      // Act

      // Act

      await user.click(screen.getByRole("button"));

      // Assert

      // Assert

      expect(handleCopy).toHaveBeenCalledOnce();
      expect(handleCopy).toHaveBeenCalledWith(2);
    });

    it("should stop event propagation when clicked", async () => {
      // Arrange
      // Arrange

      const handleCopy = vi.fn();
      const handleParentClick = vi.fn();
      const user = userEvent.setup();

      render(
        <div onClick={handleParentClick}>
          <CopyButton stepIndex={0} onCopy={handleCopy} />
        </div>
      );

      // Act

      // Act

      await user.click(screen.getByRole("button"));

      // Assert

      // Assert

      expect(handleCopy).toHaveBeenCalledOnce();
      expect(handleParentClick).not.toHaveBeenCalled();
    });
  });
});
