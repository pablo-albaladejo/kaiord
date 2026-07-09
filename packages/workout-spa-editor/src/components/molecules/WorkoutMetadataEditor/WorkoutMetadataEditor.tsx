/**
 * WorkoutMetadataEditor Component
 *
 * Editor for workout metadata (name, sport, sub-sport).
 */

import { useTranslate } from "../../../i18n/use-translate";
import type { KRD } from "../../../types/krd";
import { Button } from "../../atoms/Button/Button";
import { Input } from "../../atoms/Input/Input";
import { CoachNotesField } from "./components/CoachNotesField";
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
  const t = useTranslate("editor");
  const {
    name,
    sport,
    subSport,
    notes,
    setName,
    setSport,
    setSubSport,
    setNotes,
  } = useMetadataForm(krd);

  const handleSave = () =>
    onSave(buildUpdatedKrd(krd, name, sport, subSport, notes));

  return (
    <div
      className="space-y-4"
      data-testid="workout-metadata-editor"
      role="form"
      aria-label={t("metadata.editAria")}
    >
      <div>
        <label
          htmlFor="workout-name"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("metadata.nameLabel")}
        </label>
        <Input
          id="workout-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("metadata.namePlaceholder")}
          aria-label={t("metadata.nameAria")}
          data-testid="workout-name-input"
        />
      </div>

      <SportSelect value={sport} onChange={setSport} />
      <SubSportSelect sport={sport} value={subSport} onChange={setSubSport} />
      <CoachNotesField value={notes} onChange={setNotes} />

      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={onCancel}
          data-testid="cancel-metadata-button"
        >
          {t("metadata.cancel")}
        </Button>
        <Button onClick={handleSave} data-testid="save-metadata-button">
          {t("metadata.save")}
        </Button>
      </div>
    </div>
  );
}
