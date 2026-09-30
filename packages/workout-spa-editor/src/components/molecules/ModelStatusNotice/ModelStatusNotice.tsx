/**
 * Lifecycle notice for a stored model id: a retired one (the provider answers
 * 404) says which same-tier successor is used instead; a deprecated one (still
 * served, announced for retirement) hints at its successor and, when the
 * provider has dated it, the retirement date. Renders nothing otherwise.
 */
import { deprecationOf, retiredSuccessor } from "@kaiord/ai/providers";

import { useTranslate } from "../../../i18n/use-translate";
import type { LlmProviderType } from "../../../store/ai-store-types";

export type ModelStatusNoticeProps = {
  type: LlmProviderType;
  modelId: string | null;
  testIdPrefix: string;
};

export function ModelStatusNotice({
  type,
  modelId,
  testIdPrefix,
}: ModelStatusNoticeProps) {
  const t = useTranslate("settings");
  if (!modelId) return null;
  const successor = retiredSuccessor(type, modelId);
  if (successor) {
    return (
      <p
        role="alert"
        data-testid={`${testIdPrefix}-retired`}
        className="mt-1 text-xs text-danger-text"
      >
        {t("models.retired", { model: modelId, successor })}
      </p>
    );
  }
  const deprecation = deprecationOf(type, modelId);
  if (!deprecation) return null;
  const vars = { model: modelId, successor: deprecation.successor };
  return (
    <p
      role="status"
      data-testid={`${testIdPrefix}-deprecated`}
      className="mt-1 text-xs text-ink-muted"
    >
      {deprecation.retiresOn
        ? t("models.deprecatedOn", { ...vars, date: deprecation.retiresOn })
        : t("models.deprecated", vars)}
    </p>
  );
}
