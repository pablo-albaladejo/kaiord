/**
 * EmptyDayDialog - Options when clicking an empty calendar day.
 *
 * Offers "Add from Library" (in-flow picker dialog, preserves the
 * date prop) and "Create new workout" (navigates to the new-workout
 * route with the date as a query param).
 *
 * The picker is mounted as a sibling Dialog and dispatches the
 * `scheduleTemplate` application use case directly with the dialog's
 * `date` prop — no `useScheduleTemplate` hook (that mounts a date-
 * confirmation dialog and the date is already known here).
 */

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { useLocation } from "wouter";

import { scheduleTemplate } from "../../../application/library/schedule-template";
import { usePersistence } from "../../../contexts/persistence-context";
import { useToastContext } from "../../../contexts/ToastContext";
import { TemplatePickerDialog } from "../TemplatePickerDialog";
import { EmptyDayChoices } from "./EmptyDayChoices";

const TOAST_SCHEDULE_OK_TITLE = "Workout scheduled";
const TOAST_SCHEDULE_OK_DESC = "Added to your calendar.";
const TOAST_SCHEDULE_FAIL_TITLE = "Schedule failed";
const TOAST_SCHEDULE_FAIL_DESC = "Could not add the workout — please retry.";

export type EmptyDayDialogProps = {
  date: string | null;
  onClose: () => void;
};

export function EmptyDayDialog({ date, onClose }: EmptyDayDialogProps) {
  const [, navigate] = useLocation();
  const persistence = usePersistence();
  const toast = useToastContext();
  const [pickerOpen, setPickerOpen] = useState(false);
  const isOpen = date !== null;

  const handleCreate = () => {
    onClose();
    navigate(`/workout/new?date=${date}`);
  };

  const handlePick = (templateId: string) => {
    if (!date) return;
    void scheduleTemplate(persistence, { templateId, date })
      .then(() => {
        toast.success(TOAST_SCHEDULE_OK_TITLE, TOAST_SCHEDULE_OK_DESC);
        setPickerOpen(false);
        onClose();
      })
      .catch(() => {
        toast.error(TOAST_SCHEDULE_FAIL_TITLE, TOAST_SCHEDULE_FAIL_DESC);
      });
  };

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <EmptyDayChoices
              date={date}
              onLibrary={() => setPickerOpen(true)}
              onCreate={handleCreate}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <TemplatePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        date={date ?? ""}
        onPick={handlePick}
      />
    </>
  );
}
