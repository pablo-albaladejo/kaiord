import * as Dialog from "@radix-ui/react-dialog";
import { HelpCircle, Library, User, X } from "lucide-react";
import { useState } from "react";
import { useLibraryStore } from "../../../store/library-store";
import { useProfileStore } from "../../../store/profile-store";
import { useWorkoutStore } from "../../../store/workout-store";
import { Button } from "../../atoms/Button/Button";
import { ThemeToggle } from "../../atoms/ThemeToggle";
import { ProfileManager } from "../../organisms/ProfileManager/ProfileManager";
import { WorkoutLibrary } from "../../organisms/WorkoutLibrary/WorkoutLibrary";
import { HelpSection } from "../../pages/HelpSection/HelpSection";

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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white kiroween:text-white sm:text-2xl">
            Workout Editor
          </h1>
        </div>

        <nav className="flex items-center gap-2" aria-label="Main navigation">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProfileManagerOpen(true)}
            aria-label="Open profile manager"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {activeProfile ? activeProfile.name : "Profiles"}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLibraryOpen(true)}
            aria-label="Open workout library"
            className="relative"
          >
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Library</span>
            {templates.length > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white"
                aria-label={`${templates.length} workouts in library`}
              >
                {templates.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHelpDialogOpen(true)}
            aria-label="Open help (Press ?)"
            title="Help (?)"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Help</span>
          </Button>
          <ThemeToggle />
        </nav>
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

      <Dialog.Root open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] overflow-y-auto border border-gray-200 bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white kiroween:text-white">
                Help & Documentation
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:ring-offset-gray-950 dark:focus:ring-primary-400 dark:data-[state=open]:bg-gray-800"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <HelpSection onReplayTutorial={onReplayTutorial} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
};
