import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

describe("ThemeContext", () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Reset document classes
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with system theme by default", () => {
      // Arrange
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      // Act
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Assert
      expect(result.current.theme).toBe("system");
      expect(result.current.resolvedTheme).toMatch(/^(light|dark)$/);
    });

    it("should initialize with stored theme from localStorage", () => {
      // Arrange
      localStorageMock.setItem("workout-editor-theme", "dark");
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      // Act
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Assert
      expect(result.current.theme).toBe("dark");
      expect(result.current.resolvedTheme).toBe("dark");
    });

    it("should initialize with custom default theme", () => {
      // Arrange
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      );

      // Act
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Assert
      expect(result.current.theme).toBe("light");
      expect(result.current.resolvedTheme).toBe("light");
    });
  });

  describe("theme switching", () => {
    it("should switch to light theme", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Act
      act(() => {
        result.current.setTheme("light");
      });

      // Assert
      expect(result.current.theme).toBe("light");
      expect(result.current.resolvedTheme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("should switch to dark theme", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Act
      act(() => {
        result.current.setTheme("dark");
      });

      // Assert
      expect(result.current.theme).toBe("dark");
      expect(result.current.resolvedTheme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("should switch to system theme", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Act
      act(() => {
        result.current.setTheme("system");
      });

      // Assert
      expect(result.current.theme).toBe("system");
      expect(result.current.resolvedTheme).toMatch(/^(light|dark)$/);
    });

    it("should switch to kiroween theme", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Act
      act(() => {
        result.current.setTheme("kiroween");
      });

      // Assert
      expect(result.current.theme).toBe("kiroween");
      expect(result.current.resolvedTheme).toBe("kiroween");
      expect(document.documentElement.classList.contains("kiroween")).toBe(
        true
      );
    });
  });

  describe("localStorage persistence", () => {
    it("should persist theme to localStorage when changed", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Act
      act(() => {
        result.current.setTheme("dark");
      });

      // Assert
      expect(localStorageMock.getItem("workout-editor-theme")).toBe("dark");
    });

    it("should load persisted theme on mount", () => {
      // Arrange
      localStorageMock.setItem("workout-editor-theme", "light");
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      // Act
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Assert
      expect(result.current.theme).toBe("light");
      expect(result.current.resolvedTheme).toBe("light");
    });

    it("should handle localStorage errors gracefully", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error("Storage quota exceeded");
      };

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Act
      act(() => {
        result.current.setTheme("dark");
      });

      // Assert
      expect(result.current.theme).toBe("dark");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Failed to store theme in localStorage:",
        expect.any(Error)
      );

      // Cleanup
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe("system theme detection", () => {
    it("should detect light system preference", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false, // Light mode
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      );

      // Act
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Assert
      expect(result.current.theme).toBe("system");
      expect(result.current.resolvedTheme).toBe("light");
    });

    it("should detect dark system preference", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: true, // Dark mode
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      );

      // Act
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Assert
      expect(result.current.theme).toBe("system");
      expect(result.current.resolvedTheme).toBe("dark");
    });

    it("should listen for system theme changes", async () => {
      // Arrange
      let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false, // Start with light
          media: query,
          onchange: null,
          addEventListener: vi.fn((event, handler) => {
            if (event === "change") {
              changeHandler = handler;
            }
          }),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Act - Simulate system theme change to dark
      act(() => {
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent);
        }
      });

      // Assert
      await waitFor(() => {
        expect(result.current.resolvedTheme).toBe("dark");
      });
    });
  });

  describe("DOM updates", () => {
    it("should add dark class to document root when dark theme is active", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Act
      act(() => {
        result.current.setTheme("dark");
      });

      // Assert
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("should remove dark class from document root when light theme is active", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      document.documentElement.classList.add("dark");
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Act
      act(() => {
        result.current.setTheme("light");
      });

      // Assert
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("should add kiroween class to document root when kiroween theme is active", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Act
      act(() => {
        result.current.setTheme("kiroween");
      });

      // Assert
      expect(document.documentElement.classList.contains("kiroween")).toBe(
        true
      );
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("should remove kiroween class when switching to another theme", () => {
      // Arrange
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      document.documentElement.classList.add("kiroween");
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );
      const { result } = renderHook(() => useTheme(), { wrapper });

      // Act
      act(() => {
        result.current.setTheme("light");
      });

      // Assert
      expect(document.documentElement.classList.contains("kiroween")).toBe(
        false
      );
    });
  });

  describe("error handling", () => {
    it("should throw error when useTheme is used outside ThemeProvider", () => {
      // Arrange & Act & Assert
      expect(() => {
        renderHook(() => useTheme());
      }).toThrow("useTheme must be used within a ThemeProvider");
    });
  });
});
