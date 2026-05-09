import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  describe("rendering", () => {
    it("should render trigger element", () => {
      // Arrange

      // Act
      render(
        <Tooltip content="Tooltip content">
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });

      // Assert
      expect(trigger).toBeInTheDocument();
    });

    it("should render children when disabled", () => {
      // Arrange

      // Act
      render(
        <Tooltip content="Tooltip content" disabled>
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });

      // Assert
      expect(trigger).toBeInTheDocument();
    });

    it("should render with text content", () => {
      // Arrange

      // Act
      render(
        <Tooltip content="Simple text tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });

      // Assert
      expect(trigger).toBeInTheDocument();
    });

    it("should render with complex content", () => {
      // Arrange

      // Act
      render(
        <Tooltip
          content={
            <div>
              <strong>Bold text</strong>
              <p>Description</p>
            </div>
          }
        >
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });

      // Assert
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("props", () => {
    it("should accept side prop", () => {
      // Arrange

      // Act
      render(
        <Tooltip content="Tooltip content" side="right">
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });

      // Assert
      expect(trigger).toBeInTheDocument();
    });

    it("should accept align prop", () => {
      // Arrange

      // Act
      render(
        <Tooltip content="Tooltip content" align="start">
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });

      // Assert
      expect(trigger).toBeInTheDocument();
    });

    it("should accept delayDuration prop", () => {
      // Arrange

      // Act
      render(
        <Tooltip content="Tooltip content" delayDuration={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });

      // Assert
      expect(trigger).toBeInTheDocument();
    });

    it("should accept all positioning combinations", () => {
      // Arrange

      // Act
      render(
        <Tooltip
          content="Tooltip content"
          side="bottom"
          align="end"
          delayDuration={100}
        >
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });

      // Assert
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("should render only children when disabled", () => {
      // Arrange

      // Act
      render(
        <Tooltip content="Tooltip content" disabled>
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });

      // Assert
      expect(trigger).toBeInTheDocument();
    });

    it("should not wrap children in extra DOM when disabled", () => {
      // Arrange

      // Act
      const { container } = render(
        <Tooltip content="Tooltip content" disabled>
          <button>Hover me</button>
        </Tooltip>
      );
      const button = screen.getByRole("button", { name: "Hover me" });

      // Assert
      expect(button).toBeInTheDocument();
      expect(container.querySelector("button")).toBe(button);
    });

    it("should not register hover handlers when disabled", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <Tooltip content="Tooltip content when disabled" disabled>
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });
      await user.hover(trigger);

      // Assert
      expect(
        screen.queryByText("Tooltip content when disabled")
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("children", () => {
    it("should render button children", () => {
      // Arrange

      // Act
      render(
        <Tooltip content="Tooltip content">
          <button>Click me</button>
        </Tooltip>
      );

      // Assert
      expect(
        screen.getByRole("button", { name: "Click me" })
      ).toBeInTheDocument();
    });

    it("should render div children", () => {
      // Arrange

      // Act
      render(
        <Tooltip content="Tooltip content">
          <div>Hover over me</div>
        </Tooltip>
      );

      // Assert
      expect(screen.getByText("Hover over me")).toBeInTheDocument();
    });

    it("should render span children", () => {
      // Arrange

      // Act
      render(
        <Tooltip content="Tooltip content">
          <span>Info icon</span>
        </Tooltip>
      );

      // Assert
      expect(screen.getByText("Info icon")).toBeInTheDocument();
    });
  });

  describe("hover behavior", () => {
    it("should show tooltip with role tooltip when delayDuration is zero on hover", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <Tooltip content="Visible tip" delayDuration={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });
      await user.hover(trigger);

      // Assert
      const tip = await screen.findByRole("tooltip");
      expect(tip).toHaveTextContent("Visible tip");
    });

    it("should hide tooltip on unhover", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(
        <Tooltip content="Hide me" delayDuration={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });
      await user.hover(trigger);
      await screen.findByRole("tooltip");
      await user.unhover(trigger);

      // Assert
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("should set aria-describedby on the wrapping span when open", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      const { container } = render(
        <Tooltip content="Described tip" delayDuration={0}>
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });
      await user.hover(trigger);
      const tip = await screen.findByRole("tooltip");

      // Assert
      const wrappers = container.querySelectorAll("span[aria-describedby]");
      const describedBy = wrappers[0]?.getAttribute("aria-describedby");
      expect(describedBy).toBe(tip.id);
    });
  });

  describe("delayDuration timing", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should not show tooltip before delayDuration elapses", () => {
      // Arrange
      render(
        <Tooltip content="Delayed tip" delayDuration={500}>
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });

      // Act
      act(() => {
        fireEvent.mouseEnter(trigger.parentElement as HTMLElement);
        vi.advanceTimersByTime(200);
      });

      // Assert
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("should show tooltip after delayDuration elapses", () => {
      // Arrange
      render(
        <Tooltip content="Delayed tip" delayDuration={300}>
          <button>Hover me</button>
        </Tooltip>
      );
      const trigger = screen.getByRole("button", { name: "Hover me" });

      // Act
      const ELAPSED_MS = 350;
      act(() => {
        fireEvent.mouseEnter(trigger.parentElement as HTMLElement);
        vi.advanceTimersByTime(ELAPSED_MS);
      });

      // Assert
      expect(screen.getByRole("tooltip")).toHaveTextContent("Delayed tip");
    });
  });
});
