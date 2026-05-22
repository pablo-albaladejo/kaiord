/**
 * TemplatePickerDialog — narrow in-flow picker.
 *
 * Bound to a parent route's transient state (a calendar date). On
 * selection, returns the template id via `onPick` and closes itself;
 * scheduling is the caller's responsibility (see the
 * `scheduleTemplate` application use case).
 *
 * Surface-classification contract (see openspec/specs/spa-routing):
 *   - search-only — no delete, no edit, no destination affordances.
 *   - accessible name MUST include the date so SR users hear the
 *     cell context the dialog is bound to.
 *
 * The heavy list is lazy-loaded so callers (NewWorkoutPicker, LibraryPage)
 * do not pull the picker eagerly.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { lazy, Suspense, useId, useState } from "react";

import { useLibraryTemplatesLive } from "../../../hooks/use-library-templates-live";
import {
  DIALOG_CONTENT_CLASSES,
  DIALOG_OVERLAY_CLASSES,
} from "../../organisms/WorkoutLibrary/constants";
import { formatDateLabel } from "./format-date-label";

const TemplatePickerList = lazy(() =>
  import("./TemplatePickerList").then((m) => ({
    default: m.TemplatePickerList,
  }))
);

export type TemplatePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onPick: (templateId: string) => void;
};

export function TemplatePickerDialog({
  open,
  onOpenChange,
  date,
  onPick,
}: TemplatePickerDialogProps) {
  const titleId = useId();
  const [searchTerm, setSearchTerm] = useState("");
  const liveTemplates = useLibraryTemplatesLive();
  const isLoading = liveTemplates === undefined;
  const templates = liveTemplates ?? [];

  const handlePick = (templateId: string) => {
    onPick(templateId);
    onOpenChange(false);
  };

  const dateLabel = formatDateLabel(date);
  const titleText = dateLabel
    ? `Pick a template for ${dateLabel}`
    : "Pick a template";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={DIALOG_OVERLAY_CLASSES} />
        <Dialog.Content
          aria-labelledby={titleId}
          aria-describedby={undefined}
          className={DIALOG_CONTENT_CLASSES}
          data-testid="template-picker-dialog"
        >
          <Dialog.Title
            id={titleId}
            className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
          >
            {titleText}
          </Dialog.Title>
          <Suspense
            fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
          >
            <TemplatePickerList
              templates={templates}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onPick={handlePick}
            />
          </Suspense>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
