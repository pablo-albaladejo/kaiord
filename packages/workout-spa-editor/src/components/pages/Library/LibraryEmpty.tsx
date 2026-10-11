import { useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type LibraryEmptyProps = {
  isFiltered: boolean;
};

/** An empty library says how to fill it; an empty filter result does not,
    since the library is not empty there. */
export function LibraryEmpty({ isFiltered }: LibraryEmptyProps) {
  const t = useTranslate("library");
  const [, navigate] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
        <Icon icon={ICON_MAP.library} size="lg" color="inherit" />
      </div>
      <h3 className="m-0 text-[16px] font-bold text-ink-strong">
        {isFiltered ? t("empty.filteredTitle") : t("empty.title")}
      </h3>
      <p className="mt-1 text-[13.5px] text-ink-muted">
        {isFiltered ? t("empty.filteredMessage") : t("empty.message")}
      </p>
      {!isFiltered && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={() => navigate("/workout/new")}>
            <Icon icon={ICON_MAP.plus} size="sm" color="inherit" />
            {t("empty.create")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/workout/new?action=import")}
          >
            <Icon icon={ICON_MAP.upload} size="sm" color="inherit" />
            {t("empty.import")}
          </Button>
        </div>
      )}
    </div>
  );
}
