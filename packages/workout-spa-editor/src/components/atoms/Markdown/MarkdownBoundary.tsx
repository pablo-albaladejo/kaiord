import { Component, type ReactNode } from "react";

type Props = { source: string; children: ReactNode };
type State = { failed: boolean; source: string };

/** Last line of defence for one message: if rendering its markdown throws, the
 * message falls back to plain text instead of taking the chat (and, with only
 * the app-level boundary above, the whole app) down every time it is shown.
 * A new source (the next streamed delta) gets a fresh attempt. */
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

  render() {
    return this.state.failed ? (
      <p className="whitespace-pre-wrap">{this.props.source}</p>
    ) : (
      this.props.children
    );
  }
}
