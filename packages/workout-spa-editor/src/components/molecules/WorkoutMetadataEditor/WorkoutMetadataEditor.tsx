/**
 * WorkoutMetadataEditor Component
 *
 * Editor for workout metadata (name, sport, sub-sport).
 */

import type { KRD } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";
import { SportSelect } from "./components/SportSelect";
import { SubSportSelect } from "./components/SubSportSelect";
import { useMetadataForm } from "./hooks/useMetadataForm";
import { buildUpdatedKrd } from "./utils/krd-builder";

export type WorkoutMetadataEditorProps = {
  readonly krd: KRD;
  readonly onSave: (updatedKrd: KRD) => void;
  readonly onCancel: () => void;
};

export function WorkoutMetadataEditor({
  krd,
  onSave,
  onCancel,
}: WorkoutMetadataEditorProps) {
  const { name, sport, subSport, setName, setSport, setSubSport } =
    useMetadataForm(krd);

  const handleSave = () => {
    const updatedKrd = buildUpdatedKrd(krd, name, sport, subSport);
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

      <SportSelect value={sport} onChange={setSport} />
      <SubSportSelect sport={sport} value={subSport} onChange={setSubSport} />

      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          data-testid="cancel-metadata-button"
        >
          Cancel
        </Button>
        <Button onClick={handleSave} data-testid="save-metadata-button">
          Save
        </Button>
      </div>
    </div>
  );
}
