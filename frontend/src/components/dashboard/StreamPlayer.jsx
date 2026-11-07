import { useState } from 'react';

// Плеер Twitch. Iframe грузится по клику: страница открывается быстрее, звук не включается сам.
// Twitch требует параметр parent — домен, на котором открыт сайт (localhost для разработки подходит).
export default function StreamPlayer({ channel, title }) {
  const [active, setActive] = useState(false);
  const parent = window.location.hostname;
  const src = `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parent)}&autoplay=true`;

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_80px_-20px_rgba(139,92,246,0.6)]">
        {active ? (
          <iframe
            src={src}
            title={title}
            allowFullScreen
            allow="autoplay; fullscreen"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            onClick={() => setActive(true)}
            aria-label="Загрузить трансляцию"
            className="group absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.35),transparent_65%)]"
          >
            <span className="grid h-20 w-20 place-items-center rounded-full bg-violet-500 shadow-[0_0_60px_rgba(139,92,246,0.8)] transition group-hover:scale-110">
              <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-white" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="absolute bottom-5 px-4 text-center text-sm text-slate-300">
              Нажмите, чтобы загрузить трансляцию
            </span>
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <span>Если эфир не идёт, ивент ещё не начался.</span>
        <a
          href={`https://www.twitch.tv/${channel}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg px-3 py-2 text-violet-300 hover:bg-white/5 hover:text-white"
        >
          Открыть на Twitch ↗
        </a>
      </div>
    </div>
  );
}