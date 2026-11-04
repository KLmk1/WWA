const MAP = {
  not_started: ['Не начат', 'bg-slate-700 text-slate-200'],
  live: ['LIVE', 'bg-red-600 text-white'],
  finished: ['Завершён', 'bg-emerald-700 text-white'],
  pending: ['Ожидается', 'bg-slate-700 text-slate-200'],
  not_open: ['Скоро', 'bg-slate-700 text-slate-200'],
  open: ['Открыто', 'bg-emerald-700 text-white'],
  closed: ['Закрыто', 'bg-slate-700 text-slate-300'],
};

export default function StatusBadge({ status }) {
  const [label, cls] = MAP[status] ?? [status, 'bg-slate-700 text-slate-200'];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{label}</span>;
}