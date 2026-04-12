/**
 * RouteErrorBoundary - Catches render errors in route components.
 *
 * Shows error details with retry and navigation escape hatch.
 */
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

import { RouteErrorFallback } from "./RouteErrorFallback";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
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
    return this.props.children;
  }
}
