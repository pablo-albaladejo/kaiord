import { useTranslate } from "../../../i18n/use-translate";
import type { KRD } from "../../../types/krd";
import { WorkoutMetadataEditor } from "../../molecules/WorkoutMetadataEditor/WorkoutMetadataEditor";

type MetadataEditModeProps = {
  krd: KRD;
  onSave: (updatedKrd: KRD) => void;
  onCancel: () => void;
};

export function MetadataEditMode({
  krd,
  onSave,
  onCancel,
}: MetadataEditModeProps) {
  const t = useTranslate("editor");
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        {t("section.editMetadataTitle")}
      </h3>
      <WorkoutMetadataEditor krd={krd} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}
