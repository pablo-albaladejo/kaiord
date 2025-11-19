import { GripVertical } from "lucide-react";
import type { HTMLAttributes } from "react";

export type DragHandleProps = HTMLAttributes<HTMLDivElement> & {
  isDragging?: boolean;
};

export const DragHandle = ({
  isDragging = false,
  className = "",
  ...props
}: DragHandleProps) => {
  const baseClasses =
    "absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none";
  const colorClasses = isDragging
    ? "text-primary-500"
    : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300";
  const classes = [baseClasses, colorClasses, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      aria-label="Drag to reorder"
      data-testid="drag-handle"
      {...props}
    >
      <GripVertical size={20} />
    </div>
  );
};
