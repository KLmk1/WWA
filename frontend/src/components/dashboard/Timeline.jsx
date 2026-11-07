import { useEffect, useMemo, useRef } from 'react';
import { useNow } from '../../hooks/useNow.js';
import Reveal from '../ui/Reveal.jsx';

export default function Timeline({ items, timeZone, tzLabel }) {
  const ref = useRef(null);
  const now = useNow();

  // Линия заполняется по мере прокрутки. Пишем в CSS-переменную напрямую, без setState.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = (window.innerHeight * 0.65 - r.top) / r.height;
      el.style.setProperty('--progress', Math.min(1, Math.max(0, p)).toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const fmt = useMemo(
    () => new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone,
    }),
    [timeZone]
  );

  // Последний этап, время которого уже наступило
  const lastStarted = items.reduce((acc, it, i) => (new Date(it.at).getTime() <= now ? i : acc), -1);

  return (
    <ol ref={ref} className="relative ml-2 sm:ml-6">
      <span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-white/10" />
      <span aria-hidden="true" className="tl-fill absolute bottom-2 left-[7px] top-2 w-0.5 bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.8)]" />

      {items.map((it, i) => {
        const done = i < lastStarted || (i === lastStarted && i === items.length - 1);
        const current = i === lastStarted && !done;
        return (
          <Reveal as="li" key={it.id} variant="up" className="relative pb-10 pl-10 last:pb-0">
            <span aria-hidden="true" className="tl-dot absolute left-0 top-1.5 h-4 w-4 scale-75 rounded-full bg-slate-700" />
            <div className={done ? 'opacity-60' : ''}>
              <p className="flex flex-wrap items-center gap-2 text-sm text-violet-300">
                {fmt.format(new Date(it.at))} {tzLabel}
                {current && (
                  <span className="animate-pulse rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                    Сейчас
                  </span>
                )}
                {done && <span className="text-xs text-slate-400">завершено</span>}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">{it.title}</h3>
              <p className="mt-1 max-w-xl text-slate-400">{it.text}</p>
            </div>
          </Reveal>
        );
      })}
    </ol>
  );
}