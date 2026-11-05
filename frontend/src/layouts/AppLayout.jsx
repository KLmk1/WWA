import logo from '../assets/logo.png';
import { useAuth } from '../auth/useAuth.jsx';
import { NavLink, Outlet, useNavigation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Главная', end: true, icon: '/icons/main.png' },
  { to: '/cup', label: 'Кубок', icon: '/icons/cup.png' },
  { to: '/awards', label: 'Awards', icon: '/icons/awards.png' },
  { to: '/quiz', label: 'Квиз', icon: '/icons/quiz.png' },
];
const adminLink = { to: '/admin', label: 'Админка', icon: '/icons/admin.png' };

// Кнопка подстраивается под ширину картинки, высота фиксирована
const itemClass = ({ isActive }) =>
  `inline-flex items-center justify-center rounded-lg p-1 transition md:shrink-0 ${
    isActive ? 'bg-indigo-600' : 'opacity-60 hover:bg-slate-800 hover:opacity-100'
  }`;

function NavIcon({ to, label, end, icon }) {
  return (
    <NavLink to={to} end={end} title={label} aria-label={label} className={itemClass}>
        <img src={icon} alt="" className="h-20 w-auto rounded-lg object-contain md:h-24" />
    </NavLink>
  );
}
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const items = user.isAdmin ? [...links, adminLink] : links;

  return (
    <div className="min-h-screen bg-slate-950 bg-[url('./assets/background.png')] bg-repeat bg-[length:672px_384px] text-slate-100 pb-20 md:pb-0">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-2 md:px-4 md:py-3">
          <img src={logo} alt="" className="max-h-8 w-auto shrink-0 rounded-lg max-w-30 md:max-h-none" />
          <nav className="hidden md:flex gap-1" aria-label="Основная навигация">
            {items.map((item) => <NavIcon key={item.to} {...item} />)}
          </nav>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            {user.avatar && <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" />}
            <span className="hidden max-w-32 truncate text-sm sm:inline">{user.username}</span>
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
        className="fixed inset-x-0 bottom-0 flex justify-center gap-2 border-t border-slate-800 bg-slate-950 px-2 py-1 md:hidden"
        aria-label="Основная навигация"
      >
        {items.map((item) => <NavIcon key={item.to} {...item} />)}
      </nav>
    </div>
  );
}