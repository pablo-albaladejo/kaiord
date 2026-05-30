import { useAiProvidersLive } from "../../../hooks/use-ai-providers-live";
import { SectionHead } from "../../molecules/SectionHead/SectionHead";
import {
  SETTINGS_GROUPS,
  SETTINGS_VERSION_LABEL,
  type SettingsRowDef,
} from "./settings-groups";
import { SettingsRow } from "./SettingsRow";

type SettingsGroupListProps = {
  onNavigate: (to: string) => void;
};

const useRowDetail = () => {
  const providers = useAiProvidersLive() ?? [];
  const defaultProvider =
    providers.find((p) => p.isDefault)?.label ?? providers[0]?.label;

  return (row: SettingsRowDef): string | undefined =>
    row.detailKey === "defaultProvider" ? defaultProvider : undefined;
};

export const SettingsGroupList = ({ onNavigate }: SettingsGroupListProps) => {
  const detailFor = useRowDetail();

  return (
    <div className="space-y-6" data-testid="settings-group-list">
      {SETTINGS_GROUPS.map((group) => (
        <section key={group.eyebrow}>
          <SectionHead title={group.eyebrow} />
          <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900 [&>*+*]:border-t [&>*+*]:border-gray-100 dark:[&>*+*]:border-slate-800">
            {group.rows.map((row) => (
              <SettingsRow
                key={row.label}
                icon={row.icon}
                label={row.label}
                detail={detailFor(row)}
                to={row.to}
                onNavigate={row.to !== undefined ? onNavigate : undefined}
              />
            ))}
          </div>
        </section>
      ))}
      <p className="px-4 text-center text-xs text-gray-400 dark:text-gray-600">
        {SETTINGS_VERSION_LABEL}
      </p>
    </div>
  );
};
