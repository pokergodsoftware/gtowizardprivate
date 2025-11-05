import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook for debouncing values
 * Useful to avoid excessive updates on rapid input/actions
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttling callbacks
 * Limits how often a function can be executed
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRun.current = now;
      } else {
        // Schedule for later
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Hook to memoize heavy callbacks
 * Similar to useCallback but with a simple result cache
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T {
  const cacheRef = useRef<Map<string, any>>(new Map());

  return useCallback(
    ((...args: any[]) => {
      const key = JSON.stringify(args);
      
      if (cacheRef.current.has(key)) {
        return cacheRef.current.get(key);
      }

      const result = callback(...args);
      cacheRef.current.set(key, result);

      // Limitar tamanho do cache
      if (cacheRef.current.size > 100) {
        const firstKey = cacheRef.current.keys().next().value;
        cacheRef.current.delete(firstKey);
      }

      return result;
    }) as T,
    dependencies
  );
}

/**
 * Hook for AbortController cleanup
 * Simplifies cancelling requests
 */
export function useAbortController(): AbortController {
  const controllerRef = useRef<AbortController>();

  useEffect(() => {
    controllerRef.current = new AbortController();

    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return controllerRef.current!;
}

/**
 * Hook to help prevent memory leaks in async operations
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}
