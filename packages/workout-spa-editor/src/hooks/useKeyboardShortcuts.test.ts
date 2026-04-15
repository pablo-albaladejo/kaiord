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

  describe("form input passthrough", () => {
    const createEventFromElement = (
      tag: "input" | "textarea" | "select",
      key: string,
      modifiers: Partial<KeyboardEventInit> = {}
    ) => {
      const el = document.createElement(tag);
      document.body.appendChild(el);
      el.focus();
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        ...modifiers,
      });
      Object.defineProperty(event, "target", { value: el });
      return { event, cleanup: () => el.remove() };
    };

    it("should not intercept Ctrl+V when target is an input", () => {
      const onPaste = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onPaste }));

      const { event, cleanup } = createEventFromElement("input", "v", {
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(onPaste).not.toHaveBeenCalled();
      cleanup();
    });

    it("should not intercept Ctrl+C when target is a textarea", () => {
      const onCopy = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onCopy }));

      const { event, cleanup } = createEventFromElement("textarea", "c", {
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(onCopy).not.toHaveBeenCalled();
      cleanup();
    });

    it("should not intercept Ctrl+A when target is a select", () => {
      const onSelectAll = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onSelectAll }));

      const { event, cleanup } = createEventFromElement("select", "a", {
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(onSelectAll).not.toHaveBeenCalled();
      cleanup();
    });

    it("should not intercept Ctrl+Z when target is an input", () => {
      const onUndo = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onUndo }));

      const { event, cleanup } = createEventFromElement("input", "z", {
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(onUndo).not.toHaveBeenCalled();
      cleanup();
    });

    it("should not intercept Alt+ArrowUp when target is an input", () => {
      const onMoveStepUp = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onMoveStepUp }));

      const { event, cleanup } = createEventFromElement("input", "ArrowUp", {
        altKey: true,
      });
      window.dispatchEvent(event);

      expect(onMoveStepUp).not.toHaveBeenCalled();
      cleanup();
    });

    it("should not intercept Escape when target is an input", () => {
      const onClearSelection = vi.fn();
      renderHook(() => useKeyboardShortcuts({ onClearSelection }));

      const { event, cleanup } = createEventFromElement("input", "Escape");
      window.dispatchEvent(event);

      expect(onClearSelection).not.toHaveBeenCalled();
      cleanup();
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

      const cutEvent = new KeyboardEvent("keydown", {
        key: "x",
        ctrlKey: true,
        bubbles: true,
      });
      expect(() => window.dispatchEvent(cutEvent)).not.toThrow();

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

  describe("cut shortcut (Cmd+X)", () => {
    it("should call onCut when Ctrl+X is pressed", () => {
      const onCut = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onCut }));

      const event = new KeyboardEvent("keydown", {
        key: "x",
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(onCut).toHaveBeenCalledOnce();
    });

    it("should not call onCut when Ctrl+Shift+X is pressed", () => {
      const onCut = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onCut }));

      const event = new KeyboardEvent("keydown", {
        key: "x",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(onCut).not.toHaveBeenCalled();
    });
  });

  describe("exact modifier matching (Cmd+Shift passthrough)", () => {
    it("should not call onCopy when Ctrl+Shift+C is pressed", () => {
      const onCopy = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onCopy }));

      const event = new KeyboardEvent("keydown", {
        key: "c",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(onCopy).not.toHaveBeenCalled();
    });

    it("should not call onSave when Cmd+Shift+S is pressed", () => {
      const onSave = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onSave }));

      const event = new KeyboardEvent("keydown", {
        key: "s",
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(onSave).not.toHaveBeenCalled();
    });

    it("should not call onPaste when Ctrl+Shift+V is pressed", () => {
      const onPaste = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onPaste }));

      const event = new KeyboardEvent("keydown", {
        key: "v",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(onPaste).not.toHaveBeenCalled();
    });

    it("should not call onSelectAll when Ctrl+Shift+A is pressed", () => {
      const onSelectAll = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onSelectAll }));

      const event = new KeyboardEvent("keydown", {
        key: "a",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(onSelectAll).not.toHaveBeenCalled();
    });

    it("should still call onUngroupBlock when Cmd+Shift+G is pressed", () => {
      const onUngroupBlock = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onUngroupBlock }));

      const event = new KeyboardEvent("keydown", {
        key: "g",
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(onUngroupBlock).toHaveBeenCalledOnce();
    });

    it("should still call onRedo when Cmd+Shift+Z is pressed", () => {
      const onRedo = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onRedo }));

      const event = new KeyboardEvent("keydown", {
        key: "z",
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(onRedo).toHaveBeenCalledOnce();
    });
  });

  describe("context-aware preventDefault", () => {
    it("should not preventDefault when handler returns false", () => {
      const onCopy = vi.fn().mockReturnValue(false);
      renderHook(() => useKeyboardShortcuts({ onCopy }));

      const event = new KeyboardEvent("keydown", {
        key: "c",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      expect(onCopy).toHaveBeenCalledOnce();
      expect(event.defaultPrevented).toBe(false);
    });

    it("should preventDefault when handler returns true", () => {
      const onCopy = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onCopy }));

      const event = new KeyboardEvent("keydown", {
        key: "c",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      expect(onCopy).toHaveBeenCalledOnce();
      expect(event.defaultPrevented).toBe(true);
    });

    it("should not preventDefault for escape when handler returns false", () => {
      const onClearSelection = vi.fn().mockReturnValue(false);
      renderHook(() => useKeyboardShortcuts({ onClearSelection }));

      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      expect(onClearSelection).toHaveBeenCalledOnce();
      expect(event.defaultPrevented).toBe(false);
    });

    it("should preventDefault for escape when handler returns true", () => {
      const onClearSelection = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onClearSelection }));

      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      expect(onClearSelection).toHaveBeenCalledOnce();
      expect(event.defaultPrevented).toBe(true);
    });

    it("should not preventDefault for Alt+ArrowUp when handler returns false", () => {
      const onMoveStepUp = vi.fn().mockReturnValue(false);
      renderHook(() => useKeyboardShortcuts({ onMoveStepUp }));

      const event = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        altKey: true,
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);

      expect(onMoveStepUp).toHaveBeenCalledOnce();
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("contentEditable passthrough", () => {
    it("should not intercept Ctrl+C when target is contentEditable", () => {
      const onCopy = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onCopy }));

      const el = document.createElement("div");
      el.contentEditable = "true";
      document.body.appendChild(el);

      const event = new KeyboardEvent("keydown", {
        key: "c",
        ctrlKey: true,
        bubbles: true,
      });
      el.dispatchEvent(event);

      expect(onCopy).not.toHaveBeenCalled();
      el.remove();
    });

    it("should not intercept Escape when target is contentEditable", () => {
      const onClearSelection = vi.fn().mockReturnValue(true);
      renderHook(() => useKeyboardShortcuts({ onClearSelection }));

      const el = document.createElement("div");
      el.contentEditable = "true";
      document.body.appendChild(el);

      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      });
      el.dispatchEvent(event);

      expect(onClearSelection).not.toHaveBeenCalled();
      el.remove();
    });
  });
});
