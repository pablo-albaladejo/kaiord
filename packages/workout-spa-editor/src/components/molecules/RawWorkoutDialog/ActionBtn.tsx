/**
 * ActionBtn - Small action button with icon for workout dialogs.
 */

import type { LucideIcon } from "lucide-react";

export type ActionBtnProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  primary?: boolean;
};

export function ActionBtn({
  icon: I,
  label,
  onClick,
  primary,
}: ActionBtnProps) {
  const cls = primary
    ? "bg-primary-600 text-white hover:bg-primary-700"
    : "border hover:bg-gray-50 dark:hover:bg-gray-800";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${cls}`}
    >
      <I className="h-4 w-4" /> {label}
    </button>
  );
}
