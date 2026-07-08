import { useTranslate } from "../../i18n/use-translate";

/**
 * RouteSpinner - Loading fallback for lazy-loaded routes.
 */
export function RouteSpinner() {
  const t = useTranslate("common");
  return (
    <div
      className="flex items-center justify-center p-12"
      role="status"
      aria-label={t("a11y.loadingPage")}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}
