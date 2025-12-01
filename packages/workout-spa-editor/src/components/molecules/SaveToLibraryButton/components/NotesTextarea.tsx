/**
 * NotesTextarea Component
 *
 * Textarea for workout notes with character counter.
 */

type NotesTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function NotesTextarea({
  value,
  onChange,
  disabled,
}: NotesTextareaProps) {
  return (
    <div>
      <label
        htmlFor="workout-notes"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        Notes
      </label>
      <textarea
        id="workout-notes"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add notes about this workout..."
        maxLength={1000}
        rows={3}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        disabled={disabled}
      />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {value.length}/1000 characters
      </p>
    </div>
  );
}
