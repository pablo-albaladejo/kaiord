import { useTranslate } from "../../../i18n/use-translate";
import type { Equipment, SwimStroke } from "../../../types/krd";

export type SwimmingStepEditorProps = {
  strokeType: SwimStroke;
  equipment: Equipment;
  onStrokeTypeChange: (strokeType: SwimStroke) => void;
  onEquipmentChange: (equipment: Equipment) => void;
};

const STROKE_TYPES: ReadonlyArray<SwimStroke> = [
  "freestyle",
  "backstroke",
  "breaststroke",
  "butterfly",
  "drill",
  "mixed",
  "im",
];

const EQUIPMENT_TYPES: ReadonlyArray<Equipment> = [
  "none",
  "swim_fins",
  "swim_kickboard",
  "swim_paddles",
  "swim_pull_buoy",
  "swim_snorkel",
];

export const SwimmingStepEditor = ({
  strokeType,
  equipment,
  onStrokeTypeChange,
  onEquipmentChange,
}: SwimmingStepEditorProps) => {
  const t = useTranslate("editor");
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="stroke-type"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t("stepEditor.swim.strokeType")}
        </label>
        <select
          id="stroke-type"
          value={strokeType}
          onChange={(e) => onStrokeTypeChange(e.target.value as SwimStroke)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {STROKE_TYPES.map((stroke) => (
            <option key={stroke} value={stroke}>
              {t(`stepEditor.swim.stroke.${stroke}`)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="equipment"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t("stepEditor.swim.equipment")}
        </label>
        <select
          id="equipment"
          value={equipment}
          onChange={(e) => onEquipmentChange(e.target.value as Equipment)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {EQUIPMENT_TYPES.map((equip) => (
            <option key={equip} value={equip}>
              {t(`stepEditor.swim.gear.${equip}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
