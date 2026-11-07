import { Link } from 'react-router-dom';
import Reveal from './Reveal.jsx';
import Snow from '../dashboard/Snow.jsx';

export default function ComingSoon({ title }) {
  return (
    <section className="glass relative overflow-hidden rounded-3xl px-5 py-16 text-center sm:py-28">
      <div className="orb -left-10 -top-10 h-64 w-64 bg-violet-600/40" />
      <div className="orb -bottom-16 -right-10 h-72 w-72 bg-fuchsia-600/25 [animation-delay:-6s]" />
      <Snow count={18} />

      <div className="relative">
        {title && (
          <Reveal variant="fade">
            <p className="text-sm uppercase tracking-[0.3em] text-violet-300">{title}</p>
          </Reveal>
        )}
        <Reveal delay={100}>
          <h1 className="text-shimmer mt-4 text-5xl font-black uppercase tracking-tight sm:text-7xl md:text-8xl">
            Coming<br className="sm:hidden" /> soon
          </h1>
        </Reveal>
        <Reveal delay={250}>
          <p className="mx-auto mt-5 max-w-md text-slate-400">
            Раздел откроется ближе к ивенту. Следите за расписанием на главной странице.
          </p>
        </Reveal>
        <Reveal delay={400}>
          <Link
            to="/"
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-500 px-7 font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.5)] transition hover:-translate-y-0.5 hover:bg-violet-400"
          >
            На главную
          </Link>
        </Reveal>
      </div>
    </section>
  );
}