/**
 * Production usePolling Hook
 * For real-time data fetching with automatic polling
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UsePollingOptions {
  interval?: number; // milliseconds
  enabled?: boolean; // can pause polling
  onError?: (error: Error) => void;
}

export interface UsePollingReturn<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook for polling data at regular intervals
 * @param fetchFn - Async function that fetches data
 * @param options - Polling options
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  options: UsePollingOptions = {}
): UsePollingReturn<T> {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetch = useCallback(async () => {
    try {
      const result = await fetchFn();

      if (isMountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      const error = err as Error;

      if (isMountedRef.current) {
        setError(error);
        console.error('[usePolling] Error:', error.message);

        if (onError) {
          onError(error);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, onError]);

  // Initial fetch and setup polling
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return;
    }

    // Fetch immediately
    fetch();

    // Setup polling interval
    intervalRef.current = setInterval(() => {
      fetch();
    }, interval);

    // Cleanup
    return () => {
      isMountedRef.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetch, interval, enabled]);

  return {
    data,
    error,
    loading,
    refetch: fetch,
  };
}
