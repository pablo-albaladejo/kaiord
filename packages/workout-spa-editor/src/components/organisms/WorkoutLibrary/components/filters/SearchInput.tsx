/**
 * SearchInput Component
 *
 * Search input for filtering workouts.
 */

import { Input } from "../../../../atoms/Input/Input";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div>
      <Input
        type="text"
        placeholder="Search workouts..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  );
}
