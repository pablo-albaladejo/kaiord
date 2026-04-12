/**
 * RouteErrorBoundary - Catches render errors in route components.
 *
 * Shows error details with retry and navigation escape hatch.
 */
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

import { RouteErrorFallback } from "./RouteErrorFallback";

type Props = { children: ReactNode };
type State = { error: Error | null; retryCount: number };

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
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
