import { GripVertical } from "lucide-react";
import { Tooltip } from "../../atoms/Tooltip/Tooltip";
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
    "absolute left-0 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-700";
  const colorClasses = isDragging
    ? "text-primary-500"
    : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300";
  const classes = [baseClasses, colorClasses, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tooltip content="Drag to reorder" side="left">
      <div
        className={classes}
        aria-label="Drag to reorder step"
        data-testid="drag-handle"
        {...props}
      >
        <GripVertical size={20} aria-hidden="true" />
      </div>
    </Tooltip>
  );
};
