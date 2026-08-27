// src/utils/sentry.js
// Frontend Error Monitoring Hook

const SENTRY_DSN = import.meta.env?.VITE_SENTRY_DSN || '';
const isSentryActive = Boolean(SENTRY_DSN && SENTRY_DSN.startsWith('http'));

export const captureClientException = (error, errorInfo) => {
  if (isSentryActive && typeof window !== 'undefined') {
    try {
      fetch(SENTRY_DSN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exception: {
            values: [
              {
                type: error?.name || 'ClientRenderError',
                value: error?.message || String(error),
                stacktrace: { frames: error?.stack },
              },
            ],
          },
          tags: {
            url: window.location.href,
            userAgent: navigator.userAgent,
          },
          extra: errorInfo,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }
};
