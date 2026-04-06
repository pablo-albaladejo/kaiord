import { lazy, Suspense } from "react";

import type { useLazyDialog } from "../../../../hooks/use-lazy-dialog";
import type { WorkoutTemplate } from "../../../../types/workout-library";

const ProfileManager = lazy(() =>
  import("../../../organisms/ProfileManager/ProfileManager").then((m) => ({
    default: m.ProfileManager,
  }))
);
const WorkoutLibrary = lazy(() =>
  import("../../../organisms/WorkoutLibrary/WorkoutLibrary").then((m) => ({
    default: m.WorkoutLibrary,
  }))
);
const HelpDialog = lazy(() =>
  import("./HelpDialog").then((m) => ({ default: m.HelpDialog }))
);
const SettingsPanel = lazy(() =>
  import("../../../organisms/SettingsPanel/SettingsPanel").then((m) => ({
    default: m.SettingsPanel,
  }))
);

type LazyDialog = ReturnType<typeof useLazyDialog>;

type LayoutHeaderDialogsProps = {
  profile: LazyDialog;
  library: LazyDialog;
  help: LazyDialog;
  settingsOpen: boolean;
  settingsHide: () => void;
  onReplayTutorial?: () => void;
  onLoadWorkout: (template: WorkoutTemplate) => void;
  hasCurrentWorkout: boolean;
};

export const LayoutHeaderDialogs = ({
  profile,
  library,
  help,
  settingsOpen,
  settingsHide,
  onReplayTutorial,
  onLoadWorkout,
  hasCurrentWorkout,
}: LayoutHeaderDialogsProps) => (
  <>
    <Suspense fallback={null}>
      {profile.mounted && (
        <ProfileManager open={profile.open} onOpenChange={profile.setOpen} />
      )}
    </Suspense>
    <Suspense fallback={null}>
      {library.mounted && (
        <WorkoutLibrary
          open={library.open}
          onOpenChange={library.setOpen}
          onLoadWorkout={onLoadWorkout}
          hasCurrentWorkout={hasCurrentWorkout}
        />
      )}
    </Suspense>
    <Suspense fallback={null}>
      {help.mounted && (
        <HelpDialog
          open={help.open}
          onOpenChange={help.setOpen}
          onReplayTutorial={onReplayTutorial}
        />
      )}
    </Suspense>
    <Suspense fallback={null}>
      {settingsOpen && (
        <SettingsPanel
          open={settingsOpen}
          onOpenChange={(open) => {
            if (!open) settingsHide();
          }}
        />
      )}
    </Suspense>
  </>
);
