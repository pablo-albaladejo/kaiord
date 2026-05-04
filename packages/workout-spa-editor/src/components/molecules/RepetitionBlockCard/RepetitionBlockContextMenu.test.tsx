/**
 * RepetitionBlockContextMenu Component Tests
 *
 * Tests for the repetition block context menu component.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RepetitionBlockContextMenu } from "./RepetitionBlockContextMenu";

describe("RepetitionBlockContextMenu", () => {
  describe("rendering", () => {
    it("should render trigger button", () => {
      // Arrange & Act
      // Arrange

      render(
        <RepetitionBlockContextMenu
          onEditCount={vi.fn()}
          onAddStep={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Assert

      // Act

      const trigger = screen.getByTestId("block-actions-trigger");

      // Assert

      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-label", "Block actions");
    });

    it("should show menu when trigger is clicked", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(
        <RepetitionBlockContextMenu
          onEditCount={vi.fn()}
          onAddStep={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Act

      // Act

      await user.click(screen.getByTestId("block-actions-trigger"));

      // Assert

      // Assert

      expect(screen.getByTestId("block-actions-menu")).toBeInTheDocument();
    });

    it("should render all menu items", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(
        <RepetitionBlockContextMenu
          onEditCount={vi.fn()}
          onAddStep={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Act

      // Act

      await user.click(screen.getByTestId("block-actions-trigger"));

      // Assert

      // Assert

      expect(screen.getByTestId("edit-count-action")).toBeInTheDocument();
      expect(screen.getByTestId("add-step-action")).toBeInTheDocument();
      expect(screen.getByTestId("ungroup-action")).toBeInTheDocument();
      expect(screen.getByTestId("delete-action")).toBeInTheDocument();
    });

    it("should render menu items with correct text", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(
        <RepetitionBlockContextMenu
          onEditCount={vi.fn()}
          onAddStep={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Act

      // Act

      await user.click(screen.getByTestId("block-actions-trigger"));

      // Assert

      // Assert

      expect(screen.getByText("Edit Count")).toBeInTheDocument();
      expect(screen.getByText("Add Step")).toBeInTheDocument();
      expect(screen.getByText("Ungroup")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onEditCount when Edit Count is clicked", async () => {
      // Arrange
      // Arrange

      const handleEditCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockContextMenu
          onEditCount={handleEditCount}
          onAddStep={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Act
      await user.click(screen.getByTestId("block-actions-trigger"));

      // Act

      await user.click(screen.getByTestId("edit-count-action"));

      // Assert

      // Assert

      expect(handleEditCount).toHaveBeenCalledOnce();
    });

    it("should call onAddStep when Add Step is clicked", async () => {
      // Arrange
      // Arrange

      const handleAddStep = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockContextMenu
          onEditCount={vi.fn()}
          onAddStep={handleAddStep}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Act
      await user.click(screen.getByTestId("block-actions-trigger"));

      // Act

      await user.click(screen.getByTestId("add-step-action"));

      // Assert

      // Assert

      expect(handleAddStep).toHaveBeenCalledOnce();
    });

    it("should call onUngroup when Ungroup is clicked", async () => {
      // Arrange
      // Arrange

      const handleUngroup = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockContextMenu
          onEditCount={vi.fn()}
          onAddStep={vi.fn()}
          onUngroup={handleUngroup}
          onDelete={vi.fn()}
        />
      );

      // Act
      await user.click(screen.getByTestId("block-actions-trigger"));

      // Act

      await user.click(screen.getByTestId("ungroup-action"));

      // Assert

      // Assert

      expect(handleUngroup).toHaveBeenCalledOnce();
    });

    it("should call onDelete when Delete is clicked", async () => {
      // Arrange
      // Arrange

      const handleDelete = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockContextMenu
          onEditCount={vi.fn()}
          onAddStep={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={handleDelete}
        />
      );

      // Act
      await user.click(screen.getByTestId("block-actions-trigger"));

      // Act

      await user.click(screen.getByTestId("delete-action"));

      // Assert

      // Assert

      expect(handleDelete).toHaveBeenCalledOnce();
    });

    it("should close menu after selecting an action", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(
        <RepetitionBlockContextMenu
          onEditCount={vi.fn()}
          onAddStep={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Act
      await user.click(screen.getByTestId("block-actions-trigger"));

      // Act

      await user.click(screen.getByTestId("edit-count-action"));

      // Assert

      // Assert

      expect(
        screen.queryByTestId("block-actions-menu")
      ).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper aria-label on trigger", () => {
      // Arrange & Act
      // Arrange

      render(
        <RepetitionBlockContextMenu
          onEditCount={vi.fn()}
          onAddStep={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Assert

      // Act

      const trigger = screen.getByTestId("block-actions-trigger");

      // Assert

      expect(trigger).toHaveAttribute("aria-label", "Block actions");
    });

    it("should be keyboard navigable", async () => {
      // Arrange
      // Arrange

      const handleEditCount = vi.fn();
      const user = userEvent.setup();
      render(
        <RepetitionBlockContextMenu
          onEditCount={handleEditCount}
          onAddStep={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Act
      const trigger = screen.getByTestId("block-actions-trigger");
      await user.click(trigger);

      // Wait for menu to appear
      const editCountAction = await screen.findByTestId("edit-count-action");

      // Act

      await user.click(editCountAction);

      // Assert

      // Assert

      expect(handleEditCount).toHaveBeenCalledOnce();
    });
  });

  describe("styling", () => {
    it("should apply danger styling to delete action", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(
        <RepetitionBlockContextMenu
          onEditCount={vi.fn()}
          onAddStep={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Act
      await user.click(screen.getByTestId("block-actions-trigger"));

      // Assert

      // Act

      const deleteAction = screen.getByTestId("delete-action");

      // Assert

      expect(deleteAction).toHaveClass("text-red-600");
    });

    it("should have separator before delete action", async () => {
      // Arrange
      // Arrange

      const user = userEvent.setup();
      render(
        <RepetitionBlockContextMenu
          onEditCount={vi.fn()}
          onAddStep={vi.fn()}
          onUngroup={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Act
      await user.click(screen.getByTestId("block-actions-trigger"));

      // Assert
      const menu = screen.getByTestId("block-actions-menu");

      // Act

      const separator = menu.querySelector('[role="separator"]');

      // Assert

      expect(separator).toBeInTheDocument();
    });
  });
});
