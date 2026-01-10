import React, { Component, ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  section: 'sidebar' | 'editor' | 'notes-grid' | 'command-palette' | 'settings';
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * SectionErrorBoundary - Wraps specific sections of the app with error boundaries
 * This prevents errors in one section from crashing the entire application
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[${this.props.section}] Error caught:`, error, errorInfo);

    // Show toast notification
    toast.error(`Error in ${this.getSectionName()}`, {
      description: error.message || 'An unexpected error occurred',
      action: {
        label: 'Reload',
        onClick: () => this.handleReset(),
      },
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  getSectionName(): string {
    switch (this.props.section) {
      case 'sidebar':
        return 'Sidebar';
      case 'editor':
        return 'Editor';
      case 'notes-grid':
        return 'Notes Grid';
      case 'command-palette':
        return 'Command Palette';
      case 'settings':
        return 'Settings';
      default:
        return 'this section';
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="max-w-md text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {this.getSectionName()} Error
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || 'Something went wrong in this section'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
