import { lazy, Suspense } from "react";

import { useLazyDialog } from "../../../hooks/use-lazy-dialog";
import { StatusHeader } from "../../molecules/StatusHeader/StatusHeader";
import { HeaderLogo } from "./components/HeaderLogo";

const HelpDialog = lazy(() =>
  import("./components/HelpDialog").then((m) => ({ default: m.HelpDialog }))
);

type LayoutHeaderProps = {
  onReplayTutorial?: () => void;
};

export const LayoutHeader = ({ onReplayTutorial }: LayoutHeaderProps) => {
  const help = useLazyDialog();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-col items-center justify-between gap-2 px-4 py-2 sm:flex-row sm:gap-4 sm:px-6 lg:px-8">
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
      </Suspense>
    </header>
  );
};
