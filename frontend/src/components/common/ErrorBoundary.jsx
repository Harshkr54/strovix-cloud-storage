import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Storvix UI ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] w-full rounded-xl border border-[#e5e7eb] bg-white shadow-xs dark:border-[#253044] dark:bg-[#111827]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#dc2626] dark:bg-red-950/60 dark:text-red-400 mb-3">
            ⚠️
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#111827] dark:text-[#f9fafb]">
            Something went wrong loading this view
          </h2>
          <p className="mt-1 max-w-md text-xs text-[#6b7280] dark:text-[#9ca3af]">
            {this.state.error?.message || 'An unexpected rendering error occurred. Please reload to try again.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-[#3157d5] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#2649bd] transition cursor-pointer"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
