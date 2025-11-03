import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook para debounce de valores
 * Útil para evitar updates excessivos em ações rápidas
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
 * Hook para throttle de callbacks
 * Limita a frequência de execução de uma função
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
 * Hook para memoizar callbacks pesados
 * Similar ao useCallback mas com cache de resultados
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
 * Hook para cleanup de AbortController
 * Facilita cancelamento de requisições
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
 * Hook para prevenir memory leaks em async operations
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
