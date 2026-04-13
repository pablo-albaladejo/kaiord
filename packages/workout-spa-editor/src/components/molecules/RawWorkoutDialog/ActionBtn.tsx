/**
 * ActionBtn - Small action button with icon for workout dialogs.
 */

import type { LucideIcon } from "lucide-react";

export type ActionBtnProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
};

export function ActionBtn({
  icon: I,
  label,
  onClick,
  primary,
  disabled = false,
}: ActionBtnProps) {
  const cls = primary
    ? "bg-primary-600 text-white hover:bg-primary-700"
    : "border hover:bg-gray-50 dark:hover:bg-gray-800";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${cls} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <I className="h-4 w-4" /> {label}
    </button>
  );
}
