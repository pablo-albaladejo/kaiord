import { Icon, ICON_MAP, type IconName } from "../../atoms/Icon";

export type SettingsRowProps = {
  icon: IconName;
  label: string;
  detail?: string;
  to?: string;
  onNavigate?: (to: string) => void;
};

const TILE_CLASS =
  "flex h-7 w-7 items-center justify-center rounded-md bg-primary-600 text-white";

export const SettingsRow = ({
  icon,
  label,
  detail,
  to,
  onNavigate,
}: SettingsRowProps) => {
  const interactive = to !== undefined && onNavigate !== undefined;

  const body = (
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
      {interactive && <Icon icon={ICON_MAP.chevR} size="sm" color="muted" />}
    </>
  );

  const base =
    "flex w-full items-center gap-3 px-4 py-3 text-left first:rounded-t-xl last:rounded-b-xl";

  if (!interactive) {
    return (
      <div className={base} data-testid={`settings-row-${label}`}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onNavigate(to)}
      className={`${base} transition-colors hover:bg-gray-50 dark:hover:bg-slate-800`}
      data-testid={`settings-row-${label}`}
    >
      {body}
    </button>
  );
};
