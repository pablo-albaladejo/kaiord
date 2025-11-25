import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  describe("save shortcut", () => {
    it("should call onSave when Ctrl+S is pressed", () => {
      // Arrange
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onSave).toHaveBeenCalledOnce();
    });

    it("should call onSave when Cmd+S is pressed", () => {
      // Arrange
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "s",
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onSave).toHaveBeenCalledOnce();
    });

    it("should handle uppercase S", () => {
      // Arrange
      const onSave = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSave }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "S",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onSave).toHaveBeenCalledOnce();
    });
  });

  describe("undo shortcut", () => {
    it("should call onUndo when Ctrl+Z is pressed", () => {
      // Arrange
      const onUndo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onUndo }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onUndo).toHaveBeenCalledOnce();
    });

    it("should call onUndo when Cmd+Z is pressed", () => {
      // Arrange
      const onUndo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onUndo }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "z",
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onUndo).toHaveBeenCalledOnce();
    });

    it("should not call onUndo when Ctrl+Shift+Z is pressed", () => {
      // Arrange
      const onUndo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onUndo }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onUndo).not.toHaveBeenCalled();
    });
  });

  describe("redo shortcut", () => {
    it("should call onRedo when Ctrl+Y is pressed", () => {
      // Arrange
      const onRedo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onRedo }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "y",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onRedo).toHaveBeenCalledOnce();
    });

    it("should call onRedo when Ctrl+Shift+Z is pressed", () => {
      // Arrange
      const onRedo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onRedo }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onRedo).toHaveBeenCalledOnce();
    });

    it("should call onRedo when Cmd+Shift+Z is pressed", () => {
      // Arrange
      const onRedo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onRedo }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "z",
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onRedo).toHaveBeenCalledOnce();
    });
  });

  describe("move step up shortcut (Requirement 29)", () => {
    it("should call onMoveStepUp when Alt+ArrowUp is pressed", () => {
      // Arrange
      const onMoveStepUp = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onMoveStepUp }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onMoveStepUp).toHaveBeenCalledOnce();
    });

    it("should not call onMoveStepUp when only ArrowUp is pressed", () => {
      // Arrange
      const onMoveStepUp = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onMoveStepUp }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onMoveStepUp).not.toHaveBeenCalled();
    });

    it("should not call onMoveStepUp when Ctrl+Alt+ArrowUp is pressed", () => {
      // Arrange
      const onMoveStepUp = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onMoveStepUp }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        altKey: true,
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onMoveStepUp).not.toHaveBeenCalled();
    });
  });

  describe("move step down shortcut (Requirement 29)", () => {
    it("should call onMoveStepDown when Alt+ArrowDown is pressed", () => {
      // Arrange
      const onMoveStepDown = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onMoveStepDown }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        altKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onMoveStepDown).toHaveBeenCalledOnce();
    });

    it("should not call onMoveStepDown when only ArrowDown is pressed", () => {
      // Arrange
      const onMoveStepDown = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onMoveStepDown }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onMoveStepDown).not.toHaveBeenCalled();
    });

    it("should not call onMoveStepDown when Cmd+Alt+ArrowDown is pressed", () => {
      // Arrange
      const onMoveStepDown = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onMoveStepDown }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        altKey: true,
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onMoveStepDown).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("should remove event listener on unmount", () => {
      // Arrange
      const onSave = vi.fn();
      const { unmount } = renderHook(() => useKeyboardShortcuts({ onSave }));

      // Act
      unmount();
      const event = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("copy shortcut (Requirement 39.2)", () => {
    it("should call onCopy when Ctrl+C is pressed", () => {
      // Arrange
      const onCopy = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onCopy }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "c",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onCopy).toHaveBeenCalledOnce();
    });

    it("should call onCopy when Cmd+C is pressed", () => {
      // Arrange
      const onCopy = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onCopy }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "c",
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onCopy).toHaveBeenCalledOnce();
    });

    it("should handle uppercase C", () => {
      // Arrange
      const onCopy = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onCopy }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "C",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onCopy).toHaveBeenCalledOnce();
    });

    it("should not call onCopy when only C is pressed", () => {
      // Arrange
      const onCopy = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onCopy }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "c",
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onCopy).not.toHaveBeenCalled();
    });
  });

  describe("paste shortcut (Requirement 39.2)", () => {
    it("should call onPaste when Ctrl+V is pressed", () => {
      // Arrange
      const onPaste = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onPaste }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "v",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onPaste).toHaveBeenCalledOnce();
    });

    it("should call onPaste when Cmd+V is pressed", () => {
      // Arrange
      const onPaste = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onPaste }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "v",
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onPaste).toHaveBeenCalledOnce();
    });

    it("should handle uppercase V", () => {
      // Arrange
      const onPaste = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onPaste }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "V",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onPaste).toHaveBeenCalledOnce();
    });

    it("should not call onPaste when only V is pressed", () => {
      // Arrange
      const onPaste = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onPaste }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "v",
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onPaste).not.toHaveBeenCalled();
    });
  });

  describe("create block shortcut (Requirement 7.6.1)", () => {
    it("should call onCreateBlock when Ctrl+G is pressed", () => {
      // Arrange
      const onCreateBlock = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onCreateBlock }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "g",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onCreateBlock).toHaveBeenCalledOnce();
    });

    it("should call onCreateBlock when Cmd+G is pressed", () => {
      // Arrange
      const onCreateBlock = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onCreateBlock }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "g",
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onCreateBlock).toHaveBeenCalledOnce();
    });

    it("should handle uppercase G", () => {
      // Arrange
      const onCreateBlock = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onCreateBlock }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "G",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onCreateBlock).toHaveBeenCalledOnce();
    });

    it("should not call onCreateBlock when Ctrl+Shift+G is pressed", () => {
      // Arrange
      const onCreateBlock = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onCreateBlock }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "g",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onCreateBlock).not.toHaveBeenCalled();
    });

    it("should not call onCreateBlock when only G is pressed", () => {
      // Arrange
      const onCreateBlock = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onCreateBlock }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "g",
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onCreateBlock).not.toHaveBeenCalled();
    });
  });

  describe("ungroup block shortcut (Requirement 7.6.2)", () => {
    it("should call onUngroupBlock when Ctrl+Shift+G is pressed", () => {
      // Arrange
      const onUngroupBlock = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onUngroupBlock }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "g",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onUngroupBlock).toHaveBeenCalledOnce();
    });

    it("should call onUngroupBlock when Cmd+Shift+G is pressed", () => {
      // Arrange
      const onUngroupBlock = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onUngroupBlock }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "g",
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onUngroupBlock).toHaveBeenCalledOnce();
    });

    it("should handle uppercase G with Shift", () => {
      // Arrange
      const onUngroupBlock = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onUngroupBlock }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "G",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onUngroupBlock).toHaveBeenCalledOnce();
    });

    it("should not call onUngroupBlock when only Ctrl+G is pressed", () => {
      // Arrange
      const onUngroupBlock = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onUngroupBlock }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "g",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onUngroupBlock).not.toHaveBeenCalled();
    });
  });

  describe("select all shortcut (Requirement 7.6.3)", () => {
    it("should call onSelectAll when Ctrl+A is pressed", () => {
      // Arrange
      const onSelectAll = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSelectAll }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "a",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onSelectAll).toHaveBeenCalledOnce();
    });

    it("should call onSelectAll when Cmd+A is pressed", () => {
      // Arrange
      const onSelectAll = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSelectAll }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "a",
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onSelectAll).toHaveBeenCalledOnce();
    });

    it("should handle uppercase A", () => {
      // Arrange
      const onSelectAll = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSelectAll }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "A",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onSelectAll).toHaveBeenCalledOnce();
    });

    it("should not call onSelectAll when only A is pressed", () => {
      // Arrange
      const onSelectAll = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSelectAll }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "a",
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onSelectAll).not.toHaveBeenCalled();
    });
  });

  describe("clear selection shortcut (Requirement 7.6.4)", () => {
    it("should call onClearSelection when Escape is pressed", () => {
      // Arrange
      const onClearSelection = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onClearSelection }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onClearSelection).toHaveBeenCalledOnce();
    });

    it("should call onClearSelection when Escape is pressed with modifiers", () => {
      // Arrange
      const onClearSelection = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onClearSelection }));

      // Act
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      // Assert
      expect(onClearSelection).toHaveBeenCalledOnce();
    });
  });

  describe("optional handlers", () => {
    it("should not throw when handlers are undefined", () => {
      // Arrange & Act
      renderHook(() => useKeyboardShortcuts({}));

      // Assert - no error thrown
      const saveEvent = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
        bubbles: true,
      });
      expect(() => window.dispatchEvent(saveEvent)).not.toThrow();

      const moveUpEvent = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        altKey: true,
        bubbles: true,
      });
      expect(() => window.dispatchEvent(moveUpEvent)).not.toThrow();

      const copyEvent = new KeyboardEvent("keydown", {
        key: "c",
        ctrlKey: true,
        bubbles: true,
      });
      expect(() => window.dispatchEvent(copyEvent)).not.toThrow();

      const pasteEvent = new KeyboardEvent("keydown", {
        key: "v",
        ctrlKey: true,
        bubbles: true,
      });
      expect(() => window.dispatchEvent(pasteEvent)).not.toThrow();

      const createBlockEvent = new KeyboardEvent("keydown", {
        key: "g",
        ctrlKey: true,
        bubbles: true,
      });
      expect(() => window.dispatchEvent(createBlockEvent)).not.toThrow();

      const ungroupBlockEvent = new KeyboardEvent("keydown", {
        key: "g",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      expect(() => window.dispatchEvent(ungroupBlockEvent)).not.toThrow();

      const selectAllEvent = new KeyboardEvent("keydown", {
        key: "a",
        ctrlKey: true,
        bubbles: true,
      });
      expect(() => window.dispatchEvent(selectAllEvent)).not.toThrow();

      const escapeEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      });
      expect(() => window.dispatchEvent(escapeEvent)).not.toThrow();
    });
  });
});
