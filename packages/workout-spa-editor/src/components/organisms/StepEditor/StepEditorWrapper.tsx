import type { ReactNode } from "react";

type StepEditorWrapperProps = {
  className: string;
  children: ReactNode;
};

export function StepEditorWrapper({
  className,
  children,
}: StepEditorWrapperProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      {children}
    </div>
  );
}
