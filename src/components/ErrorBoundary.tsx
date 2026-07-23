import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 min-h-[40vh]">
          <h1 className="text-2xl font-bold text-[#171717] mb-4">Something went wrong</h1>
          <p className="text-sm text-[#666] mb-6">We encountered an unexpected error. Please try again.</p>
          <button
            onClick={this.handleReset}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-[#333] transition"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
