import { HeaderLogo } from "./components/HeaderLogo";
import { HeaderNav } from "./components/HeaderNav";
import { LayoutHeaderDialogs } from "./components/LayoutHeaderDialogs";
import { useLazyDialog } from "../../../hooks/use-lazy-dialog";
import { useLibraryStore } from "../../../store/library-store";
import { useProfileStore } from "../../../store/profile-store";
import { useSettingsDialogStore } from "../../../store/settings-dialog-store";
import { useWorkoutStore } from "../../../store/workout-store";

type LayoutHeaderProps = {
  onReplayTutorial?: () => void;
};

export const LayoutHeader = ({ onReplayTutorial }: LayoutHeaderProps) => {
  const profile = useLazyDialog();
  const library = useLazyDialog();
  const help = useLazyDialog();
  const settingsOpen = useSettingsDialogStore((s) => s.open);
  const settingsShow = useSettingsDialogStore((s) => s.show);
  const settingsHide = useSettingsDialogStore((s) => s.hide);
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
          onSettingsClick={settingsShow}
        />
      </div>
      <LayoutHeaderDialogs
        profile={profile}
        library={library}
        help={help}
        settingsOpen={settingsOpen}
        settingsHide={settingsHide}
        onReplayTutorial={onReplayTutorial}
        onLoadWorkout={(template) => loadWorkout(template.krd)}
        hasCurrentWorkout={currentWorkout !== null}
      />
    </header>
  );
};
