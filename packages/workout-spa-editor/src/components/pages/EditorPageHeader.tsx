import { PenLine } from "lucide-react";

import { ROUTE_HEADING_ATTR } from "../../routing/constants";

export type EditorPageHeaderProps = {
  mode: "new" | "edit";
};

const COPY = {
  new: {
    title: "New workout",
    description: "Create from scratch, generate with AI, or import a file.",
  },
  edit: {
    title: "Edit workout",
    description: "Refine steps, intervals, and targets.",
  },
} as const;

export function EditorPageHeader({ mode }: EditorPageHeaderProps) {
  const { title, description } = COPY[mode];

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-1">
        <PenLine className="h-5 w-5 text-primary" />
        <h1
          tabIndex={-1}
          {...{ [ROUTE_HEADING_ATTR]: "" }}
          className="text-xl font-semibold text-gray-900 dark:text-white"
        >
          {title}
        </h1>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
