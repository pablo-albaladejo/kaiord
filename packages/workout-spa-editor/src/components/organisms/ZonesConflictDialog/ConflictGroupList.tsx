/**
 * `ConflictGroupList` — renders the band groups + coupled FTP group
 * inside the conflict dialog. Extracted so `ZonesConflictDialog` stays
 * under the 60-line React component cap.
 */
import { useTranslate } from "../../../i18n/use-translate";
import type {
  ConflictDecision,
  ConflictItem,
} from "../../../types/coaching-zones";
import { ConflictGroup } from "./ConflictGroup";
import type { BandGroup, CoupledFtpGroup } from "./group-conflicts";

export type ConflictGroupListProps = {
  bandGroups: BandGroup[];
  ftpCoupled: CoupledFtpGroup | undefined;
  groupDecisions: Record<string, ConflictDecision>;
  expanded: Set<string>;
  onSetGroup: (groupKey: string, d: ConflictDecision) => void;
  onToggleExpand: (groupKey: string) => void;
};

const flattenCoupledConflicts = (coupled: CoupledFtpGroup): ConflictItem[] => [
  coupled.ftpConflict,
  ...coupled.powerBandConflicts,
];

export const ConflictGroupList = ({
  bandGroups,
  ftpCoupled,
  groupDecisions,
  expanded,
  onSetGroup,
  onToggleExpand,
}: ConflictGroupListProps) => {
  const t = useTranslate("zones");
  const bandLabel = (g: BandGroup) =>
    t("conflict.group", {
      sport: t(`conflict.sport.${g.sport}`),
      kind: t(`conflict.kind.${g.kind}`),
    });
  return (
    <>
      {ftpCoupled && (
        <ConflictGroup
          groupKey={ftpCoupled.groupKey}
          label={t("conflict.ftpGroup")}
          conflicts={flattenCoupledConflicts(ftpCoupled)}
          decision={groupDecisions[ftpCoupled.groupKey] ?? "reject"}
          expanded={expanded.has(ftpCoupled.groupKey)}
          onChange={(d) => onSetGroup(ftpCoupled.groupKey, d)}
          onToggleExpand={() => onToggleExpand(ftpCoupled.groupKey)}
        />
      )}
      {bandGroups.map((g) => (
        <ConflictGroup
          key={g.groupKey}
          groupKey={g.groupKey}
          label={bandLabel(g)}
          conflicts={g.conflicts}
          decision={groupDecisions[g.groupKey] ?? "reject"}
          expanded={expanded.has(g.groupKey)}
          onChange={(d) => onSetGroup(g.groupKey, d)}
          onToggleExpand={() => onToggleExpand(g.groupKey)}
        />
      ))}
    </>
  );
};
