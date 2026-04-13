/**
 * FirstVisitState - Onboarding when no workouts exist anywhere.
 *
 * Shows 3 entry paths: Create, Import, Connect.
 */

import { Download, PenLine, Plug } from "lucide-react";
import { useLocation } from "wouter";

import { useSettingsDialog } from "../../../contexts";

export type FirstVisitStateProps = {
  onSettingsClick?: () => void;
};

function EntryPath({
  icon: IconCmp,
  title,
  description,
  onClick,
}: {
  icon: typeof PenLine;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-gray-50 transition-colors dark:hover:bg-gray-800"
    >
      <IconCmp className="h-8 w-8 text-primary-600 dark:text-primary-400" />
      <span className="font-medium">{title}</span>
      <span className="text-xs text-muted-foreground text-center">
        {description}
      </span>
    </button>
  );
}

export function FirstVisitState({ onSettingsClick }: FirstVisitStateProps) {
  const [, navigate] = useLocation();
  const { show } = useSettingsDialog();

  return (
    <div
      data-testid="first-visit-state"
      className="flex flex-col items-center gap-6 py-12"
    >
      <h2 className="text-xl font-semibold">Welcome to Kaiord</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Your calendar-centric workout hub. Create, import, or connect to get
        started.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <EntryPath
          icon={PenLine}
          title="Create"
          description="Build a new workout from scratch"
          onClick={() => navigate("/workout/new")}
        />
        <EntryPath
          icon={Download}
          title="Import"
          description="Import FIT, TCX, or ZWO files"
          onClick={() => navigate("/workout/new?action=import")}
        />
        <EntryPath
          icon={Plug}
          title="Connect"
          description="Link a platform like Garmin Connect"
          onClick={onSettingsClick ?? show}
        />
      </div>
    </div>
  );
}
