/**
 * Editor Loading / No-Data States
 *
 * Early-return UI for loading and no-KRD scenarios.
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
