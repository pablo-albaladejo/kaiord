import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { capabilityHome } from "../../../lib/capabilities/capability-catalogue";
import { CapabilityGate } from "../../atoms/CapabilityGate/CapabilityGate";

/** Where an athlete who turned the matrix on chooses which Platform decides. */
export function AuthorityMatrixLink() {
  const t = useTranslate("connections");
  return (
    <CapabilityGate surface="connections-authority-link">
      <p className="text-[12.5px] text-ink-muted">
        <Link
          href={capabilityHome("authority-matrix")}
          data-testid="authority-matrix-link"
          className="underline underline-offset-2 hover:text-ink-body"
        >
          {t("authorityMatrixLink")}
        </Link>
      </p>
    </CapabilityGate>
  );
}
