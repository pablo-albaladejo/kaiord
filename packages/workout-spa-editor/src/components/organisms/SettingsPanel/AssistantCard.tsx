import { modelDisplayName } from "@kaiord/ai/providers";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { AssistantUsage } from "./AssistantUsage";
import { keyStatusOf } from "./key-status";
import { KeyStatusBadge } from "./KeyStatusBadge";
import { ModelChoiceSelect } from "./ModelChoiceSelect";
import { useAiModelsHandlers } from "./use-ai-models-handlers";
import { useEffectiveModels } from "./use-effective-models";

const PRINCIPAL = ["default"] as const;

/** The athlete's main model: what it is, where it runs, what it cost. */
export function AssistantCard() {
  const t = useTranslate("settings");
  const athlete = useActiveProfileLive()?.profile?.name;
  const { profileId, providers, models } = useEffectiveModels(PRINCIPAL);
  const { onSetBinding } = useAiModelsHandlers();
  const effective = models.default!;
  const running = effective.running;
  const account = providers.find((p) => p.id === running?.providerId);

  let body: React.ReactNode;
  if (!profileId) body = <Hint text={t("assistant.noAthlete")} />;
  else if (!running || !account) body = <Hint text={t("assistant.empty")} />;
  else
    body = (
      <>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            data-testid="assistant-model"
            className="font-semibold text-ink-strong"
          >
            {modelDisplayName(running.modelId)}
          </span>
          <span className="text-sm text-ink-muted">
            {t("assistant.runsOn", { account: account.label })}
          </span>
          <KeyStatusBadge status={keyStatusOf(account)} />
        </div>
        <AssistantUsage />
        <ModelChoiceSelect
          id="model-default"
          label={t("models.default")}
          providers={providers}
          effective={effective}
          onChoose={(choice) =>
            onSetBinding({ profileId, purpose: "default", ...choice })
          }
        />
      </>
    );

  return (
    <div className="space-y-3 rounded-lg border border-edge-strong p-4">
      <h3 className="m-0 text-base font-semibold text-ink-strong">
        {athlete
          ? t("assistant.title", { athlete })
          : t("assistant.titleNoAthlete")}
      </h3>
      {body}
    </div>
  );
}

const Hint = ({ text }: { text: string }) => (
  <p className="m-0 text-sm text-ink-muted">{text}</p>
);
