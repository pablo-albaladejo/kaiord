import type { ComponentType } from "react";

export type PickerTileProps = {
  id: "scratch" | "import" | "template";
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
};

export function PickerTile({
  id,
  icon: Icon,
  title,
  description,
  onClick,
}: PickerTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`new-workout-picker-${id}`}
      className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-6 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
      <span className="font-medium">{title}</span>
      <span className="text-xs text-muted-foreground text-center">
        {description}
      </span>
    </button>
  );
}
