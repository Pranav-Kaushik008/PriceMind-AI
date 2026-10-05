/**
 * hooks/useDataFetch.js
 * ---------------------
 * Reusable async data-fetching hook for all pages.
 * - Manages loading / error / data states
 * - Automatic re-fetch when deps change
 * - Manual refresh via `refetch()`
 * - Aborts stale in-flight requests on re-render
 */
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @param {Function} fetcher     - async function that returns data
 * @param {Array}    deps        - dependency array (triggers re-fetch on change)
 * @param {*}        initialData - initial value while loading
 */
export function useDataFetch(fetcher, deps = [], initialData = null) {
  const [data, setData]       = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [tick, setTick]       = useState(0);          // bump to force refetch
  const abortRef              = useRef(null);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, isLoading, error, refetch };
}
