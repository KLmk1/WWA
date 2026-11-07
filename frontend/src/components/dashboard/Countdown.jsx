import { useNow } from '../../hooks/useNow.js';

const pad = (n) => String(n).padStart(2, '0');

export default function Countdown({ target }) {
  const now = useNow();
  const diff = Math.max(0, new Date(target).getTime() - now);

  if (diff === 0) {
    return <p className="text-2xl font-semibold text-emerald-300">Ивент начался! 🎉</p>;
  }

  const s = Math.floor(diff / 1000);
  const parts = [
    ['дней', Math.floor(s / 86400)],
    ['часов', Math.floor((s % 86400) / 3600)],
    ['минут', Math.floor((s % 3600) / 60)],
    ['секунд', s % 60],
  ];

  return (
    <div className="flex justify-center gap-2 sm:gap-4" role="timer" aria-label="До начала ивента">
      {parts.map(([label, value]) => (
        <div
          key={label}
          className="glass flex w-[4.4rem] flex-col items-center rounded-2xl py-3 sm:w-24 sm:py-4"
        >
          <span key={value} className="tick text-3xl font-bold tabular-nums text-white sm:text-5xl">
            {label === 'дней' ? value : pad(value)}
          </span>
          <span className="mt-1 text-[0.65rem] uppercase tracking-widest text-slate-400 sm:text-xs">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}