import { useTranslate } from "../../../i18n/use-translate";

const SPORT_OPTIONS = [
  { value: "", labelKey: "sportOptions.autoDetect" },
  { value: "cycling", labelKey: "sportOptions.cycling" },
  { value: "running", labelKey: "sportOptions.running" },
  { value: "swimming", labelKey: "sportOptions.swimming" },
  { value: "generic", labelKey: "sportOptions.generic" },
];

type SportSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export const SportSelect = ({ value, onChange }: SportSelectProps) => {
  const t = useTranslate("create-workout");
  return (
    <div className="w-full">
      <label
        htmlFor="ai-sport-select"
        className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
      >
        {t("sport")}
      </label>
      <select
        id="ai-sport-select"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {SPORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
};
