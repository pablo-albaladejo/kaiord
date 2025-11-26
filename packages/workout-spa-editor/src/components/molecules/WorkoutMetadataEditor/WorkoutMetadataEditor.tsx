import { useState } from "react";
import type { KRD, Sport, SubSport } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";

export type WorkoutMetadataEditorProps = {
  readonly krd: KRD;
  readonly onSave: (updatedKrd: KRD) => void;
  readonly onCancel: () => void;
};

const SPORTS: Sport[] = ["cycling", "running", "swimming", "generic"];

const SUB_SPORTS: Record<Sport, SubSport[]> = {
  cycling: ["generic", "indoor_cycling", "mountain", "road", "track"],
  running: ["generic", "trail", "track", "treadmill"],
  swimming: ["generic", "lap_swimming", "open_water"],
  generic: ["generic"],
};

export function WorkoutMetadataEditor({
  krd,
  onSave,
  onCancel,
}: WorkoutMetadataEditorProps) {
  const workoutData = krd.extensions?.workout;
  const workoutName =
    workoutData &&
    typeof workoutData === "object" &&
    "name" in workoutData &&
    typeof workoutData.name === "string"
      ? workoutData.name
      : undefined;
  const workoutSport =
    workoutData &&
    typeof workoutData === "object" &&
    "sport" in workoutData &&
    typeof workoutData.sport === "string"
      ? (workoutData.sport as Sport)
      : "cycling";
  const workoutSubSport =
    workoutData &&
    typeof workoutData === "object" &&
    "subSport" in workoutData &&
    typeof workoutData.subSport === "string"
      ? (workoutData.subSport as SubSport)
      : "generic";

  const [name, setName] = useState(workoutName || "");
  const [sport, setSport] = useState<Sport>(workoutSport);
  const [subSport, setSubSport] = useState<SubSport>(workoutSubSport);

  const handleSportChange = (newSport: Sport) => {
    setSport(newSport);
    // Reset sub-sport to generic when sport changes
    setSubSport("generic");
  };

  const handleSave = () => {
    const updatedKrd: KRD = {
      ...krd,
      metadata: {
        ...krd.metadata,
        sport,
        subSport,
      },
      extensions: {
        ...krd.extensions,
        workout:
          workoutData &&
          typeof workoutData === "object" &&
          "steps" in workoutData
            ? {
                ...(workoutData as Record<string, unknown>),
                name,
                sport,
                subSport,
              }
            : {
                name,
                sport,
                subSport,
                steps: [],
              },
      },
    };

    onSave(updatedKrd);
  };

  return (
    <div
      className="space-y-4"
      data-testid="workout-metadata-editor"
      role="form"
      aria-label="Edit workout metadata"
    >
      <div>
        <label
          htmlFor="workout-name"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Workout Name
        </label>
        <Input
          id="workout-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter workout name"
          aria-label="Workout name"
          data-testid="workout-name-input"
        />
      </div>

      <div>
        <label
          htmlFor="workout-sport"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Sport
        </label>
        <select
          id="workout-sport"
          value={sport}
          onChange={(e) => handleSportChange(e.target.value as Sport)}
          aria-label="Sport type"
          data-testid="workout-sport-select"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {SPORTS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="workout-sub-sport"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Sub-Sport
        </label>
        <select
          id="workout-sub-sport"
          value={subSport}
          onChange={(e) => setSubSport(e.target.value as SubSport)}
          aria-label="Sub-sport type"
          data-testid="workout-sub-sport-select"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {SUB_SPORTS[sport].map((ss) => (
            <option key={ss} value={ss}>
              {ss.replace(/_/g, " ").charAt(0).toUpperCase() +
                ss.replace(/_/g, " ").slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          data-testid="cancel-metadata-button"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          data-testid="save-metadata-button"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
