import type { ReactNode } from "react";

import { useCapabilities } from "../../../contexts/capabilities-context";

export type CapabilityGateProps = {
  id: string;
  children: ReactNode;
};

/** Renders a Capability's surface inside another screen only while it is on. */
export function CapabilityGate({ id, children }: CapabilityGateProps) {
  return useCapabilities().isOn(id) ? <>{children}</> : null;
}
