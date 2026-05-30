import { useLocation } from "wouter";

import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";

/** Empty state shown when no AI provider is configured. */
export function CreateProvidersEmpty() {
  const [, navigate] = useLocation();

  return (
    <div className="rounded-[16px] border border-dashed border-slate-700 bg-surface-deep p-6 text-center">
      <Icon
        icon={ICON_MAP.sparkle}
        size="md"
        className="mx-auto mb-3 text-sky-400"
      />
      <p className="mb-1 text-[15px] font-semibold text-slate-50">
        Configure an AI provider to get started
      </p>
      <p className="mb-4 text-[12.5px] text-slate-500">
        Supports Anthropic, OpenAI, and Google
      </p>
      <Button onClick={() => navigate("/settings/ai")}>
        <Icon icon={ICON_MAP.gear} size="sm" color="inherit" />
        Open AI settings
      </Button>
    </div>
  );
}
