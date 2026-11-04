import { NavLink, Outlet, useNavigation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.jsx';
import logo from '../assets/logo.png';

const links = [
  { to: '/', label: 'Главная', end: true },
  { to: '/cup', label: 'Кубок' },
  { to: '/awards', label: 'Awards' },
  { to: '/quiz', label: 'Квиз' },
];

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded text-sm ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const mobileLinks = user.isAdmin ? [...links, { to: '/admin', label: 'Админ' }] : links;

  return (
    <div className="min-h-screen bg-slate-950 bg-[url('./assets/background.png')] bg-repeat bg-[length:672px_384px] text-slate-100 pb-16 md:pb-0">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <img src={logo} alt="" className="h-8 w-8" />
          <span className="font-semibold">WW New Year</span>

          <nav className="hidden md:flex gap-1" aria-label="Основная навигация">
            {links.map((l) => <NavLink key={l.to} {...l} className={linkClass}>{l.label}</NavLink>)}
            {user.isAdmin && <NavLink to="/admin" className={linkClass}>Админка</NavLink>}
          </nav>

          <div className="flex items-center gap-3">
            {user.avatar && <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" />}
            <span className="text-sm">{user.username}</span>
            <button onClick={logout} className="text-sm text-slate-400 hover:text-white">Выйти</button>
          </div>
        </div>
        {navigation.state === 'loading' && <div className="h-0.5 bg-indigo-500 animate-pulse" />}
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      {/* Нижняя панель на мобильных */}
      <nav
        className="fixed bottom-0 inset-x-0 flex md:hidden border-t border-slate-800 bg-slate-950"
        aria-label="Основная навигация"
      >
        {mobileLinks.map((l) => (
          <NavLink
            key={l.to} to={l.to} end={l.end}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-xs ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}