/**
 * CreateProfileSection Component
 *
 * Inline form for creating a new profile.
 */

type CreateProfileSectionProps = {
  formData: { name: string };
  setFormData: (d: { name: string }) => void;
  onCreate: () => void;
};

export function CreateProfileSection({
  formData,
  setFormData,
  onCreate,
}: CreateProfileSectionProps) {
  return (
    <div className="mb-4 flex gap-2">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="New profile name"
        aria-label="Name"
        className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
      <button
        type="button"
        disabled={!formData.name.trim()}
        onClick={onCreate}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Create Profile
      </button>
    </div>
  );
}
