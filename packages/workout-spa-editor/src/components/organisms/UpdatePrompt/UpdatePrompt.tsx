import { useSyncExternalStore } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import { applyUpdate } from "../../../lib/service-worker/apply-update";
import {
  getUpdateState,
  subscribeUpdateState,
} from "../../../lib/service-worker/update-store";
import { Button } from "../../atoms/Button";

const REGION_CLASS =
  "fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md flex-wrap items-center justify-between gap-3 rounded-2xl border border-edge bg-surface p-4 shadow-lg";

/**
 * A new version is waiting. It stays until the athlete reloads: it never
 * dismisses itself and never reloads on its own (design D4).
 */
export const UpdatePrompt = () => {
  const t = useTranslate("common");
  const state = useSyncExternalStore(subscribeUpdateState, getUpdateState);
  if (state === "idle") return null;
  return (
    <div role="status" data-testid="update-prompt" className={REGION_CLASS}>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink-strong">
          {t("appUpdate.available")}
        </p>
        {state === "blocked" && (
          <p className="text-sm text-ink-body" data-testid="update-save-first">
            {t("appUpdate.saveFirst")}
          </p>
        )}
      </div>
      <Button
        loading={state === "applying"}
        disabled={state === "applying"}
        onClick={() => void applyUpdate()}
      >
        {t("appUpdate.reload")}
      </Button>
    </div>
  );
};
