export type BridgeState = "connected" | "no-session" | "not-detected";

type BridgeStatusRowProps = {
  name: string;
  state: BridgeState;
  hint: string;
};

const DOT_CLASSES: Record<BridgeState, string> = {
  connected: "bg-green-500",
  "no-session": "bg-yellow-500",
  "not-detected": "bg-gray-300 dark:bg-gray-600",
};

const LABEL: Record<BridgeState, string> = {
  connected: "Connected",
  "no-session": "Session inactive",
  "not-detected": "Not detected",
};

export const BridgeStatusRow: React.FC<BridgeStatusRowProps> = ({
  name,
  state,
  hint,
}) => (
  <tr className="group">
    <td className="py-2 pr-4 text-sm font-medium text-gray-700 dark:text-gray-300">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${DOT_CLASSES[state]}`}
          aria-label={LABEL[state]}
        />
        {name}
      </div>
    </td>
    <td className="py-2 text-sm text-gray-500 dark:text-gray-400">
      {LABEL[state]}
      {state !== "connected" && (
        <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
          — {hint}
        </span>
      )}
    </td>
  </tr>
);
