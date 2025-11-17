import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useToast } from "./useToast";

describe("useToast", () => {
  describe("toast management", () => {
    it("should initialize with empty toasts array", () => {
      // Arrange & Act
      const { result } = renderHook(() => useToast());

      // Assert
      expect(result.current.toasts).toEqual([]);
    });

    it("should add a toast when toast() is called", () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.toast({
          title: "Test notification",
          description: "Test description",
        });
      });

      // Assert
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe("Test notification");
      expect(result.current.toasts[0].description).toBe("Test description");
      expect(result.current.toasts[0].open).toBe(true);
    });

    it("should generate unique ID for each toast", () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      let id1: string;
      let id2: string;

      act(() => {
        id1 = result.current.toast({ title: "Toast 1" });
        id2 = result.current.toast({ title: "Toast 2" });
      });

      // Assert
      expect(id1!).toBeDefined();
      expect(id2!).toBeDefined();
      expect(id1!).not.toBe(id2!);
      expect(result.current.toasts).toHaveLength(2);
    });

    it("should add multiple toasts", () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.toast({ title: "Toast 1" });
        result.current.toast({ title: "Toast 2" });
        result.current.toast({ title: "Toast 3" });
      });

      // Assert
      expect(result.current.toasts).toHaveLength(3);
      expect(result.current.toasts[0].title).toBe("Toast 1");
      expect(result.current.toasts[1].title).toBe("Toast 2");
      expect(result.current.toasts[2].title).toBe("Toast 3");
    });
  });

  describe("toast variants", () => {
    it("should default to info variant", () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.toast({ title: "Default toast" });
      });

      // Assert
      expect(result.current.toasts[0].variant).toBe("info");
    });

    it("should create success toast", () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.success("Success message");
      });

      // Assert
      expect(result.current.toasts[0].variant).toBe("success");
      expect(result.current.toasts[0].title).toBe("Success message");
    });

    it("should create error toast", () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.error("Error message");
      });

      // Assert
      expect(result.current.toasts[0].variant).toBe("error");
      expect(result.current.toasts[0].title).toBe("Error message");
    });

    it("should create warning toast", () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.warning("Warning message");
      });

      // Assert
      expect(result.current.toasts[0].variant).toBe("warning");
      expect(result.current.toasts[0].title).toBe("Warning message");
    });

    it("should create info toast", () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.info("Info message");
      });

      // Assert
      expect(result.current.toasts[0].variant).toBe("info");
      expect(result.current.toasts[0].title).toBe("Info message");
    });

    it("should support description in variant methods", () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.success("Success", "Operation completed");
      });

      // Assert
      expect(result.current.toasts[0].title).toBe("Success");
      expect(result.current.toasts[0].description).toBe("Operation completed");
    });
  });

  describe("toast dismissal", () => {
    it("should dismiss specific toast by ID", () => {
      // Arrange
      const { result } = renderHook(() => useToast());
      let toastId: string;

      act(() => {
        toastId = result.current.toast({ title: "Test toast" });
      });

      // Act
      act(() => {
        result.current.dismiss(toastId!);
      });

      // Assert
      expect(result.current.toasts[0].open).toBe(false);
    });

    it("should remove dismissed toast after animation", async () => {
      // Arrange
      vi.useFakeTimers();
      const { result } = renderHook(() => useToast());
      let toastId: string;

      act(() => {
        toastId = result.current.toast({ title: "Test toast" });
      });

      // Act
      act(() => {
        result.current.dismiss(toastId!);
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Assert
      expect(result.current.toasts).toHaveLength(0);

      vi.useRealTimers();
    });

    it("should dismiss all toasts", () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "Toast 1" });
        result.current.toast({ title: "Toast 2" });
        result.current.toast({ title: "Toast 3" });
      });

      // Act
      act(() => {
        result.current.dismissAll();
      });

      // Assert
      expect(result.current.toasts.every((t) => !t.open)).toBe(true);
    });

    it("should remove all toasts after dismissAll animation", async () => {
      // Arrange
      vi.useFakeTimers();
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: "Toast 1" });
        result.current.toast({ title: "Toast 2" });
      });

      // Act
      act(() => {
        result.current.dismissAll();
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      // Assert
      expect(result.current.toasts).toHaveLength(0);

      vi.useRealTimers();
    });

    it("should only dismiss specified toast, not others", () => {
      // Arrange
      const { result } = renderHook(() => useToast());
      let id1: string;
      let id2: string;

      act(() => {
        id1 = result.current.toast({ title: "Toast 1" });
        id2 = result.current.toast({ title: "Toast 2" });
      });

      // Act
      act(() => {
        result.current.dismiss(id1!);
      });

      // Assert
      expect(result.current.toasts[0].open).toBe(false);
      expect(result.current.toasts[1].open).toBe(true);
    });
  });

  describe("toast options", () => {
    it("should support custom duration", () => {
      // Arrange
      const { result } = renderHook(() => useToast());

      // Act
      act(() => {
        result.current.toast({ title: "Test", duration: 3000 });
      });

      // Assert
      expect(result.current.toasts[0].duration).toBe(3000);
    });

    it("should support custom action", () => {
      // Arrange
      const { result } = renderHook(() => useToast());
      const action = "custom-action";

      // Act
      act(() => {
        result.current.toast({ title: "Test", action });
      });

      // Assert
      expect(result.current.toasts[0].action).toBe(action);
    });

    it("should support all options together", () => {
      // Arrange
      const { result } = renderHook(() => useToast());
      const action = "custom-action";

      // Act
      act(() => {
        result.current.toast({
          title: "Complete toast",
          description: "With all options",
          variant: "success",
          action,
          duration: 10000,
        });
      });

      // Assert
      const toast = result.current.toasts[0];
      expect(toast.title).toBe("Complete toast");
      expect(toast.description).toBe("With all options");
      expect(toast.variant).toBe("success");
      expect(toast.action).toBe(action);
      expect(toast.duration).toBe(10000);
    });
  });
});
