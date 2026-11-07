import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth, RequireAdmin, GuestOnly } from './auth/Guards.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import RouteError from './pages/RouteError.jsx';
import ComingSoonGate from './components/ComingSoonGate.jsx';

// Ленивая загрузка страниц: каждая страница — отдельный чанк.
// Страница должна делать `export default`.
const page = (loader) => ({
  lazy: async () => ({ Component: (await loader()).default }),
});

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      // --- Только для неавторизованных ---
      {
        element: <GuestOnly />,
        children: [{ path: '/login', ...page(() => import('./pages/Login.jsx')) }],
      },

      // --- Для вошедших пользователей ---
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, ...page(() => import('./pages/Dashboard.jsx')) },
              // Разделы, которые можно закрыть заглушкой COMING SOON (флаги в config/event.js)
              {
                element: <ComingSoonGate />,
                children: [
                  { path: 'cup', ...page(() => import('./pages/Cup.jsx')) },
                  { path: 'awards', ...page(() => import('./pages/Awards.jsx')) },
                  { path: 'quiz', ...page(() => import('./pages/Quiz.jsx')) },
                ],
              },

              // --- Админка: роль проверяется и на бэкенде, здесь только UX ---
              {
                path: 'admin',
                element: <RequireAdmin />,
                children: [
                  {
                    element: <AdminLayout />,
                    children: [
                      { index: true, ...page(() => import('./pages/admin/AdminHome.jsx')) },
                      { path: 'bracket', ...page(() => import('./pages/admin/AdminBracket.jsx')) },
                      { path: 'teams', ...page(() => import('./pages/admin/AdminTeams.jsx')) },
                      { path: 'awards', ...page(() => import('./pages/admin/AdminAwards.jsx')) },
                      { path: 'quiz', ...page(() => import('./pages/admin/AdminQuiz.jsx')) },
                      { path: 'users', ...page(() => import('./pages/admin/AdminUsers.jsx')) },
                    ],
                  },
                ],
              },

              { path: '403', ...page(() => import('./pages/Forbidden.jsx')) },
            ],
          },
        ],
      },

      // /auth/callback обрабатывает бэкенд (302 на / или /login?error=...).
      // Если пользователь всё же попал сюда на фронте — отправляем на главную.
      { path: '/auth/callback', element: <Navigate to="/" replace /> },

      { path: '*', ...page(() => import('./pages/NotFound.jsx')) },
    ],
  },
]);