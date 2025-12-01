import { useState } from "react";
import { useLibraryStore } from "../../../store/library-store";
import { useProfileStore } from "../../../store/profile-store";
import { useWorkoutStore } from "../../../store/workout-store";
import { ProfileManager } from "../../organisms/ProfileManager/ProfileManager";
import { WorkoutLibrary } from "../../organisms/WorkoutLibrary/WorkoutLibrary";
import { HeaderLogo } from "./components/HeaderLogo";
import { HeaderNav } from "./components/HeaderNav";
import { HelpDialog } from "./components/HelpDialog";

type LayoutHeaderProps = {
  onReplayTutorial?: () => void;
};

export const LayoutHeader = ({ onReplayTutorial }: LayoutHeaderProps) => {
  const [profileManagerOpen, setProfileManagerOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const { getActiveProfile } = useProfileStore();
  const activeProfile = getActiveProfile();
  const { templates } = useLibraryStore();
  const { currentWorkout, loadWorkout } = useWorkoutStore();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 kiroween:border-gray-800 kiroween:bg-gray-950">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <HeaderLogo />
        <HeaderNav
          activeProfileName={activeProfile?.name || null}
          libraryCount={templates.length}
          onProfileClick={() => setProfileManagerOpen(true)}
          onLibraryClick={() => setLibraryOpen(true)}
          onHelpClick={() => setHelpDialogOpen(true)}
        />
      </div>

      <ProfileManager
        open={profileManagerOpen}
        onOpenChange={setProfileManagerOpen}
      />

      <WorkoutLibrary
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onLoadWorkout={(template) => {
          loadWorkout(template.krd);
        }}
        hasCurrentWorkout={currentWorkout !== null}
      />

      <HelpDialog
        open={helpDialogOpen}
        onOpenChange={setHelpDialogOpen}
        onReplayTutorial={onReplayTutorial}
      />
    </header>
  );
};
