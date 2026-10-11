/**
 * Editor Loading / No-Data States
 *
 * Early-return UI for loading, unknown-id and no-KRD scenarios.
 */

import { Link } from "wouter";

import { useTranslate } from "../../i18n/use-translate";

export function EditorLoading() {
  const t = useTranslate("editor");
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      {t("loading.loadingWorkout")}
    </div>
  );
}

export function EditorNoData() {
  const t = useTranslate("editor");
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted-foreground">{t("loading.noStructuredData")}</p>
      <Link href="/daily" className="text-primary underline mt-2">
        {t("loading.goToDaily")}
      </Link>
    </div>
  );
}

/** The route id matches no workout (deleted, or a stale link). */
export function EditorNotFound() {
  const t = useTranslate("editor");
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      data-testid="editor-not-found"
    >
      <h1 className="text-lg font-semibold text-ink-strong">
        {t("notFound.title")}
      </h1>
      <p className="text-muted-foreground">{t("notFound.body")}</p>
      <Link href="/calendar" className="text-primary underline mt-2">
        {t("notFound.backToCalendar")}
      </Link>
    </div>
  );
}
