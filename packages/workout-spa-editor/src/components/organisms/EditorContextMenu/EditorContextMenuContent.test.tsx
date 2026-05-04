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
      renderContent({ showCut: false });
      expect(screen.queryByText("Cut")).toBeNull();
    });

    it("should show Cut when showCut is true", () => {
      renderContent({ showCut: true });
      expect(screen.getByText("Cut")).toBeTruthy();
    });

    it("should hide Copy when showCopy is false", () => {
      renderContent({ showCopy: false });
      expect(screen.queryByText("Copy")).toBeNull();
    });

    it("should show Copy when showCopy is true", () => {
      renderContent({ showCopy: true });
      expect(screen.getByText("Copy")).toBeTruthy();
    });

    it("should hide Paste when showPaste is false", () => {
      renderContent({ showPaste: false });
      expect(screen.queryByText("Paste")).toBeNull();
    });

    it("should show Paste when showPaste is true", () => {
      renderContent({ showPaste: true });
      expect(screen.getByText("Paste")).toBeTruthy();
    });

    it("should hide Delete when showDelete is false", () => {
      renderContent({ showDelete: false });
      expect(screen.queryByText("Delete")).toBeNull();
    });

    it("should show Delete when showDelete is true", () => {
      renderContent({ showDelete: true });
      expect(screen.getByText("Delete")).toBeTruthy();
    });

    it("should hide Select All when showSelectAll is false", () => {
      renderContent({ showSelectAll: false });
      expect(screen.queryByText("Select All")).toBeNull();
    });

    it("should show Select All when showSelectAll is true", () => {
      renderContent({ showSelectAll: true });
      expect(screen.getByText("Select All")).toBeTruthy();
    });

    it("should hide Group when showGroup is false", () => {
      renderContent({ showGroup: false });
      expect(screen.queryByText("Group")).toBeNull();
    });

    it("should show Group when showGroup is true", () => {
      renderContent({ showGroup: true });
      expect(screen.getByText("Group")).toBeTruthy();
    });

    it("should hide Ungroup when showUngroup is false", () => {
      renderContent({ showUngroup: false });
      expect(screen.queryByText("Ungroup")).toBeNull();
    });

    it("should show Ungroup when showUngroup is true", () => {
      renderContent({ showUngroup: true });
      expect(screen.getByText("Ungroup")).toBeTruthy();
    });
  });

  describe("separator", () => {
    it("should show separator when both edit and structural actions present", () => {
      const { container } = renderContent({
        showCopy: true,
        showSelectAll: true,
      });

      const separator = container.querySelector("[role='separator']");
      expect(separator).toBeTruthy();
    });

    it("should not show separator when only edit actions present", () => {
      const { container } = renderContent({ showCopy: true });

      const separator = container.querySelector("[role='separator']");
      expect(separator).toBeNull();
    });

    it("should not show separator when only structural actions present", () => {
      const { container } = renderContent({ showSelectAll: true });

      const separator = container.querySelector("[role='separator']");
      expect(separator).toBeNull();
    });
  });

  describe("aria-keyshortcuts", () => {
    it("should include aria-keyshortcuts on Copy item", () => {
      renderContent({ showCopy: true });

      const item = screen.getByText("Copy").closest("[role='menuitem']");
      expect(item?.getAttribute("aria-keyshortcuts")).toMatch(
        /^(Meta|Control)\+C$/
      );
    });

    it("should include aria-keyshortcuts on Delete item", () => {
      renderContent({ showDelete: true });

      const item = screen.getByText("Delete").closest("[role='menuitem']");
      expect(item?.getAttribute("aria-keyshortcuts")).toBe("Delete");
    });
  });
});
