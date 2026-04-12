/**
 * RouteErrorFallback - UI shown when a route component crashes.
 */
import { useLocation } from "wouter";

type RouteErrorFallbackProps = {
  error: Error;
  onRetry: () => void;
};

export function RouteErrorFallback({
  error,
  onRetry,
}: RouteErrorFallbackProps) {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col items-center gap-4 p-8" role="alert">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <div className="flex gap-2">
        <button
          className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={onRetry}
        >
          Retry
        </button>
        <button
          className="rounded border px-4 py-2 text-sm"
          onClick={() => navigate("/calendar")}
        >
          Go to Calendar
        </button>
      </div>
    </div>
  );
}
