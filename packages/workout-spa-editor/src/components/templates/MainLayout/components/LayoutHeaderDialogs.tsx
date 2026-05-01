import { lazy, Suspense } from "react";

import type { useLazyDialog } from "../../../../hooks/use-lazy-dialog";

const ProfileManager = lazy(() =>
  import("../../../organisms/ProfileManager/ProfileManager").then((m) => ({
    default: m.ProfileManager,
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
  help: LazyDialog;
  settingsOpen: boolean;
  settingsHide: () => void;
  onReplayTutorial?: () => void;
};

export const LayoutHeaderDialogs = ({
  profile,
  help,
  settingsOpen,
  settingsHide,
  onReplayTutorial,
}: LayoutHeaderDialogsProps) => (
  <>
    <Suspense fallback={null}>
      {profile.mounted && (
        <ProfileManager open={profile.open} onOpenChange={profile.setOpen} />
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
