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
    });
  });
});
