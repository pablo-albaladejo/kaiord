/**
 * Trends folded into a link.
 *
 * It carried no data of its own — a title, a subtitle and a chevron in a card
 * the same weight as the cards that do carry data. As a row it still reaches
 * `/health` and stops competing with them.
 */
import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export function TrendsCard() {
  const t = useTranslate("daily");
  return (
    <Link
      href="/health"
      data-testid="daily-trends-card"
      className="flex items-center gap-2 rounded-lg px-1 py-1 text-[13px] font-medium text-ink-body motion-safe:transition-colors hover:text-ink-strong"
    >
      <Icon icon={ICON_MAP.trend} size="sm" color="inherit" />
      <span className="underline underline-offset-2">{t("trends.title")}</span>
      <Icon icon={ICON_MAP.chevR} size="xs" color="inherit" />
    </Link>
  );
}
