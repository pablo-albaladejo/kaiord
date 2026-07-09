import { useSourcePolicies } from "../../../hooks/data-hub/use-source-policies";
import { useSourcePolicyEditor } from "../../../hooks/data-hub/use-source-policy-editor";
import { useTranslate } from "../../../i18n/use-translate";
import { SourcePriorityRow } from "./SourcePriorityRow";

type Props = { profileId: string };

export const DataHubSourcePriority: React.FC<Props> = ({ profileId }) => {
  const t = useTranslate("data-hub");
  const rows = useSourcePolicies(profileId);
  const { setMode, move } = useSourcePolicyEditor(profileId);
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="data-hub-source-priority">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("sourcePriority.title")}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("sourcePriority.description")}
        </p>
      </div>
      {rows.map((row) => (
        <SourcePriorityRow
          key={row.dataType}
          row={row}
          onMode={setMode}
          onMove={move}
        />
      ))}
    </section>
  );
};
