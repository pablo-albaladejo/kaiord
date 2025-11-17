import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { forwardRef } from "react";
import { baseToastStyles, variantStyles } from "./Toast.styles";
import type { ToastProps } from "./Toast.types";

export type { ToastProps, ToastVariant } from "./Toast.types";

/**
 * Toast Component
 *
 * Requirement 39: Visual feedback for user actions
 * - Displays success, error, warning, and info notifications
 * - Auto-dismisses after specified duration
 * - Supports custom actions (e.g., undo button)
 * - Accessible with ARIA attributes
 */
export const Toast = forwardRef<HTMLLIElement, ToastProps>(
  (
    {
      title,
      description,
      variant = "info",
      action,
      open,
      onOpenChange,
      duration = 5000,
    },
    ref
  ) => {
    return (
      <ToastPrimitive.Root
        ref={ref}
        open={open}
        onOpenChange={onOpenChange}
        duration={duration}
        className={`${baseToastStyles} ${variantStyles[variant]}`}
      >
        <div className="grid gap-1">
          <ToastPrimitive.Title className="text-sm font-semibold">
            {title}
          </ToastPrimitive.Title>
          {description && (
            <ToastPrimitive.Description
              className="text-sm opacity-90"
              data-testid="toast-description"
            >
              {description}
            </ToastPrimitive.Description>
          )}
        </div>
        {action && (
          <ToastPrimitive.Action altText="Action" className="shrink-0" asChild>
            {action}
          </ToastPrimitive.Action>
        )}
        <ToastPrimitive.Close
          className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    );
  }
);

Toast.displayName = "Toast";
