"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? ` ${this.props.label}` : ""}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex h-full items-center justify-center rounded border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400">
          <div className="text-center">
            <p className="font-medium">Something went wrong</p>
            <p className="mt-1 text-xs text-red-500">{this.props.label ?? "Component"}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-2 rounded bg-red-900/40 px-2 py-1 text-xs text-red-300 hover:bg-red-900/60"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
