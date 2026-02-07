import { Input } from "../../atoms/Input/Input";
import type { Sport } from "../../../types/krd-core";

type CreateWorkoutFormProps = {
  name: string;
  sport: Sport;
  onNameChange: (name: string) => void;
  onSportChange: (sport: Sport) => void;
  onSubmit: () => void;
};

const SPORTS: Array<{ value: Sport; label: string }> = [
  { value: "cycling", label: "Cycling" },
  { value: "running", label: "Running" },
  { value: "swimming", label: "Swimming" },
  { value: "generic", label: "Generic" },
];

export function CreateWorkoutForm({
  name,
  sport,
  onNameChange,
  onSportChange,
  onSubmit,
}: CreateWorkoutFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="workout-name"
          className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
        >
          Workout Name
        </label>
        <Input
          id="workout-name"
          type="text"
          placeholder="e.g., Morning Ride"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSubmit();
            }
          }}
          autoFocus
        />
      </div>

      <div>
        <label
          htmlFor="workout-sport"
          className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
        >
          Sport
        </label>
        <select
          id="workout-sport"
          value={sport}
          onChange={(e) => onSportChange(e.target.value as Sport)}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-400 dark:focus:ring-primary-400"
        >
          {SPORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
