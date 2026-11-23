import {
  buildDataFlowInventory,
  type InventoryDestination,
} from "../../../application/data-flows/build-inventory";
import {
  type DestinationId,
  DESTINATIONS,
} from "../../../application/data-flows/destinations";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import { listKinds } from "../HealthSharingNotice/health-notice-copy";
import { ProviderHealthChoice } from "./ProviderHealthChoice";

const DestinationRow = ({ dest }: { dest: InventoryDestination }) => {
  const t = useTranslate("dataFlows");
  const locale = useActiveLocale();
  const destination = DESTINATIONS[dest.id];
  return (
    <li
      className="rounded-lg border border-edge p-3"
      data-destination={dest.id}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-ink-strong">{dest.name}</span>
        <span className="text-xs text-ink-muted">
          {t(dest.active ? "inventory.active" : "inventory.notSetUp")}
        </span>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-ink-body">
        {dest.flows.map((flow) => (
          <li key={flow.id}>
            <span className="text-ink-strong">{t(`flows.${flow.id}`)}</span>
            {": "}
            {listKinds(flow.kinds, t, locale)}
          </li>
        ))}
      </ul>
      {destination.group === "provider" && (
        <ProviderHealthChoice
          providerType={destination.providerType}
          providerName={dest.name}
        />
      )}
    </li>
  );
};

/**
 * Where the athlete's data can go, read from the flow registry: every
 * destination, what each flow sends there and when, and whether it is set up.
 */
export const DataFlowInventory = (props: {
  active: (id: DestinationId) => boolean;
}) => {
  const t = useTranslate("dataFlows");
  return (
    <section data-testid="data-flow-inventory">
      <h3 className="mb-1 text-sm font-semibold text-ink-body">
        {t("inventory.title")}
      </h3>
      <p className="mb-3 text-sm text-ink-body">{t("inventory.intro")}</p>
      {buildDataFlowInventory(props.active).map((group) => (
        <div key={group.group} className="mb-4">
          <h4 className="mb-2 text-xs font-semibold uppercase text-ink-muted">
            {t(`groups.${group.group}`)}
          </h4>
          <ul className="space-y-2">
            {group.destinations.map((dest) => (
              <DestinationRow key={dest.id} dest={dest} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};
