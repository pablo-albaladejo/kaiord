import { useActiveLocale } from "../i18n/LocaleProvider";
import { type ReviewCopy, reviewCopyFor } from "../lib/workout-review";

/** The review step wording in the active locale. */
export function useReviewCopy(): ReviewCopy {
  return reviewCopyFor(useActiveLocale());
}
