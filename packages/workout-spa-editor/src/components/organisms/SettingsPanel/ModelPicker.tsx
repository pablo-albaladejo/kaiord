import { useState } from "react";

import { PROVIDER_MODELS } from "../../../lib/provider-models";
import type { LlmProviderType } from "../../../store/ai-store-types";

const CUSTOM_SENTINEL = "__custom__";

type ModelPickerProps = {
  type: LlmProviderType;
  value: string;
  onChange: (modelId: string) => void;
};

export const ModelPicker: React.FC<ModelPickerProps> = ({
  type,
  value,
  onChange,
}) => {
  const models = PROVIDER_MODELS[type];
  const isKnown = models.some((m) => m.id === value);
  const valueIsCustom = value !== "" && !isKnown;
  const [customMode, setCustomMode] = useState(valueIsCustom);
  const showCustom = valueIsCustom || customMode;
  const selectValue = showCustom ? CUSTOM_SENTINEL : value;

  const handleSelect = (next: string) => {
    if (next === CUSTOM_SENTINEL) {
      setCustomMode(true);
      return;
    }
    setCustomMode(false);
    onChange(next);
  };

  return (
    <div className="w-full">
      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
        Model
      </label>
      <select
        data-testid="model-picker-select"
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        value={selectValue}
        onChange={(e) => handleSelect(e.target.value)}
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
        <option value={CUSTOM_SENTINEL}>Custom…</option>
      </select>
      {showCustom && (
        <input
          data-testid="model-picker-custom"
          aria-label="Custom model id"
          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Enter a model id"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};
