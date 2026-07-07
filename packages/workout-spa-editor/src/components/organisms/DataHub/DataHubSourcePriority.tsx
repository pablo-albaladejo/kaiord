import { useSourcePolicies } from "../../../hooks/data-hub/use-source-policies";
import { useSourcePolicyEditor } from "../../../hooks/data-hub/use-source-policy-editor";
import { SourcePriorityRow } from "./SourcePriorityRow";

type Props = { profileId: string };

export const DataHubSourcePriority: React.FC<Props> = ({ profileId }) => {
  const rows = useSourcePolicies(profileId);
  const { setMode, move } = useSourcePolicyEditor(profileId);
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3" data-testid="data-hub-source-priority">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Multiple sources
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          When more than one integration imports the same data, keep them all
          (union) or rank a winner (priority).
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
