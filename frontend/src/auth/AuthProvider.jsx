import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../lib/api.js';
import { AuthContext } from './auth-context.js';
import { getMe } from '../api/me.js';

// user: { id, discordId, username, avatar, isAdmin } | null
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0); // меняется при повторной попытке

  useEffect(() => {
    const controller = new AbortController();

    getMe(controller.signal)
      .then((u) => { setUser(u); setError(null); })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        if (e instanceof ApiError && e.status === 401) setUser(null); // просто не вошёл
        else setError(e); // сеть или сервер упали
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  const refresh = useCallback(() => {
    setError(null);
    setLoading(true);
    setAttempt((a) => a + 1);
  }, []);

  const login = useCallback(() => {
    window.location.href = '/auth/discord';
  }, []);

  const logout = useCallback(async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, refresh, login, logout }),
    [user, loading, error, refresh, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}