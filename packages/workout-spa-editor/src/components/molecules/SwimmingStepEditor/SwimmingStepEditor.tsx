import type { Equipment, SwimStroke } from "../../../types/krd";

export type SwimmingStepEditorProps = {
  strokeType: SwimStroke;
  equipment: Equipment;
  onStrokeTypeChange: (strokeType: SwimStroke) => void;
  onEquipmentChange: (equipment: Equipment) => void;
};

const STROKE_TYPES: Array<{ value: SwimStroke; label: string }> = [
  { value: "freestyle", label: "Freestyle" },
  { value: "backstroke", label: "Backstroke" },
  { value: "breaststroke", label: "Breaststroke" },
  { value: "butterfly", label: "Butterfly" },
  { value: "drill", label: "Drill" },
  { value: "mixed", label: "Mixed" },
  { value: "im", label: "IM (Individual Medley)" },
];

const EQUIPMENT_TYPES: Array<{ value: Equipment; label: string }> = [
  { value: "none", label: "None" },
  { value: "swim_fins", label: "Fins" },
  { value: "swim_kickboard", label: "Kickboard" },
  { value: "swim_paddles", label: "Paddles" },
  { value: "swim_pull_buoy", label: "Pull Buoy" },
  { value: "swim_snorkel", label: "Snorkel" },
];

export const SwimmingStepEditor = ({
  strokeType,
  equipment,
  onStrokeTypeChange,
  onEquipmentChange,
}: SwimmingStepEditorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="stroke-type"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Stroke Type
        </label>
        <select
          id="stroke-type"
          value={strokeType}
          onChange={(e) => onStrokeTypeChange(e.target.value as SwimStroke)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {STROKE_TYPES.map((stroke) => (
            <option key={stroke.value} value={stroke.value}>
              {stroke.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="equipment"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Equipment
        </label>
        <select
          id="equipment"
          value={equipment}
          onChange={(e) => onEquipmentChange(e.target.value as Equipment)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          {EQUIPMENT_TYPES.map((equip) => (
            <option key={equip.value} value={equip.value}>
              {equip.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
