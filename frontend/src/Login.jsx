import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

// Бэкенд редиректит на /login?error=<code>
const ERRORS = {
  not_in_guild: 'Вы не состоите в нашем Discord-сервере. Вступите и попробуйте снова.',
  not_allowed: 'Вашего аккаунта нет в списке участников.',
  access_denied: 'Вход отменён. Попробуйте ещё раз.',
  state_mismatch: 'Сессия входа устарела. Попробуйте ещё раз.',
};

export default function Login() {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const code = params.get('error');
  const message = code && (ERRORS[code] ?? 'Не удалось войти. Попробуйте ещё раз.');

  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-sm space-y-5 text-center">
        <h1 className="text-3xl font-bold">🎄 WW New Year Event</h1>
        <p className="text-slate-400">Новогодний вечер WW Community</p>

        {message && (
          <p role="alert" className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {message}
          </p>
        )}

        <button onClick={login} className="w-full rounded bg-[#5865F2] py-3 font-medium text-white hover:brightness-110">
          Войти через Discord
        </button>
        <p className="text-xs text-slate-500">Мы получаем только ник и аватар.</p>
      </div>
    </div>
  );
}