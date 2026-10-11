import { lazy, Suspense } from "react";

import { StatusHeader } from "../../molecules/StatusHeader/StatusHeader";
import { HeaderLogo } from "./components/HeaderLogo";
import { useHeaderOverlays } from "./use-header-overlays";

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

export const LayoutHeader = () => {
  const { shortcuts, palette, onPaletteShortcuts } = useHeaderOverlays();

  return (
    <header className="sticky top-0 z-50 border-b border-edge bg-surface shadow-sm">
      {/* One row on a phone (brand left, nav right). From md the seven
          destinations no longer fit beside the brand, so the nav wraps under
          it until lg gives it the room again. */}
      <div
        data-testid="layout-header-row"
        className="mx-auto flex min-h-14 max-w-7xl flex-row items-center justify-between gap-2 px-4 py-1 md:min-h-16 md:flex-col md:gap-3 md:px-6 md:py-2 lg:flex-row lg:gap-4 lg:px-8"
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
