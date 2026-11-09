import { Link } from "wouter";

import { useTranslate } from "../../i18n/use-translate";

type RouteErrorFallbackProps = {
  onRetry: () => void;
};

export function RouteErrorFallback({ onRetry }: RouteErrorFallbackProps) {
  const t = useTranslate("common");
  return (
    <div className="flex flex-col items-center gap-4 p-8" role="alert">
      <h2 className="text-lg font-semibold">{t("routeError.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("routeError.body")}</p>
      <div className="flex gap-2">
        <button
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={onRetry}
        >
          {t("routeError.retry")}
        </button>
        <Link
          href="/daily"
          className="rounded border border-edge px-4 py-2 text-sm"
        >
          {t("routeError.goToDaily")}
        </Link>
      </div>
    </div>
  );
}
