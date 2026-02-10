import { Copy } from "lucide-react";

type DuplicateButtonProps = {
  stepIndex: number;
  onDuplicate: (stepIndex: number) => void;
};

export function DuplicateButton({
  stepIndex,
  onDuplicate,
}: DuplicateButtonProps) {
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(stepIndex);
  };

  return (
    <button
      onClick={handleDuplicate}
      className="rounded-full p-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-500 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`Duplicate step ${stepIndex + 1}`}
      title="Duplicate step"
      data-testid="duplicate-step-button"
    >
      <Copy className="h-4 w-4" />
    </button>
  );
}
