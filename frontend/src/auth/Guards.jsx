import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth.jsx';

function Splash({ children }) {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-300">
      {children}
    </div>
  );
}

// Любая страница, кроме /login
export function RequireAuth() {
  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();

  if (loading) return <Splash>Загрузка…</Splash>;
  if (error && !user) {
    return (
      <Splash>
        <div className="text-center space-y-3">
          <p>Не удалось связаться с сервером.</p>
          <button onClick={refresh} className="rounded bg-indigo-600 px-4 py-2 text-white">
            Повторить
          </button>
        </div>
      </Splash>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

// Только для админов; обычного пользователя отправляем на /403
export function RequireAdmin() {
  const { user } = useAuth();
  if (!user?.isAdmin) return <Navigate to="/403" replace />;
  return <Outlet />;
}

// /login: вошедших возвращаем туда, откуда пришли (или на главную)
export function GuestOnly() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Splash>Загрузка…</Splash>;
  if (user) return <Navigate to={location.state?.from || '/'} replace />;
  return <Outlet />;
}