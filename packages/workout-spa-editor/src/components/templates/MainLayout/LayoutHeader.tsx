import { Suspense } from "react";

import { lazyPage } from "../../../lazy-page";
import { StatusHeader } from "../../molecules/StatusHeader/StatusHeader";
import { HeaderLogo } from "./components/HeaderLogo";
import { useHeaderOverlays } from "./use-header-overlays";

const ShortcutSheet = lazyPage(() =>
  import("../../organisms/ShortcutSheet/ShortcutSheet").then((m) => ({
    default: m.ShortcutSheet,
  }))
);

const CommandPalette = lazyPage(() =>
  import("../../organisms/CommandPalette/CommandPalette").then((m) => ({
    default: m.CommandPalette,
  }))
);

export const LayoutHeader = () => {
  const { shortcuts, palette, onPaletteShortcuts } = useHeaderOverlays();

  return (
    <header className="sticky top-0 z-50 border-b border-edge bg-surface shadow-sm">
      {/* One row on a phone (brand left, nav right). From md the seven
          destinations no longer fit beside the brand, so the nav moves under
          it until xl: at lg the Spanish labels and the avatar do not fit
          beside the brand. */}
      <div
        data-testid="layout-header-row"
        className="mx-auto flex min-h-14 max-w-7xl flex-row items-center justify-between gap-2 px-4 py-1 md:min-h-16 md:flex-col md:gap-3 md:px-6 md:py-2 lg:px-8 xl:flex-row xl:gap-4"
      >
        <HeaderLogo />
        <StatusHeader />
      </div>
      <Suspense fallback={null}>
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
