import { Trash2 } from "lucide-react";

type DeleteButtonProps = {
  stepIndex: number;
  onDelete: (stepIndex: number) => void;
};

export function DeleteButton({ stepIndex, onDelete }: DeleteButtonProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(stepIndex);
  };

  return (
    <button
      onClick={handleDelete}
      className="absolute right-3 bottom-3 rounded-full p-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-500 hover:border-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      aria-label={`Delete step ${stepIndex + 1}`}
      title="Delete step"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
