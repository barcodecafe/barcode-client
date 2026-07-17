import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// useVisiblePolling — background refresh that only runs while the tab is visible.
//
// Interval sizing here is a correctness concern, not a tuning preference. The
// server puts a GLOBAL 500 req / 15min / IP limiter in front of /api
// (app.ts) — global meaning every admin tab on that IP shares one budget, so
// one page's poll can 429 the whole admin. A 3s two-call poll spends 600 of
// those 500 in 15 minutes and locks the admin out with nobody touching the
// keyboard; that was measured, not theorised (QA, 2026-07-17). The config
// intends to drop the limit to ~100 in production, which leaves far less room
// than it looks.
//
// So: hidden tabs poll nothing, and a tab that regains visibility refetches
// once immediately. Freshness is spent where someone is actually looking
// instead of burning the shared budget in a forgotten background tab.
// ---------------------------------------------------------------------------
export const useVisiblePolling = (callback, { intervalMs, enabled = true } = {}) => {
  // Kept in a ref so a caller passing an inline function doesn't tear down and
  // re-phase the interval on every render.
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    const run = () => savedCallback.current();
    const tick = () => {
      if (document.visibilityState === 'visible') run();
    };

    let interval = setInterval(tick, intervalMs);

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      run(); // catch up on whatever changed while we were hidden
      // Re-phase, so the catch-up isn't immediately followed by a scheduled tick.
      clearInterval(interval);
      interval = setInterval(tick, intervalMs);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [intervalMs, enabled]);
};
