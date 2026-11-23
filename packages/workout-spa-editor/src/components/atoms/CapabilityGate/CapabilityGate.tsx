import type { ReactNode } from "react";

import { useCapabilities } from "../../../contexts/capabilities-context";
import type { InScreenSurfaceId } from "../../../lib/capabilities/capability-catalogue";

export type CapabilityGateProps = {
  /** A part of this screen a Capability owns (`owns.inScreen`). */
  surface: InScreenSurfaceId;
  children: ReactNode;
};

/** Renders a Capability's part of another screen only while it is on. */
export function CapabilityGate({ surface, children }: CapabilityGateProps) {
  return useCapabilities().offers("inScreen", surface) ? <>{children}</> : null;
}
