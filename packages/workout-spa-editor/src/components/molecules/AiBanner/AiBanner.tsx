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
      className="rounded-lg border border-edge bg-surface-elevated shadow-sm"
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="ai-banner-panel"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-ink-strong">
          <Sparkles className="h-4 w-4" />
          {t("banner.toggle")}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div id="ai-banner-panel" className="border-t border-edge">
          <Suspense fallback={null}>
            <AiWorkoutInput onSettingsClick={() => navigate("/settings/ai")} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
