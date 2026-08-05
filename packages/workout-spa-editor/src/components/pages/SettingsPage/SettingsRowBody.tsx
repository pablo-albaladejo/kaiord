import { useTranslate } from "../../../i18n/use-translate";
import { AttentionMark } from "../../atoms/AttentionMark";
import { Icon, ICON_MAP, type IconName } from "../../atoms/Icon";

export type SettingsRowBodyProps = {
  icon: IconName;
  label: string;
  detail?: string;
  status?: "attention";
  rowTestId: string;
  chevron: boolean;
};

const TILE_CLASS =
  "flex h-7 w-7 items-center justify-center rounded-md bg-primary-600 text-white";

/* The row's marker is the same mark the banner uses, not an amber dot: the
   palette has no warning hue, and the `sr-only` label carries the meaning. */

export const SettingsRowBody = ({
  icon,
  label,
  detail,
  status,
  rowTestId,
  chevron,
}: SettingsRowBodyProps) => {
  const t = useTranslate("settings");

  return (
    <>
      <span className={TILE_CLASS}>
        <Icon icon={ICON_MAP[icon]} size="sm" color="inherit" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-ink-strong">
        {label}
      </span>
      {detail !== undefined && (
        <span className="truncate text-sm text-ink-muted">{detail}</span>
      )}
      {status === "attention" && (
        <>
          <AttentionMark data-testid={`${rowTestId}-attention`} />
          <span className="sr-only">{t("rowStatus.attention")}</span>
        </>
      )}
      {chevron && <Icon icon={ICON_MAP.chevR} size="sm" color="muted" />}
    </>
  );
};
