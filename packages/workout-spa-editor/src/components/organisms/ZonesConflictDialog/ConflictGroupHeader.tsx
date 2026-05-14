export type ConflictGroupHeaderProps = {
  label: string;
  bandCount: number;
  expanded: boolean;
  onToggleExpand: () => void;
};

const summary = (count: number): string =>
  count === 1 ? "1 band differs" : `${count} bands differ`;

export const ConflictGroupHeader = ({
  label,
  bandCount,
  expanded,
  onToggleExpand,
}: ConflictGroupHeaderProps) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{summary(bandCount)}</div>
    </div>
    <button
      type="button"
      onClick={onToggleExpand}
      aria-expanded={expanded}
      className="text-xs text-muted-foreground hover:underline"
    >
      {expanded ? "Hide" : "Detail"}
    </button>
  </div>
);
