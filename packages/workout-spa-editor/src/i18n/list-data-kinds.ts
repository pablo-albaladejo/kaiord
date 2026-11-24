import type { DataKind } from "../application/data-flows/data-kinds";

type Translate = (key: string, params?: Record<string, string>) => string;

/** "sleep, weight and HRV", in the reader's language (`dataFlows` dictionary). */
export const listKinds = (
  kinds: readonly DataKind[],
  t: Translate,
  locale: string
): string =>
  new Intl.ListFormat(locale, { type: "conjunction" }).format(
    kinds.map((kind) => t(`kinds.${kind}`))
  );
