import { PROVIDER_MODELS } from "../../../lib/provider-models";
import type { LlmProviderType } from "../../../store/ai-store";

type ModelSelectProps = {
  type: LlmProviderType;
  value: string;
  onChange: (model: string) => void;
};

export const ModelSelect: React.FC<ModelSelectProps> = ({
  type,
  value,
  onChange,
}) => {
  const models = PROVIDER_MODELS[type];
  return (
    <div className="w-full">
      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
        Model
      </label>
      <select
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
};
