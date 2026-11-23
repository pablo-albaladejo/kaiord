import type { Locale } from "@kaiord/i18n";

import { getTranslate, type Translate } from "../../i18n/use-translate";

/** What the review helpers need to word a step: the `workout-review` namespace
    and the heart-rate unit in the same locale (`common` units.hr). */
export type ReviewCopy = {
  t: Translate;
  hrUnit: string;
};

/** The review copy in a locale. */
export function reviewCopyFor(locale: Locale): ReviewCopy {
  return {
    t: getTranslate("workout-review", locale),
    hrUnit: getTranslate("common", locale)("units.hr"),
  };
}
