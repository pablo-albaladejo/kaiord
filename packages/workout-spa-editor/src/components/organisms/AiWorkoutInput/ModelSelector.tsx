import { useAiStore } from "../../../store/ai-store";

export const ModelSelector: React.FC = () => {
  const { providers, selectedProviderId, selectForGeneration } = useAiStore();

  if (providers.length === 0) return null;

  const currentValue =
    selectedProviderId ??
    providers.find((p) => p.isDefault)?.id ??
    providers[0].id;

  return (
    <div className="w-full">
      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
        Model
      </label>
      <select
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        value={currentValue}
        onChange={(e) => selectForGeneration(e.target.value)}
      >
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label} ({p.model})
          </option>
        ))}
      </select>
    </div>
  );
};
