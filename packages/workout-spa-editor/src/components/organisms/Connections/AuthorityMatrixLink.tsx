import { Link } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { CapabilityGate } from "../../atoms/CapabilityGate/CapabilityGate";

/** Where an athlete who turned the matrix on chooses which Platform decides. */
export function AuthorityMatrixLink() {
  const t = useTranslate("connections");
  return (
    <CapabilityGate id="authority-matrix">
      <p className="text-[12.5px] text-ink-muted">
        <Link
          href="/settings/authority"
          data-testid="authority-matrix-link"
          className="underline underline-offset-2 hover:text-ink-body"
        >
          {t("routing.chooseAuthority")}
        </Link>
      </p>
    </CapabilityGate>
  );
}
