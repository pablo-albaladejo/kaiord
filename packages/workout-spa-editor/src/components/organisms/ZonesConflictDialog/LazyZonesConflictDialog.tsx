import { Suspense, useState } from "react";

import { lazyPage } from "../../../lazy-page";
import { SilentErrorBoundary } from "../../molecules/SilentErrorBoundary";
import type { ZonesConflictDialogProps } from "./ZonesConflictDialog";

const ZonesConflictDialog = lazyPage(() =>
  import("./ZonesConflictDialog").then((m) => ({
    default: m.ZonesConflictDialog,
  }))
);

/**
 * The provider mounts the dialog app-wide, but it only opens on a zones
 * conflict: load it the first time it opens, then keep it mounted so its
 * decision state behaves exactly as an always-mounted dialog's.
 */
export const LazyZonesConflictDialog = (props: ZonesConflictDialogProps) => {
  const [opened, setOpened] = useState(props.open);
  if (props.open && !opened) setOpened(true);
  if (!opened) return null;
  return (
    <SilentErrorBoundary name="zones-conflict-dialog">
      <Suspense fallback={null}>
        <ZonesConflictDialog {...props} />
      </Suspense>
    </SilentErrorBoundary>
  );
};
