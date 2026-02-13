import React from 'react';

class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[${this.props.name || 'Tab'}] Error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-red-600 mb-2">
            {this.props.name || 'Component'} Error
          </h3>
          <p className="text-sm text-neutral-600 mb-4 max-w-md">
            Something went wrong in this section. The rest of the app is still functional.
          </p>
          <pre className="text-xs text-neutral-400 bg-neutral-50 border border-neutral-200 p-3 max-w-lg overflow-auto">
            {this.state.error?.message}
          </pre>
          <button
            className="mt-4 font-mono text-xs uppercase tracking-widest px-4 py-2 border border-neutral-300 hover:border-neutral-900 transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default TabErrorBoundary;
