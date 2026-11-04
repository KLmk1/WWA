import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/admin', label: 'Сводка', end: true },
  { to: '/admin/bracket', label: 'Сетка' },
  { to: '/admin/teams', label: 'Команды' },
  { to: '/admin/awards', label: 'Номинации' },
  { to: '/admin/quiz', label: 'Квиз' },
  { to: '/admin/users', label: 'Участники' },
];

export default function AdminLayout() {
  return (
    <div className="space-y-4">
      <nav className="flex gap-1 overflow-x-auto border-b border-slate-800 pb-2" aria-label="Админка">
        {tabs.map((t) => (
          <NavLink
            key={t.to} to={t.to} end={t.end}
            className={({ isActive }) =>
              `whitespace-nowrap rounded px-3 py-2 text-sm ${
                isActive ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}