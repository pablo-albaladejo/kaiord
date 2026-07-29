import { toIntegrationId } from "../../../application/connections/data-type-sources";
import type { SourceOfTruthOptions } from "../../../application/connections/source-of-truth-options";
import type { Translate } from "../../../i18n/use-translate";
import { sourceName } from "./routing-copy";

export const choiceLabel = (sourceId: string): string =>
  sourceName(toIntegrationId(sourceId));

/**
 * What the panel says BEFORE either button is reachable.
 *
 * The unranked case gets two sentences rather than one: the first states what
 * the type does today (every source kept, last write wins), the second states
 * that picking below replaces that with a ranking and that the choice is
 * reversible here. Storing a ranking changes how the type is READ, so it may
 * not be discovered after the fact — a "Change source" button that quietly
 * flipped the mode would be a requirement satisfied while surprising the user.
 *
 * An already-ranked row is only reordering: it says what it reads today and
 * warns about nothing, because nothing about the semantics changes.
 */
export const pickerIntro = (
  options: SourceOfTruthOptions,
  type: string,
  t: Translate
): string[] => {
  if (options.mode !== "priority") {
    return [
      t("routing.change.unranked", { type }),
      t("routing.change.willRank", { type }),
    ];
  }
  if (options.current === undefined) {
    return [t("routing.change.stalled", { type })];
  }
  return [
    t("routing.change.ranked", {
      type,
      name: choiceLabel(options.current),
    }),
  ];
};
