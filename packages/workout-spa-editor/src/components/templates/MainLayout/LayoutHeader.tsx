import { lazy, Suspense } from "react";
import { HeaderLogo } from "./components/HeaderLogo";
import { HeaderNav } from "./components/HeaderNav";
import { useLazyDialog } from "../../../hooks/use-lazy-dialog";
import { useLibraryStore } from "../../../store/library-store";
import { useProfileStore } from "../../../store/profile-store";
import { useWorkoutStore } from "../../../store/workout-store";

const ProfileManager = lazy(() =>
  import("../../organisms/ProfileManager/ProfileManager").then((m) => ({
    default: m.ProfileManager,
  }))
);
const WorkoutLibrary = lazy(() =>
  import("../../organisms/WorkoutLibrary/WorkoutLibrary").then((m) => ({
    default: m.WorkoutLibrary,
  }))
);
const HelpDialog = lazy(() =>
  import("./components/HelpDialog").then((m) => ({ default: m.HelpDialog }))
);

type LayoutHeaderProps = {
  onReplayTutorial?: () => void;
};

export const LayoutHeader = ({ onReplayTutorial }: LayoutHeaderProps) => {
  const profile = useLazyDialog();
  const library = useLazyDialog();
  const help = useLazyDialog();
  const { getActiveProfile } = useProfileStore();
  const activeProfile = getActiveProfile();
  const { templates } = useLibraryStore();
  const { currentWorkout, loadWorkout } = useWorkoutStore();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <HeaderLogo />
        <HeaderNav
          activeProfileName={activeProfile?.name || null}
          libraryCount={templates.length}
          onProfileClick={profile.show}
          onLibraryClick={library.show}
          onHelpClick={help.show}
        />
      </div>

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
            onLoadWorkout={(template) => {
              loadWorkout(template.krd);
            }}
            hasCurrentWorkout={currentWorkout !== null}
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
    </header>
  );
};
