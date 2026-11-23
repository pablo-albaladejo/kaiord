import { useCapabilities } from "../../../contexts/capabilities-context";
import { useTranslate } from "../../../i18n/use-translate";
import type { CapabilityDeclaration } from "../../../lib/capabilities/capability-catalogue";
import { CAPABILITY_CATALOGUE } from "../../../lib/capabilities/capability-catalogue";
import { logger } from "../../../utils/logger";
import { Toggle } from "../../atoms/Toggle";

const CATALOGUE: readonly CapabilityDeclaration[] = CAPABILITY_CATALOGUE;

/**
 * The one place a Capability is turned on or off. A switch is its own undo:
 * turning one off hides its surfaces and keeps its data, so nothing here
 * asks first.
 */
export const CapabilitiesTab = () => {
  const t = useTranslate("settings");
  const capabilities = useCapabilities();
  const ready = capabilities.status === "ready";

  const change = (id: string, on: boolean) => {
    void capabilities.set(id, on).catch((error: unknown) => {
      logger.warn("Failed to record a Capability decision", { error });
    });
  };

  return (
    <div className="space-y-4" data-testid="settings-capabilities">
      <p className="text-sm text-ink-body">{t("capabilities.intro")}</p>
      <ul className="space-y-3">
        {CATALOGUE.map((capability) => {
          const name = t(`capabilities.items.${capability.id}.name`);
          return (
            <li
              key={capability.id}
              className="flex items-start justify-between gap-4"
              data-testid={`capability-${capability.id}`}
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-ink-strong">
                  {name}
                  {capability.grade && (
                    <span className="ml-2 text-xs font-normal text-ink-muted">
                      {t(`capabilities.grade.${capability.grade}`)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-muted">
                  {t(`capabilities.items.${capability.id}.hint`)}
                </p>
              </div>
              <Toggle
                checked={capabilities.isOn(capability.id)}
                onCheckedChange={(on) => change(capability.id, on)}
                aria-label={name}
                disabled={!ready}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
