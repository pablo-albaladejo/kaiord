import type { ReactNode } from "react";
import { Component } from "react";

import { logger } from "../../utils/logger";

type Props = { name: string; children: ReactNode };
type State = { failed: boolean };

/**
 * Boundary for an app-wide lazy seam that has no UI of its own to fall back
 * to (keyboard shortcuts, a dialog that is not open): if its chunk fails to
 * load, the seam renders nothing and the app around it stays mounted.
 */
export class SilentErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    logger.warn("Lazy seam failed to load", { seam: this.props.name, error });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
