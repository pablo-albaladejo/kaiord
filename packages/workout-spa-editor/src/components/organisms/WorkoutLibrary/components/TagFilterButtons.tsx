/**
 * Tag Filter Buttons Component
 *
 * Interactive buttons for filtering workouts by tags.
 */

type TagFilterButtonsProps = {
  allTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
};

export function TagFilterButtons({
  allTags,
  selectedTags,
  onTagToggle,
}: TagFilterButtonsProps) {
  if (allTags.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Tags:
      </span>
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagToggle(tag)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selectedTags.includes(tag)
              ? "bg-primary-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
          aria-pressed={selectedTags.includes(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
