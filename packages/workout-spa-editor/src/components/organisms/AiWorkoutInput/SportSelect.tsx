const SPORT_OPTIONS = [
  { value: "", label: "Auto-detect" },
  { value: "cycling", label: "Cycling" },
  { value: "running", label: "Running" },
  { value: "swimming", label: "Swimming" },
  { value: "generic", label: "Generic" },
];

type SportSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

export const SportSelect = ({ value, onChange }: SportSelectProps) => (
  <div className="w-full">
    <label
      htmlFor="ai-sport-select"
      className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
    >
      Sport
    </label>
    <select
      id="ai-sport-select"
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {SPORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);
