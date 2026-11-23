import type { LlmProviderType } from "@kaiord/ai/providers";

import {
  healthKindsOf,
  providerHealthKinds,
} from "../../../application/data-flows/data-flows";
import type { DataKind } from "../../../application/data-flows/data-kinds";
import {
  DESTINATIONS,
  PROVIDER_DESTINATION,
} from "../../../application/data-flows/destinations";
import type { HealthQuestion } from "../../../lib/health-sharing-gate";

type Translate = (key: string, params?: Record<string, string>) => string;

export const providerName = (type: LlmProviderType): string =>
  DESTINATIONS[PROVIDER_DESTINATION[type]].name;

/** "sleep, weight and HRV", in the reader's language. */
export const listKinds = (
  kinds: readonly DataKind[],
  t: Translate,
  locale: string
): string =>
  new Intl.ListFormat(locale, { type: "conjunction" }).format(
    kinds.map((kind) => t(`kinds.${kind}`))
  );

export type HealthNoticeCopy = {
  title: string;
  body: string;
  terms: string;
  once: string;
  onceResult: string;
  always: string;
  alwaysResult: string;
  never: string;
  neverResult: string;
  changeLater: string;
};

/** Every sentence of the notice, its kinds read from the flow registry. */
export const healthNoticeCopy = (
  question: HealthQuestion,
  t: Translate,
  locale: string
): HealthNoticeCopy => {
  const provider = providerName(question.providerType);
  const now = listKinds(healthKindsOf(question.flow), t, locale);
  const all = listKinds(providerHealthKinds(), t, locale);
  return {
    title: t("notice.title", { provider }),
    body: t(`notice.${question.flow}`, { provider, kinds: now }),
    terms: t("notice.terms", { provider }),
    once: t("notice.once"),
    onceResult: t("notice.onceResult"),
    always: t("notice.always", { provider }),
    alwaysResult: t("notice.alwaysResult", { provider, kinds: all }),
    never: t("notice.never"),
    neverResult: `${t(`notice.neverResult.${question.flow}`)} ${t(
      "notice.neverStays",
      { provider }
    )}`,
    changeLater: t("notice.changeLater"),
  };
};
