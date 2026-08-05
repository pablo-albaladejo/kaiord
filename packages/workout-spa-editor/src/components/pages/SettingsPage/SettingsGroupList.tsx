import { useTranslate } from "../../../i18n/use-translate";
import { SectionHead } from "../../molecules/SectionHead/SectionHead";
import { SETTINGS_GROUPS, SETTINGS_VERSION_LABEL } from "./settings-groups";
import { SettingsRow } from "./SettingsRow";
import { useSettingsRowActions } from "./use-settings-row-actions";
import { useSettingsRowValues } from "./use-settings-row-values";

type SettingsGroupListProps = {
  onNavigate: (to: string) => void;
};

export const SettingsGroupList = ({ onNavigate }: SettingsGroupListProps) => {
  const values = useSettingsRowValues();
  const actions = useSettingsRowActions();
  const t = useTranslate("settings");

  return (
    <div className="space-y-6" data-testid="settings-group-list">
      {SETTINGS_GROUPS.map((group) => (
        <section key={group.key}>
          <SectionHead title={t(`groups.${group.key}`)} />
          <div className="overflow-hidden rounded-2xl bg-surface shadow-sm [&>*+*]:border-t [&>*+*]:border-edge-soft">
            {group.rows.map((row) => (
              <SettingsRow
                key={row.key}
                icon={row.icon}
                label={t(`rows.${row.key}`)}
                testId={row.key}
                detail={
                  row.valueKey === undefined ? undefined : values[row.valueKey]
                }
                to={row.to}
                href={row.href}
                onNavigate={row.to !== undefined ? onNavigate : undefined}
                onActivate={
                  row.action === undefined ? undefined : actions[row.action]
                }
              />
            ))}
          </div>
        </section>
      ))}
      <p className="px-4 text-center text-xs text-ink-muted">
        {SETTINGS_VERSION_LABEL}
      </p>
    </div>
  );
};
