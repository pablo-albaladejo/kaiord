import { Component, type ReactNode } from "react";

import { logger } from "../../../utils/logger";

type Props = { source: string; children: ReactNode };
type State = { failed: boolean; source: string };

/** Last line of defence for one message: if rendering its markdown throws, the
 * message falls back to plain text instead of taking the chat (and, with only
 * the app-level boundary above, the whole app) down every time it is shown.
 * A new source (the next streamed delta) gets a fresh attempt; a message that
 * keeps failing on every delta is reported once, not once per delta. */
export class MarkdownBoundary extends Component<Props, State> {
  state: State = { failed: false, source: this.props.source };

  static getDerivedStateFromProps(props: Props, state: State) {
    return props.source === state.source
      ? null
      : { failed: false, source: props.source };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  private reported = false;

  componentDidCatch(error: Error) {
    if (this.reported) return;
    this.reported = true;
    logger.error("Chat markdown failed to render; showing plain text", {
      error,
      length: this.props.source.length,
    });
  }

  render() {
    return this.state.failed ? (
      <p className="whitespace-pre-wrap">{this.props.source}</p>
    ) : (
      this.props.children
    );
  }
}
