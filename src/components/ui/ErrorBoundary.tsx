import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Catches render crashes so a broken subtree shows a recover screen, not a
 * blank window. Recovery is a full reload — cheapest reliable reset. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Markd crashed:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 bg-bg px-8 text-center">
        <div className="max-w-md">
          <p className="text-[16px] font-semibold tracking-[-0.01em] text-ink">
            Something went wrong
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Markd hit an unexpected error. Your notes are safe on disk — reloading
            usually fixes it.
          </p>
          {this.state.error.message && (
            <p className="mt-3 truncate rounded-md border border-line-soft bg-panel px-3 py-2 font-mono text-[11.5px] text-faint">
              {this.state.error.message}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-9 items-center rounded-md bg-invert px-4 text-[13px] font-medium text-invert-ink transition-opacity hover:opacity-90"
        >
          Reload
        </button>
      </div>
    );
  }
}
