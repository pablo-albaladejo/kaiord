import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP, type IconName } from "../../atoms/Icon";

export type CreateStartFromProps = {
  onTemplate: () => void;
  onBlank: () => void;
  onImport: () => void;
};

type Tile = { key: string; label: string; icon: IconName; onClick: () => void };

const TILE_CLASS =
  "flex flex-1 flex-col items-center gap-2 rounded-[14px] border border-edge bg-surface-deep px-3 py-4 text-ink-body transition-colors hover:border-edge-strong";

export function CreateStartFrom({
  onTemplate,
  onBlank,
  onImport,
}: CreateStartFromProps) {
  const t = useTranslate("create-workout");
  const tiles: Tile[] = [
    {
      key: "template",
      label: t("startFrom.template"),
      icon: "cards",
      onClick: onTemplate,
    },
    {
      key: "blank",
      label: t("startFrom.blank"),
      icon: "plus",
      onClick: onBlank,
    },
    {
      key: "import",
      label: t("startFrom.import"),
      icon: "upload",
      onClick: onImport,
    },
  ];

  return (
    <div>
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-edge" />
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {t("startFrom.divider")}
        </span>
        <span className="h-px flex-1 bg-edge" />
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
