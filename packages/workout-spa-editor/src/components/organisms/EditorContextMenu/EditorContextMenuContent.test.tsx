import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock Radix primitives to render as plain HTML
vi.mock("@radix-ui/react-context-menu", () => ({
  Content: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid={props["data-testid"] as string}>{children}</div>
  ),
  Item: ({
    children,
    ...props
  }: React.PropsWithChildren<{
    onSelect?: () => void;
    className?: string;
    "aria-keyshortcuts"?: string;
  }>) => (
    <div
      role="menuitem"
      aria-keyshortcuts={props["aria-keyshortcuts"]}
      onClick={props.onSelect}
    >
      {children}
    </div>
  ),
  Separator: () => <hr role="separator" />,
}));

import { EditorContextMenuContent } from "./EditorContextMenuContent";

const noop = vi.fn();

const defaultProps = {
  showCut: false,
  showCopy: false,
  showPaste: false,
  showDelete: false,
  showSelectAll: false,
  showGroup: false,
  showUngroup: false,
  onCut: noop,
  onCopy: noop,
  onPaste: noop,
  onDelete: noop,
  onSelectAll: noop,
  onGroup: noop,
  onUngroup: noop,
};

const renderContent = (overrides: Partial<typeof defaultProps> = {}) =>
  render(<EditorContextMenuContent {...defaultProps} {...overrides} />);

describe("EditorContextMenuContent", () => {
  describe("visibility logic", () => {
    it("should hide Cut when showCut is false", () => {
      // Arrange

      // Act

      renderContent({ showCut: false });

      // Assert

      expect(screen.queryByText("Cut")).toBeNull();
    });

    it("should show Cut when showCut is true", () => {
      // Arrange

      // Act

      renderContent({ showCut: true });

      // Assert

      expect(screen.getByText("Cut")).toBeTruthy();
    });

    it("should hide Copy when showCopy is false", () => {
      // Arrange

      // Act

      renderContent({ showCopy: false });

      // Assert

      expect(screen.queryByText("Copy")).toBeNull();
    });

    it("should show Copy when showCopy is true", () => {
      // Arrange

      // Act

      renderContent({ showCopy: true });

      // Assert

      expect(screen.getByText("Copy")).toBeTruthy();
    });

    it("should hide Paste when showPaste is false", () => {
      // Arrange

      // Act

      renderContent({ showPaste: false });

      // Assert

      expect(screen.queryByText("Paste")).toBeNull();
    });

    it("should show Paste when showPaste is true", () => {
      // Arrange

      // Act

      renderContent({ showPaste: true });

      // Assert

      expect(screen.getByText("Paste")).toBeTruthy();
    });

    it("should hide Delete when showDelete is false", () => {
      // Arrange

      // Act

      renderContent({ showDelete: false });

      // Assert

      expect(screen.queryByText("Delete")).toBeNull();
    });

    it("should show Delete when showDelete is true", () => {
      // Arrange

      // Act

      renderContent({ showDelete: true });

      // Assert

      expect(screen.getByText("Delete")).toBeTruthy();
    });

    it("should hide Select All when showSelectAll is false", () => {
      // Arrange

      // Act

      renderContent({ showSelectAll: false });

      // Assert

      expect(screen.queryByText("Select All")).toBeNull();
    });

    it("should show Select All when showSelectAll is true", () => {
      // Arrange

      // Act

      renderContent({ showSelectAll: true });

      // Assert

      expect(screen.getByText("Select All")).toBeTruthy();
    });

    it("should hide Group when showGroup is false", () => {
      // Arrange

      // Act

      renderContent({ showGroup: false });

      // Assert

      expect(screen.queryByText("Group")).toBeNull();
    });

    it("should show Group when showGroup is true", () => {
      // Arrange

      // Act

      renderContent({ showGroup: true });

      // Assert

      expect(screen.getByText("Group")).toBeTruthy();
    });

    it("should hide Ungroup when showUngroup is false", () => {
      // Arrange

      // Act

      renderContent({ showUngroup: false });

      // Assert

      expect(screen.queryByText("Ungroup")).toBeNull();
    });

    it("should show Ungroup when showUngroup is true", () => {
      // Arrange

      // Act

      renderContent({ showUngroup: true });

      // Assert

      expect(screen.getByText("Ungroup")).toBeTruthy();
    });
  });

  describe("separator", () => {
    it("should show separator when both edit and structural actions present", () => {
      // Arrange

      const { container } = renderContent({
        showCopy: true,
        showSelectAll: true,
      });

      // Act

      const separator = container.querySelector("[role='separator']");

      // Assert

      expect(separator).toBeTruthy();
    });

    it("should not show separator when only edit actions present", () => {
      // Arrange

      const { container } = renderContent({ showCopy: true });

      // Act

      const separator = container.querySelector("[role='separator']");

      // Assert

      expect(separator).toBeNull();
    });

    it("should not show separator when only structural actions present", () => {
      // Arrange

      const { container } = renderContent({ showSelectAll: true });

      // Act

      const separator = container.querySelector("[role='separator']");

      // Assert

      expect(separator).toBeNull();
    });
  });

  describe("aria-keyshortcuts", () => {
    it("should include aria-keyshortcuts on Copy item", () => {
      // Arrange

      renderContent({ showCopy: true });

      // Act

      const item = screen.getByText("Copy").closest("[role='menuitem']");

      // Assert

      expect(item?.getAttribute("aria-keyshortcuts")).toMatch(
        /^(Meta|Control)\+C$/
      );
    });

    it("should include aria-keyshortcuts on Delete item", () => {
      // Arrange

      renderContent({ showDelete: true });

      // Act

      const item = screen.getByText("Delete").closest("[role='menuitem']");

      // Assert

      expect(item?.getAttribute("aria-keyshortcuts")).toBe("Delete");
    });
  });
});
