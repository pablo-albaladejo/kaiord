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
  /** Runs in place instead of navigating; mutually exclusive with `to`/`href`. */
  onActivate?: () => void;
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
  onActivate,
}: SettingsRowProps) => {
  const navigable = to !== undefined && onNavigate !== undefined;
  // One click handler for both interactive shapes: a destination row hands the
  // route to the router, an action row runs in place. Neither → an inert div.
  const activate =
    to !== undefined && onNavigate !== undefined
      ? () => onNavigate(to)
      : onActivate;
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

  if (activate === undefined) {
    return (
      <div className={BASE_CLASS} data-testid={rowTestId}>
        {body}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={activate}
      className={LINK_CLASS}
      data-testid={rowTestId}
    >
      {body}
    </button>
  );
};
