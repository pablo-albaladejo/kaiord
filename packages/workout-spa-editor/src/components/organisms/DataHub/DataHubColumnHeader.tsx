import { type Translate, useTranslate } from "../../../i18n/use-translate";
import type { IntegrationRegistryEntry } from "../../../integrations/integration-registry";

type Props = {
  integration: IntegrationRegistryEntry;
  connected: boolean;
};

const connectionLabel = (
  integration: IntegrationRegistryEntry,
  connected: boolean,
  t: Translate
): string => {
  if (connected) return t("conn.connected");
  if (integration.mechanism === "not-supported") return t("conn.notSupported");
  if (integration.mechanism === "manual") return t("conn.alwaysOn");
  return t("conn.notConnected");
};

export const DataHubColumnHeader: React.FC<Props> = ({
  integration,
  connected,
}) => {
  const t = useTranslate("data-hub");
  return (
    <th
      scope="col"
      className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
      data-testid={`data-hub-col-${integration.id}`}
    >
      <div className="flex flex-col items-center gap-1">
        <span
          aria-hidden
          className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          {integration.mark}
        </span>
        <span className="whitespace-nowrap">{integration.name}</span>
        <span
          data-testid={`data-hub-conn-${integration.id}`}
          data-connected={connected}
          className={
            connected
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-gray-400 dark:text-gray-600"
          }
        >
          {connectionLabel(integration, connected, t)}
        </span>
      </div>
    </th>
  );
};
