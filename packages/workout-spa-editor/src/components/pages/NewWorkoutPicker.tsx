import { Download, Library, PenLine } from "lucide-react";
import type { ComponentType } from "react";
import { useLocation } from "wouter";

import { ROUTE_HEADING_ATTR } from "../../routing/constants";

type PickerTileProps = {
  id: "scratch" | "import" | "template";
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
};

function PickerTile({
  id,
  icon: Icon,
  title,
  description,
  onClick,
}: PickerTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`new-workout-picker-${id}`}
      className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-6 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
    >
      <Icon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
      <span className="font-medium">{title}</span>
      <span className="text-xs text-muted-foreground text-center">
        {description}
      </span>
    </button>
  );
}

export default function NewWorkoutPicker() {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-6 p-4" data-testid="new-workout-picker">
      <div className="space-y-2">
        <h1
          tabIndex={-1}
          {...{ [ROUTE_HEADING_ATTR]: "" }}
          className="text-xl font-semibold text-gray-900 dark:text-white"
        >
          Start a new workout
        </h1>
        <p className="text-sm text-muted-foreground">
          Create from scratch, import a file (FIT/TCX/ZWO), or start from a
          template.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PickerTile
          id="scratch"
          icon={PenLine}
          title="From scratch"
          description="Build a new workout from a blank canvas"
          onClick={() => navigate("/workout/new?source=scratch")}
        />
        <PickerTile
          id="import"
          icon={Download}
          title="Import"
          description="Upload a FIT, TCX, or ZWO file"
          onClick={() => navigate("/workout/new?action=import")}
        />
        <PickerTile
          id="template"
          icon={Library}
          title="From template"
          description="Start from an existing workout in your library"
          onClick={() => navigate("/library?source=template-picker")}
        />
      </div>
    </div>
  );
}
