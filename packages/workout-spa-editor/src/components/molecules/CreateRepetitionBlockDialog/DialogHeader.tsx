import { Repeat, X } from "lucide-react";

export function DialogHeader({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <Repeat className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create Repetition Block
        </h2>
      </div>
      <button
        onClick={onCancel}
        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
