import { useTranslate } from "../../../i18n/use-translate";
import { SectionHead } from "../../molecules/SectionHead/SectionHead";
import { SETTINGS_GROUPS, SETTINGS_VERSION_LABEL } from "./settings-groups";
import { SettingsRow } from "./SettingsRow";
import { useSettingsRowValues } from "./use-settings-row-values";

/**
 * `"index"` is the standalone list: every row answers itself with its live
 * value. `"sidebar"` is the desktop split's section rail, where the open
 * section's own panel is the one place a value is rendered — repeating it
 * on the rail would state the same fact twice on one screen.
 */
export type SettingsGroupListVariant = "index" | "sidebar";

type SettingsGroupListProps = {
  onNavigate: (to: string) => void;
  variant?: SettingsGroupListVariant;
  /** Pathname of the open section; rows leading to it render as current. */
  activePath?: string;
};

const GROUP_CLASS =
  "overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900 [&>*+*]:border-t [&>*+*]:border-gray-100 dark:[&>*+*]:border-slate-800";

/** A row destination may carry a `?section=` deep link; the path identifies it. */
const pathOf = (to: string): string => to.split("?")[0] ?? to;

export const SettingsGroupList = ({
  onNavigate,
  variant = "index",
  activePath,
}: SettingsGroupListProps) => {
  const values = useSettingsRowValues();
  const t = useTranslate("settings");
  const isIndex = variant === "index";

  return (
    <div className="space-y-6" data-testid="settings-group-list">
      {SETTINGS_GROUPS.map((group) => (
        <section key={group.key}>
          <SectionHead title={t(`groups.${group.key}`)} />
          <div className={GROUP_CLASS}>
            {group.rows.map((row) => (
              <SettingsRow
                key={row.key}
                icon={row.icon}
                label={t(`rows.${row.key}`)}
                testId={row.key}
                detail={
                  !isIndex || row.valueKey === undefined
                    ? undefined
                    : values[row.valueKey]
                }
                active={
                  activePath !== undefined &&
                  row.to !== undefined &&
                  pathOf(row.to) === activePath
                }
                to={row.to}
                href={row.href}
                onNavigate={row.to !== undefined ? onNavigate : undefined}
              />
            ))}
          </div>
        </section>
      ))}
      {isIndex && (
        <p className="px-4 text-center text-xs text-gray-400 dark:text-gray-600">
          {SETTINGS_VERSION_LABEL}
        </p>
      )}
    </div>
  );
};
