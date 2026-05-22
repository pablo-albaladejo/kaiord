import { Download, Library, PenLine } from "lucide-react";

import { PickerTile } from "./PickerTile";

export type NewWorkoutPickerTilesProps = {
  onScratch: () => void;
  onImport: () => void;
  onTemplate: () => void;
};

export function NewWorkoutPickerTiles({
  onScratch,
  onImport,
  onTemplate,
}: NewWorkoutPickerTilesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <PickerTile
        id="scratch"
        icon={PenLine}
        title="From scratch"
        description="Build a new workout from a blank canvas"
        onClick={onScratch}
      />
      <PickerTile
        id="import"
        icon={Download}
        title="Import"
        description="Upload a FIT, TCX, or ZWO file"
        onClick={onImport}
      />
      <PickerTile
        id="template"
        icon={Library}
        title="From template"
        description="Start from an existing workout in your library"
        onClick={onTemplate}
      />
    </div>
  );
}
