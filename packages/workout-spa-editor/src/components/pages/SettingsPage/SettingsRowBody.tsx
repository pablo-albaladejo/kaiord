import { useTranslate } from "../../../i18n/use-translate";
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

const DOT_CLASS = "h-2 w-2 flex-none rounded-full bg-amber-500";

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
      <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-white">
        {label}
      </span>
      {detail !== undefined && (
        <span className="truncate text-sm text-gray-500 dark:text-gray-400">
          {detail}
        </span>
      )}
      {status === "attention" && (
        <>
          <span
            aria-hidden="true"
            className={DOT_CLASS}
            data-testid={`${rowTestId}-attention`}
          />
          <span className="sr-only">{t("rowStatus.attention")}</span>
        </>
      )}
      {chevron && <Icon icon={ICON_MAP.chevR} size="sm" color="muted" />}
    </>
  );
};
