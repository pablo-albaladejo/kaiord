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
    <div className="rounded-2xl border border-edge-soft bg-surface p-5">
      <h3 className="mb-4 text-base font-semibold text-ink-strong">
        {t("section.editMetadataTitle")}
      </h3>
      <WorkoutMetadataEditor krd={krd} onSave={onSave} onCancel={onCancel} />
    </div>
  );
}
