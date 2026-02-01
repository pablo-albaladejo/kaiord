/**
 * ShortcutRow Component
 *
 * Displays a keyboard shortcut with description.
 */

type ShortcutRowProps = {
  icon: React.ReactNode;
  keys: Array<string>;
  macKeys?: Array<string>;
  description: string;
};

export function ShortcutRow({
  icon,
  keys,
  macKeys,
  description,
}: ShortcutRowProps) {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");
  const displayKeys = isMac && macKeys ? macKeys : keys;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        {icon}
        <span>{description}</span>
      </div>
      <div className="flex gap-1">
        {displayKeys.map((key, index) => (
          <kbd
            key={index}
            className="rounded border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
