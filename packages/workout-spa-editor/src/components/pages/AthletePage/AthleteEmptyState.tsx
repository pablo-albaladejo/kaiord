import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { ATHLETES_PATH } from "../../../routing/constants";

/* No active athlete. Athletes are created on the Athletes page; creating
   the first one makes it active, so coming back here shows its body. */
export function AthleteEmptyState() {
  const t = useTranslate("athlete");
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-[15px] text-ink-body">{t("emptyTitle")}</p>
      <Link
        href={ATHLETES_PATH}
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        {t("createAthlete")}
      </Link>
    </div>
  );
}
