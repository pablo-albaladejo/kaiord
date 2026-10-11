/**
 * ZoneMethodSelect Component
 *
 * Dropdown to select a zone calculation method.
 */

import { useTranslate } from "../../../../i18n/use-translate";
import { getMethodsForType } from "../../../../lib/zone-methods";
import { zoneMethodLabel } from "../../../../lib/zone-name-label";

type ZoneMethodSelectProps = {
  type: "power" | "hr" | "pace";
  value: string;
  onChange: (method: string) => void;
};

export function ZoneMethodSelect({
  type,
  value,
  onChange,
}: ZoneMethodSelectProps) {
  const t = useTranslate("zones");
  const methods = getMethodsForType(type);
  // A table merged from a coach or edited by hand has no preset; it still
  // gets an option, or the select would claim the first preset applies.
  const isOwn = !methods.some((m) => m.id === value);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={t("method.ariaLabel", { type })}
      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
    >
      {isOwn && <option value={value}>{zoneMethodLabel(value, t)}</option>}
      {methods.map((m) => (
        <option key={m.id} value={m.id}>
          {zoneMethodLabel(m.id, t)}
        </option>
      ))}
    </select>
  );
}
