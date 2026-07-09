import { ChevronDown, Sparkles } from "lucide-react";
import { lazy, Suspense } from "react";
import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { useAiBannerState } from "./use-ai-banner-state";

const AiWorkoutInput = lazy(() =>
  import("../../organisms/AiWorkoutInput/AiWorkoutInput").then((m) => ({
    default: m.AiWorkoutInput,
  }))
);

/**
 * Collapsed-by-default banner that wraps `AiWorkoutInput`.
 *
 * Open/armed/auto-collapse state and persistence are owned by
 * `useAiBannerState` — this component stays a pure render. The hook
 * seeds from `userPreferences.aiBannerExpanded`, writes toggles back,
 * and runs the one-shot auto-collapse-on-first-success rule.
 */
export function AiBanner() {
  const t = useTranslate("create-workout");
  const [, navigate] = useLocation();
  const { open, toggle } = useAiBannerState();

  return (
    <div
      data-testid="ai-banner"
      className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm dark:border-blue-800 dark:from-blue-950/50 dark:to-indigo-950/50"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="ai-banner-panel"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
          <Sparkles className="h-4 w-4" />
          {t("banner.toggle")}
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
