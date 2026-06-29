/**
 * CreateRepetitionBlockButton Component Tests
 *
 * Tests for the create repetition block button component.
 * Requirement 7.1.1: Enable "Create Repetition Block" button when multiple steps selected
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CreateRepetitionBlockButton } from "./CreateRepetitionBlockButton";

const EXPECTED_CLICK_COUNT = 3;

describe("CreateRepetitionBlockButton", () => {
  describe("rendering", () => {
    it("should not render when less than 2 steps selected", () => {
      // Arrange

      // Act
      const { container } = render(
        <CreateRepetitionBlockButton selectedCount={0} onClick={vi.fn()} />
      );

      // Assert
      expect(container).toBeEmptyDOMElement();
    });

    it("should not render when exactly 1 step selected", () => {
      // Arrange

      // Act
      const { container } = render(
        <CreateRepetitionBlockButton selectedCount={1} onClick={vi.fn()} />
      );

      // Assert
      expect(container).toBeEmptyDOMElement();
    });

    it("should render when 2 steps selected", () => {
      // Arrange
      render(
        <CreateRepetitionBlockButton selectedCount={2} onClick={vi.fn()} />
      );

      // Act
      const button = screen.getByRole("button", {
        name: "Create repetition block from 2 selected steps",
      });

      // Assert
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Create Repetition Block (2 steps)");
    });

    it("should render when 3 steps selected", () => {
      // Arrange
      render(
        <CreateRepetitionBlockButton selectedCount={3} onClick={vi.fn()} />
      );

      // Act
      const button = screen.getByRole("button");

      // Assert
      expect(button).toHaveTextContent("Create Repetition Block (3 steps)");
    });

    it("should display correct count for multiple steps", () => {
      // Arrange

      // Act
      render(
        <CreateRepetitionBlockButton selectedCount={5} onClick={vi.fn()} />
      );

      // Assert
      expect(
        screen.getByRole("button", {
          name: "Create repetition block from 5 selected steps",
        })
      ).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      // Arrange
      render(
        <CreateRepetitionBlockButton
          selectedCount={2}
          onClick={vi.fn()}
          className="custom-class"
        />
      );

      // Act
      const button = screen.getByRole("button");

      // Assert
      expect(button).toHaveClass("custom-class");
    });

    it("should have correct data-testid", () => {
      // Arrange

      // Act
      render(
        <CreateRepetitionBlockButton selectedCount={2} onClick={vi.fn()} />
      );

      // Assert
      expect(
        screen.getByTestId("create-repetition-block-button")
      ).toBeInTheDocument();
    });

    it("should render Repeat icon", () => {
      // Arrange
      render(
        <CreateRepetitionBlockButton selectedCount={2} onClick={vi.fn()} />
      );
      const button = screen.getByRole("button");

      // Act
      const icon = button.querySelector("svg");

      // Assert
      expect(icon).toBeInTheDocument();
    });
  });

  describe("states", () => {
    it("should be enabled by default", () => {
      // Arrange
      render(
        <CreateRepetitionBlockButton selectedCount={2} onClick={vi.fn()} />
      );

      // Act
      const button = screen.getByRole("button");

      // Assert
      expect(button).not.toBeDisabled();
    });

    it("should be disabled when disabled prop is true", () => {
      // Arrange
      render(
        <CreateRepetitionBlockButton
          selectedCount={2}
          onClick={vi.fn()}
          disabled={true}
        />
      );

      // Act
      const button = screen.getByRole("button");

      // Assert
      expect(button).toBeDisabled();
    });

    it("should be enabled when disabled prop is false", () => {
      // Arrange
      render(
        <CreateRepetitionBlockButton
          selectedCount={2}
          onClick={vi.fn()}
          disabled={false}
        />
      );

      // Act
      const button = screen.getByRole("button");

      // Assert
      expect(button).not.toBeDisabled();
    });
  });

  describe("interactions", () => {
    it("should call onClick when clicked", async () => {
      // Arrange
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockButton selectedCount={2} onClick={handleClick} />
      );

      // Act
      await user.click(screen.getByRole("button"));

      // Assert
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it("should not call onClick when disabled", async () => {
      // Arrange
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockButton
          selectedCount={2}
          onClick={handleClick}
          disabled={true}
        />
      );

      // Act
      await user.click(screen.getByRole("button"));

      // Assert
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("should call onClick multiple times when clicked multiple times", async () => {
      // Arrange
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockButton selectedCount={2} onClick={handleClick} />
      );

      // Act
      await user.click(screen.getByRole("button"));
      await user.click(screen.getByRole("button"));
      await user.click(screen.getByRole("button"));

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(EXPECTED_CLICK_COUNT);
    });
  });

  describe("accessibility", () => {
    it("should have proper aria-label with step count", () => {
      // Arrange
      render(
        <CreateRepetitionBlockButton selectedCount={4} onClick={vi.fn()} />
      );

      // Act
      const button = screen.getByRole("button", {
        name: "Create repetition block from 4 selected steps",
      });

      // Assert
      expect(button).toBeInTheDocument();
    });

    it("should be keyboard accessible", async () => {
      // Arrange
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockButton selectedCount={2} onClick={handleClick} />
      );
      const button = screen.getByRole("button");
      button.focus();

      // Act
      await user.keyboard("{Enter}");

      // Assert
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it("should be keyboard accessible with Space key", async () => {
      // Arrange
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <CreateRepetitionBlockButton selectedCount={2} onClick={handleClick} />
      );
      const button = screen.getByRole("button");
      button.focus();

      // Act
      await user.keyboard(" ");

      // Assert
      expect(handleClick).toHaveBeenCalledOnce();
    });
  });
});
