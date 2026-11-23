import type { LlmProviderType } from "@kaiord/ai/providers";
import { useSyncExternalStore } from "react";

import { useTranslate } from "../../../i18n/use-translate";
import {
  type HealthSharingDecision,
  healthSharingStore,
} from "../../../lib/health-sharing-store";

const OPTIONS = [
  { value: "ask", key: "inventory.healthAsk" },
  { value: "always", key: "inventory.healthAlways" },
  { value: "never", key: "inventory.healthNever" },
] as const;

/** The standing answer for one Provider, changeable here. */
export const ProviderHealthChoice = (props: {
  providerType: LlmProviderType;
  providerName: string;
}) => {
  const t = useTranslate("dataFlows");
  const decisions = useSyncExternalStore(
    healthSharingStore.subscribe,
    healthSharingStore.read
  );
  const current = decisions[props.providerType] ?? "ask";
  const id = `health-sharing-${props.providerType}`;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
      <label htmlFor={id} className="text-ink-body">
        {t("inventory.healthLabel", { provider: props.providerName })}
      </label>
      <select
        id={id}
        value={current}
        className="rounded-md border border-edge bg-surface px-2 py-1 text-ink-body"
        onChange={(event) => {
          const value = event.target.value;
          healthSharingStore.set(
            props.providerType,
            value === "ask" ? null : (value as HealthSharingDecision)
          );
        }}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.key)}
          </option>
        ))}
      </select>
    </div>
  );
};
