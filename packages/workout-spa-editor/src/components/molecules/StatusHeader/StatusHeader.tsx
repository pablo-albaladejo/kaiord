import { useTranslate } from "../../../i18n/use-translate";
import { ThemeToggle } from "../../atoms/ThemeToggle";
import { StatusEntryButtons } from "./StatusEntryButtons";

export function StatusHeader() {
  const t = useTranslate("common");
  return (
    <nav
      aria-label={t("a11y.mainNavigation")}
      className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1.5 text-sm md:gap-x-3 md:gap-y-2 lg:justify-end"
      data-testid="status-header"
    >
      <StatusEntryButtons />
      <ThemeToggle />
    </nav>
  );
}
