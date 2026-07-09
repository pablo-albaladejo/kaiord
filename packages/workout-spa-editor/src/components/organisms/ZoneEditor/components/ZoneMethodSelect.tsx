/**
 * ZoneMethodSelect Component
 *
 * Dropdown to select a zone calculation method.
 */

import { useTranslate } from "../../../../i18n/use-translate";
import { getMethodsForType } from "../../../../lib/zone-methods";

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

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={t("method.ariaLabel", { type })}
      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
    >
      {methods.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
