import { Icon, ICON_MAP, type IconName } from "../../atoms/Icon";

export type CreateStartFromProps = {
  onTemplate: () => void;
  onBlank: () => void;
  onImport: () => void;
};

type Tile = { key: string; label: string; icon: IconName; onClick: () => void };

const TILE_CLASS =
  "flex flex-1 flex-col items-center gap-2 rounded-[14px] border border-slate-800 bg-surface-deep px-3 py-4 text-slate-300 transition-colors hover:border-slate-600";

export function CreateStartFrom({
  onTemplate,
  onBlank,
  onImport,
}: CreateStartFromProps) {
  const tiles: Tile[] = [
    { key: "template", label: "Template", icon: "cards", onClick: onTemplate },
    { key: "blank", label: "Blank", icon: "plus", onClick: onBlank },
    { key: "import", label: "Import file", icon: "upload", onClick: onImport },
  ];

  return (
    <div>
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-800" />
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          or start from
        </span>
        <span className="h-px flex-1 bg-slate-800" />
      </div>
      <div className="flex gap-2">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            onClick={tile.onClick}
            className={TILE_CLASS}
          >
            <Icon icon={ICON_MAP[tile.icon]} size="md" color="inherit" />
            <span className="text-[12.5px] font-semibold">{tile.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
