import { useEffect } from 'react';

export default function TeamModal({ team, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const members = [...team.members].sort((a, b) => a.position - b.position);

  return (
    <div
      className="fixed inset-0 z-20 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Состав: ${team.name}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3"
      >
        <h2 className="text-lg font-semibold">{team.name}</h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <span>{m.username}</span>
              <span className="text-sm text-slate-400">Позиция {m.position}</span>
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="w-full rounded bg-slate-800 py-2">Закрыть</button>
      </div>
    </div>
  );
}