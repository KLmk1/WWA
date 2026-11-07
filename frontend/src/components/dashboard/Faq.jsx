import Reveal from '../ui/Reveal.jsx';

export default function Faq({ items }) {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((it, i) => (
        <Reveal key={it.q} delay={i * 80}>
          <details className="group glass rounded-2xl">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-medium text-white [&::-webkit-details-marker]:hidden">
              {it.q}
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-none stroke-violet-300 stroke-2 transition-transform duration-300 group-open:rotate-180" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="px-5 pb-4 text-slate-400">{it.a}</p>
          </details>
        </Reveal>
      ))}
    </div>
  );
}