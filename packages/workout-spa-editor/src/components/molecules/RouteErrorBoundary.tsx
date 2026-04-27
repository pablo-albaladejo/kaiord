/**
 * RouteErrorBoundary - Catches render errors in route components.
 *
 * Shows error details with retry and navigation escape hatch. When an
 * `analytics` prop is provided, the boundary forwards a `route-error`
 * event with the current pathname, allowing render errors to be tracked
 * remotely. The prop is optional so the boundary remains drop-in
 * compatible with callers that do not have access to an Analytics
 * instance.
 */
import type { Analytics } from "@kaiord/core";
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

import { RouteErrorFallback } from "./RouteErrorFallback";

type Props = {
  children: ReactNode;
  analytics?: Analytics;
};
type State = { error: Error | null; retryCount: number };

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.analytics?.event("route-error", {
      route: window.location.pathname,
    });
    console.error("Route error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState((s) => ({ error: null, retryCount: s.retryCount + 1 }));
  };

  render() {
    if (this.state.error) {
      return (
        <RouteErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    return <div key={this.state.retryCount}>{this.props.children}</div>;
  }
}
