import { PenLine } from "lucide-react";
import type { ReactNode } from "react";

import { useTranslate } from "../../i18n/use-translate";
import { ROUTE_HEADING_ATTR } from "../../routing/constants";
import { BackButton } from "../atoms/BackButton/BackButton";

export type EditorPageHeaderProps = {
  mode: "new" | "edit";
  onBack?: () => void;
  /** Trailing control of the title row (the edit mode's "Save changes"). */
  action?: ReactNode;
};

const COPY = {
  new: {
    title: "pageHeader.newTitle",
    description: "pageHeader.newDescription",
  },
  edit: {
    title: "pageHeader.editTitle",
    description: "pageHeader.editDescription",
  },
} as const;

export function EditorPageHeader({
  mode,
  onBack,
  action,
}: EditorPageHeaderProps) {
  const t = useTranslate("editor");
  const { title, description } = COPY[mode];

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-1">
        {onBack && <BackButton onClick={onBack} testId="editor-back-button" />}
        <PenLine className="h-5 w-5 text-primary" />
        <h1
          tabIndex={-1}
          {...{ [ROUTE_HEADING_ATTR]: "" }}
          className="text-xl font-semibold text-ink-strong"
        >
          {t(title)}
        </h1>
        {action}
      </div>
      <p className="text-sm text-ink-muted">{t(description)}</p>
    </div>
  );
}
