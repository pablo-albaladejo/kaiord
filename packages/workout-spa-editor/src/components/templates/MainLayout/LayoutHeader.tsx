import { useSettingsDialog } from "../../../contexts";
import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useLazyDialog } from "../../../hooks/use-lazy-dialog";
import { useLibraryTemplatesLive } from "../../../hooks/use-library-templates-live";
import { HeaderLogo } from "./components/HeaderLogo";
import { HeaderNav } from "./components/HeaderNav";
import { LayoutHeaderDialogs } from "./components/LayoutHeaderDialogs";

type LayoutHeaderProps = {
  onReplayTutorial?: () => void;
};

export const LayoutHeader = ({ onReplayTutorial }: LayoutHeaderProps) => {
  const profile = useLazyDialog();
  const help = useLazyDialog();
  const {
    open: settingsOpen,
    show: settingsShow,
    hide: settingsHide,
  } = useSettingsDialog();
  // Reactive reads via the Dexie singleton; `undefined` while loading
  // collapses to a sensible default so the header can render.
  const activeProfile = useActiveProfileLive()?.profile ?? null;
  const templates = useLibraryTemplatesLive() ?? [];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <HeaderLogo />
        <HeaderNav
          activeProfileName={activeProfile?.name || null}
          libraryCount={templates.length}
          onProfileClick={profile.show}
          onHelpClick={help.show}
          onSettingsClick={settingsShow}
        />
      </div>
      <LayoutHeaderDialogs
        profile={profile}
        help={help}
        settingsOpen={settingsOpen}
        settingsHide={settingsHide}
        onReplayTutorial={onReplayTutorial}
      />
    </header>
  );
};
