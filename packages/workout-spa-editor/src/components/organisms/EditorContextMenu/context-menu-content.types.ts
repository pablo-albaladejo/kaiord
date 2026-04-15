export type ContextMenuContentProps = {
  showCut: boolean;
  showCopy: boolean;
  showPaste: boolean;
  showDelete: boolean;
  showSelectAll: boolean;
  showGroup: boolean;
  showUngroup: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
  onGroup: () => void;
  onUngroup: () => void;
};
