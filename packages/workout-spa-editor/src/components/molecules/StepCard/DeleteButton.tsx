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
      className="absolute right-2 top-2 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
      aria-label={`Delete step ${stepIndex + 1}`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
