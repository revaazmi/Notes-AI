"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-md p-hero text-center">
          <h2 className="typography-heading-3 text-charcoal">Something went wrong</h2>
          <p className="text-body-md text-slate max-w-md">{this.state.error?.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = "/";
            }}
            className="rounded-md bg-primary px-lg py-sm text-button-md text-on-dark transition-colors hover:bg-primary-pressed"
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
