import { useState } from "react";
import { useLocation, useSearch } from "wouter";

import { ROUTE_HEADING_ATTR } from "../../routing/constants";
import { formatDateLabel } from "../molecules/TemplatePickerDialog/format-date-label";
import { TemplatePickerDialog } from "../molecules/TemplatePickerDialog/TemplatePickerDialog";
import { NewWorkoutPickerTiles } from "./NewWorkoutPickerTiles";
import { usePickerSchedule } from "./use-picker-schedule";

export default function NewWorkoutPicker() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const date = new URLSearchParams(search).get("date");
  const [pickerOpen, setPickerOpen] = useState(false);
  const schedule = usePickerSchedule(date);

  const heading = date
    ? `Schedule for ${formatDateLabel(date)}`
    : "Start a new workout";
  const scratchHref = date
    ? `/workout/new?source=scratch&date=${date}`
    : "/workout/new?source=scratch";
  const importHref = date
    ? `/workout/new?action=import&date=${date}`
    : "/workout/new?action=import";

  const handleTemplate = () => {
    if (date) {
      setPickerOpen(true);
      return;
    }
    navigate("/library?source=template-picker");
  };

  const handlePick = (templateId: string) => {
    void schedule(templateId).then((result) => {
      if (result === "ok") setPickerOpen(false);
    });
  };

  return (
    <div className="space-y-6 p-4" data-testid="new-workout-picker">
      <div className="space-y-2">
        <h1
          tabIndex={-1}
          {...{ [ROUTE_HEADING_ATTR]: "" }}
          className="text-xl font-semibold text-gray-900 dark:text-white"
        >
          {heading}
        </h1>
        <p className="text-sm text-muted-foreground">
          Create from scratch, import a file (FIT/TCX/ZWO), or start from a
          template.
        </p>
      </div>
      <NewWorkoutPickerTiles
        onScratch={() => navigate(scratchHref)}
        onImport={() => navigate(importHref)}
        onTemplate={handleTemplate}
      />
      <TemplatePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        date={date ?? ""}
        onPick={handlePick}
      />
    </div>
  );
}
