import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../auth/useAuth.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Snow from '../components/dashboard/Snow.jsx';

// Бэкенд редиректит на /login?error=<код>
const ERRORS = {
  access_denied: 'Вход отменён. Попробуйте ещё раз.',
  state_mismatch: 'Сессия входа устарела. Попробуйте ещё раз.',
  auth_failed: 'Google не подтвердил вход. Попробуйте ещё раз.',
  email_not_verified: 'E-mail этого Google-аккаунта не подтверждён.',
  not_allowed: 'Этого аккаунта нет в списке участников. Войдите с другим e-mail или напишите организаторам.',
  blocked: 'Доступ для этого аккаунта закрыт.',
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);

  const code = params.get('error');
  const message = code && (ERRORS[code] ?? 'Не удалось войти. Попробуйте ещё раз.');

  function handleLogin() {
    setRedirecting(true); // защита от двойного клика
    login();
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      <div className="orb -left-20 -top-20 h-96 w-96 bg-violet-600/35" />
      <div className="orb -bottom-24 -right-16 h-[26rem] w-[26rem] bg-fuchsia-600/25 [animation-delay:-6s]" />
      <Snow count={34} />

      <div className="relative w-full max-w-md">
        <Reveal variant="zoom" className="glass rounded-3xl px-6 py-10 text-center sm:px-10">
          <img src={logo} alt="Wrong WRLD Awards" className="mx-auto h-24 w-auto rounded-2xl" />

          <h1 className="text-shimmer mt-6 text-4xl font-black tracking-tight">Вход и регистрация</h1>
          <p className="mt-3 text-slate-400">
            Новогодний ивент Wrong WRLD: турнир, WWAwards и квиз. Один клик, и вы в игре.
          </p>

          {message && (
            <p role="alert" className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
              {message}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={redirecting}
            className="mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-3 font-medium text-slate-800 shadow-[0_0_30px_rgba(139,92,246,0.35)] transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70"
          >
            <GoogleIcon />
            {redirecting ? 'Переходим в Google…' : 'Продолжить с Google'}
          </button>

          <p className="mt-5 text-xs text-slate-500">
            Аккаунт создаётся автоматически при первом входе. Мы получаем только имя, e-mail и аватар.
          </p>
        </Reveal>
      </div>
    </div>
  );
}