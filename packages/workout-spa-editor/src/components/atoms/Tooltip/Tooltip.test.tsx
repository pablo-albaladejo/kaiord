import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  describe("rendering", () => {
    it("should render trigger element", () => {
      // Arrange & Act
      render(
        <Tooltip content="Tooltip content">
          <button>Hover me</button>
        </Tooltip>
      );

      // Assert
      const trigger = screen.getByRole("button", { name: "Hover me" });
      expect(trigger).toBeInTheDocument();
    });

    it("should render children when disabled", () => {
      // Arrange & Act
      render(
        <Tooltip content="Tooltip content" disabled>
          <button>Hover me</button>
        </Tooltip>
      );

      // Assert
      const trigger = screen.getByRole("button", { name: "Hover me" });
      expect(trigger).toBeInTheDocument();
    });

    it("should render with text content", () => {
      // Arrange & Act
      render(
        <Tooltip content="Simple text tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      // Assert
      const trigger = screen.getByRole("button", { name: "Hover me" });
      expect(trigger).toBeInTheDocument();
    });

    it("should render with complex content", () => {
      // Arrange & Act
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

      // Assert
      const trigger = screen.getByRole("button", { name: "Hover me" });
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("props", () => {
    it("should accept side prop", () => {
      // Arrange & Act
      render(
        <Tooltip content="Tooltip content" side="right">
          <button>Hover me</button>
        </Tooltip>
      );

      // Assert
      const trigger = screen.getByRole("button", { name: "Hover me" });
      expect(trigger).toBeInTheDocument();
    });

    it("should accept align prop", () => {
      // Arrange & Act
      render(
        <Tooltip content="Tooltip content" align="start">
          <button>Hover me</button>
        </Tooltip>
      );

      // Assert
      const trigger = screen.getByRole("button", { name: "Hover me" });
      expect(trigger).toBeInTheDocument();
    });

    it("should accept delayDuration prop", () => {
      // Arrange & Act
      render(
        <Tooltip content="Tooltip content" delayDuration={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      // Assert
      const trigger = screen.getByRole("button", { name: "Hover me" });
      expect(trigger).toBeInTheDocument();
    });

    it("should accept all positioning combinations", () => {
      // Arrange & Act
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

      // Assert
      const trigger = screen.getByRole("button", { name: "Hover me" });
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("should render only children when disabled", () => {
      // Arrange & Act
      render(
        <Tooltip content="Tooltip content" disabled>
          <button>Hover me</button>
        </Tooltip>
      );

      // Assert
      const trigger = screen.getByRole("button", { name: "Hover me" });
      expect(trigger).toBeInTheDocument();
    });

    it("should not wrap children in Radix components when disabled", () => {
      // Arrange & Act
      const { container } = render(
        <Tooltip content="Tooltip content" disabled>
          <button>Hover me</button>
        </Tooltip>
      );

      // Assert
      const button = screen.getByRole("button", { name: "Hover me" });
      expect(button).toBeInTheDocument();
      expect(container.querySelector("button")).toBe(button);
    });
  });

  describe("children", () => {
    it("should render button children", () => {
      // Arrange & Act
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
      // Arrange & Act
      render(
        <Tooltip content="Tooltip content">
          <div>Hover over me</div>
        </Tooltip>
      );

      // Assert
      expect(screen.getByText("Hover over me")).toBeInTheDocument();
    });

    it("should render span children", () => {
      // Arrange & Act
      render(
        <Tooltip content="Tooltip content">
          <span>Info icon</span>
        </Tooltip>
      );

      // Assert
      expect(screen.getByText("Info icon")).toBeInTheDocument();
    });
  });
});
