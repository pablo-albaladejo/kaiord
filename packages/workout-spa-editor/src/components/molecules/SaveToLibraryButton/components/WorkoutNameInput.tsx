/**
 * WorkoutNameInput Component
 *
 * Input field for workout name.
 */

import { Input } from "../../../atoms/Input/Input";

type WorkoutNameInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function WorkoutNameInput({
  value,
  onChange,
  disabled,
}: WorkoutNameInputProps) {
  return (
    <div>
      <label
        htmlFor="workout-name"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Workout Name *
      </label>
      <Input
        id="workout-name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Sweet Spot Intervals"
        maxLength={200}
        disabled={disabled}
      />
    </div>
  );
}
