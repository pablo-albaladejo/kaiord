import { ChevronDown, Sparkles } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "wouter";

import { useAiRuntimeStore } from "../../../store/ai-runtime-store";

const AiWorkoutInput = lazy(() =>
  import("../../organisms/AiWorkoutInput/AiWorkoutInput").then((m) => ({
    default: m.AiWorkoutInput,
  }))
);

/**
 * Collapsed-by-default banner that wraps `AiWorkoutInput`.
 *
 * Auto-collapse rule (per plan A4): the panel auto-collapses ONLY on
 * the first AI-generation success after the user expanded it. Manual
 * step adds (`+ Add first step`) never collapse it. Subsequent AI
 * successes do not auto-collapse either — the user has now seen the
 * banner and owns the state.
 */
export function AiBanner() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const [hasAutoCollapsed, setHasAutoCollapsed] = useState(false);
  const generation = useAiRuntimeStore((s) => s.generation);

  useEffect(() => {
    if (!open) return;
    if (generation.status === "success" && armed) {
      setOpen(false);
      setArmed(false);
      setHasAutoCollapsed(true);
    }
  }, [generation.status, open, armed]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !hasAutoCollapsed) setArmed(true);
  };

  return (
    <div
      data-testid="ai-banner"
      className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50"
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls="ai-banner-panel"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </span>
        <ChevronDown
          className={`h-4 w-4 text-blue-600 transition-transform dark:text-blue-400 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          id="ai-banner-panel"
          className="border-t border-blue-200 dark:border-blue-800"
        >
          <Suspense fallback={null}>
            <AiWorkoutInput onSettingsClick={() => navigate("/settings/ai")} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
