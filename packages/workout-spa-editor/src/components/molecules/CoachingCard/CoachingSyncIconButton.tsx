/**
 * Connected-state icon button for CoachingSyncButton. `routeInactive` swaps
 * the slate chrome for an amber "route off" treatment.
 */
import { Loader2, RefreshCw } from "lucide-react";

const IDLE_CLASSES =
  "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";
const INACTIVE_CLASSES =
  "border-edge-strong text-ink-strong hover:bg-ink-strong/10";

export const CoachingSyncIconButton: React.FC<{
  loading: boolean;
  reducedMotion: boolean;
  ariaLabel: string;
  title: string;
  routeInactive: boolean;
  onSync: () => void;
}> = ({ loading, reducedMotion, ariaLabel, title, routeInactive, onSync }) => (
  <button
    type="button"
    disabled={loading}
    onClick={onSync}
    aria-label={ariaLabel}
    title={title}
    className={`inline-flex h-8 w-8 items-center justify-center rounded border disabled:opacity-50 ${routeInactive ? INACTIVE_CLASSES : IDLE_CLASSES}`}
  >
    {loading ? (
      <Loader2
        className={reducedMotion ? "h-4 w-4" : "h-4 w-4 animate-spin"}
        aria-hidden="true"
      />
    ) : (
      <RefreshCw className="h-4 w-4" aria-hidden="true" />
    )}
  </button>
);
