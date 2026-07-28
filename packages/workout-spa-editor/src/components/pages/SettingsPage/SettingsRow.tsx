import type { IconName } from "../../atoms/Icon";
import { SettingsRowBody } from "./SettingsRowBody";

export type SettingsRowProps = {
  icon: IconName;
  label: string;
  /** Locale-independent testid suffix; falls back to the label. */
  testId?: string;
  detail?: string;
  /** `"attention"` marks the row with an amber dot before the chevron. */
  status?: "attention";
  to?: string;
  /** External destination opened in a new tab; mutually exclusive with `to`. */
  href?: string;
  onNavigate?: (to: string) => void;
};

const BASE_CLASS =
  "flex w-full items-center gap-3 px-4 py-3 text-left first:rounded-t-xl last:rounded-b-xl";

const LINK_CLASS = `${BASE_CLASS} transition-colors hover:bg-gray-50 dark:hover:bg-slate-800`;

export const SettingsRow = ({
  icon,
  label,
  testId,
  detail,
  status,
  to,
  href,
  onNavigate,
}: SettingsRowProps) => {
  const navigable = to !== undefined && onNavigate !== undefined;
  const rowTestId = `settings-row-${testId ?? label}`;
  const body = (
    <SettingsRowBody
      icon={icon}
      label={label}
      detail={detail}
      status={status}
      rowTestId={rowTestId}
      chevron={navigable || href !== undefined}
    />
  );

  if (href !== undefined) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASS}
        data-testid={rowTestId}
      >
        {body}
      </a>
    );
  }

  if (!navigable) {
    return (
      <div className={BASE_CLASS} data-testid={rowTestId}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onNavigate(to)}
      className={LINK_CLASS}
      data-testid={rowTestId}
    >
      {body}
    </button>
  );
};
