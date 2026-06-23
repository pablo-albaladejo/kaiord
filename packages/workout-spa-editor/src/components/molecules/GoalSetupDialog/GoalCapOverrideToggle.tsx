/**
 * GoalCapOverrideToggle — opt-in checkbox shown only when the drafted goal
 * exceeds the safe cap, letting the user accept the unsafe pace. The warning
 * itself stays visible in the preview panel; this only flips the override flag.
 */
import { useId } from "react";

const OVERRIDE_LABEL = "Override the safety cap and use my pace";

export type GoalCapOverrideToggleProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
};

export function GoalCapOverrideToggle({
  checked,
  onChange,
}: GoalCapOverrideToggleProps) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-[12px]">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        data-testid="goal-cap-override"
        onChange={(e) => onChange(e.target.checked)}
      />
      {OVERRIDE_LABEL}
    </label>
  );
}
