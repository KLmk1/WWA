import { useCallback, useEffect, useRef, useState } from 'react';

// fetcher: (signal) => Promise. pollMs: опрос с интервалом (на скрытой вкладке пропускается).
export function useApi(fetcher, { pollMs } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => { fetcherRef.current = fetcher; });

  useEffect(() => {
    const controller = new AbortController();
    fetcherRef.current(controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        // при сбое опроса старые данные остаются на экране
        setState((s) => ({ ...s, error, loading: false }));
      });
    return () => controller.abort();
  }, [tick]);

  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1);
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refetch };
}