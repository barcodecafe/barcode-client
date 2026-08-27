import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { captureClientException } from '../utils/sentry';

// ---------------------------------------------------------------------------
// ErrorBoundary.jsx
//
// The app had none, so any exception thrown during render unmounted the entire
// React tree and left a blank white page — one malformed record from the API
// (a branch with no `name`, a list arriving as an object instead of an array)
// was enough to take down the whole admin. That is the most likely mechanism
// behind the "everything suddenly goes blank" reports.
//
// A boundary cannot catch errors in event handlers, async callbacks or
// setTimeout — those still reject normally — but it does contain the render
// path, which is where a bad shape actually explodes.
//
// Must stay a class component: React exposes no hook equivalent of
// componentDidCatch / getDerivedStateFromError.
// ---------------------------------------------------------------------------
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled render error:', error, info?.componentStack);
    captureClientException(error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="font-display text-xl font-bold text-neutral-800 dark:text-neutral-100">
          Something went wrong on this page
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
          The rest of the site is still working. Try reloading — if it keeps
          happening, send this message to the Barcode team.
        </p>
        <code className="text-[11px] text-neutral-400 max-w-md break-words">
          {error.message}
        </code>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold uppercase tracking-wide active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
