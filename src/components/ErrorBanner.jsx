import { AlertTriangle, RefreshCw } from 'lucide-react';

// ---------------------------------------------------------------------------
// ErrorBanner.jsx
//
// Shown when a page could not load its data. The point is to keep "we failed to
// fetch this" visually distinct from "there is nothing here" — the admin tables
// used to render a confident "No orders found." over a rate-limited request,
// which read as data loss rather than a temporary failure.
//
// `error` is the ApiError thrown by apiClient, so its message already explains
// a 429/timeout in plain language.
// ---------------------------------------------------------------------------
export const ErrorBanner = ({ title = 'Could not load data', error, onRetry }) => {
  if (!error) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10">
      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{title}</p>
        <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5 break-words">
          {error.message || 'Something went wrong.'}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-wide active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
