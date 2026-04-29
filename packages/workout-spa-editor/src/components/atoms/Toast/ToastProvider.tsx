import * as ToastPrimitive from "@radix-ui/react-toast";
import { type ReactNode } from "react";

/**
 * ToastProvider Props
 */
export type ToastProviderProps = {
  children: ReactNode;
  swipeDirection?: "right" | "left" | "up" | "down";
  duration?: number;
};

/**
 * ToastProvider Component
 *
 * Wraps the application with Radix UI Toast provider
 * Requirement 39: Visual feedback system
 * - Manages toast notification lifecycle
 * - Handles swipe-to-dismiss gestures
 * - Provides viewport for toast rendering
 */
export const ToastProvider = ({
  children,
  swipeDirection = "right",
  duration = 5000,
}: ToastProviderProps) => {
  return (
    <ToastPrimitive.Provider
      swipeDirection={swipeDirection}
      duration={duration}
    >
      {children}
      {/*
        pointer-events-none on the viewport: per Radix Toast guidance,
        the viewport itself must NOT capture pointer events — otherwise
        webkit reports the empty viewport area as "hovered" and Radix
        pauses every toast's auto-dismiss timer indefinitely (issue #379).
        Individual toasts re-enable `pointer-events-auto` via baseToastStyles.
      */}
      <ToastPrimitive.Viewport className="pointer-events-none fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:left-1/2 sm:-translate-x-1/2 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </ToastPrimitive.Provider>
  );
};
