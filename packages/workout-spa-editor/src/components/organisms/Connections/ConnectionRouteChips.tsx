import type { ConnectionSource } from "../../../application/connections/connection-source";
import { useTranslate } from "../../../i18n/use-translate";
import { Pill } from "../../atoms/Pill";

type Props = { source: ConnectionSource };

/**
 * Counts come from the announced capability token narrowed to the routes the
 * SPA actually serves, so a bridge that advertises a capability Kaiord never
 * calls contributes nothing. An undiscovered extension has announced nothing,
 * so it gets no chips rather than a guess.
 */
export function ConnectionRouteChips({ source }: Props) {
  const t = useTranslate("connections");
  const chips: { key: string; label: string; icon: "arrowDown" | "arrowUp" }[] =
    [];

  if (source.importTypes.length > 0) {
    chips.push({
      key: "in",
      icon: "arrowDown",
      label:
        source.importTypes.length === 1
          ? t("chips.inOne")
          : t("chips.inMany", { count: source.importTypes.length }),
    });
  }
  if (source.exportTypes.length > 0) {
    chips.push({
      key: "out",
      icon: "arrowUp",
      label:
        source.exportTypes.length === 1
          ? t("chips.outOne")
          : t("chips.outMany", { count: source.exportTypes.length }),
    });
  }
  if (chips.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-1.5"
      data-testid={`connection-chips-${source.id}`}
    >
      {chips.map((chip) => (
        <Pill key={chip.key} tone="neutral" icon={chip.icon}>
          {chip.label}
        </Pill>
      ))}
    </div>
  );
}
