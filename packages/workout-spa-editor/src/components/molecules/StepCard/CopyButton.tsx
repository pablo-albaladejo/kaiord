import { Clipboard } from "lucide-react";

type CopyButtonProps = {
  stepIndex: number;
  onCopy: (stepIndex: number) => void;
};

export function CopyButton({ stepIndex, onCopy }: CopyButtonProps) {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(stepIndex);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded-full p-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-500 hover:border-green-500 hover:bg-green-50 hover:text-green-600 dark:hover:border-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-colors duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      aria-label={`Copy step ${stepIndex + 1}`}
      title="Copy step to clipboard"
      data-testid="copy-step-button"
    >
      <Clipboard className="h-4 w-4" />
    </button>
  );
}
