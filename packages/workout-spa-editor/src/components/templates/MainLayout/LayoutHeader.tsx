import { lazy, Suspense } from "react";

import { StatusHeader } from "../../molecules/StatusHeader/StatusHeader";
import { HeaderLogo } from "./components/HeaderLogo";
import { useHeaderOverlays } from "./use-header-overlays";

const HelpDialog = lazy(() =>
  import("./components/HelpDialog").then((m) => ({ default: m.HelpDialog }))
);

const ShortcutSheet = lazy(() =>
  import("../../organisms/ShortcutSheet/ShortcutSheet").then((m) => ({
    default: m.ShortcutSheet,
  }))
);

const CommandPalette = lazy(() =>
  import("../../organisms/CommandPalette/CommandPalette").then((m) => ({
    default: m.CommandPalette,
  }))
);

type LayoutHeaderProps = {
  onReplayTutorial?: () => void;
};

export const LayoutHeader = ({ onReplayTutorial }: LayoutHeaderProps) => {
  const { help, shortcuts, palette, onPaletteShortcuts } = useHeaderOverlays();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex min-h-14 max-w-7xl flex-col items-center justify-between gap-2 px-4 py-2 md:min-h-16 md:gap-3 md:px-6 lg:flex-row lg:gap-4 lg:px-8">
        <HeaderLogo />
        <StatusHeader onHelpClick={help.show} />
      </div>
      <Suspense fallback={null}>
        {help.mounted && (
          <HelpDialog
            open={help.open}
            onOpenChange={help.setOpen}
            onReplayTutorial={onReplayTutorial}
          />
        )}
        {shortcuts.mounted && (
          <ShortcutSheet
            open={shortcuts.open}
            onOpenChange={shortcuts.setOpen}
          />
        )}
        {palette.mounted && (
          <CommandPalette
            open={palette.open}
            onOpenChange={palette.setOpen}
            onShowShortcuts={onPaletteShortcuts}
          />
        )}
      </Suspense>
    </header>
  );
};
