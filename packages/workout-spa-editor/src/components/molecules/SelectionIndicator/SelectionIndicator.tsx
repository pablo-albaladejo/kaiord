import { Check } from "lucide-react";

export type SelectionIndicatorProps = {
  selected: boolean;
};

export function SelectionIndicator({ selected }: SelectionIndicatorProps) {
  if (!selected) {
    return null;
  }

  return (
    <div
      className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm"
      aria-hidden="true"
      data-testid="selection-indicator"
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </div>
  );
}
