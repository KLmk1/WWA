import { Link } from 'react-router-dom';
import { EVENT } from '../config/event.js';
import { useAuth } from '../auth/useAuth.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Snow from '../components/dashboard/Snow.jsx';
import Countdown from '../components/dashboard/Countdown.jsx';
import Timeline from '../components/dashboard/Timeline.jsx';
import StreamPlayer from '../components/dashboard/StreamPlayer.jsx';
import Faq from '../components/dashboard/Faq.jsx';
import ChainsBackground from '../components/dashboard/ChainsBackground.jsx';
import BigChain from '../components/dashboard/BigChain.jsx';

const FEATURES = [
  { to: '/cup', icon: '/icons/cup.png', title: 'Новогодний Кубок', text: 'Драфт, турнирная сетка и счёт матчей в реальном времени.' },
  { to: '/awards', icon: '/icons/awards.png', title: 'WWAwards', text: 'Тайное голосование в шуточных номинациях: «Фидер года», «CEO Рошпита», «Агент 007».' },
  { to: '/quiz', icon: '/icons/quiz.png', title: 'Новогодний квиз', text: '20 вопросов по Dota 2 и мемам сервера. Одна попытка и таблица лидеров.' },
];

function scrollToId(id) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

function SectionTitle({ eyebrow, title }) {
  return (
    <Reveal className="mb-8 text-center sm:mb-10">
      <p className="text-sm uppercase tracking-[0.3em] text-violet-300">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{title}</h2>
    </Reveal>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="relative space-y-24 pb-10 sm:space-y-32">
        <ChainsBackground />
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 px-5 py-12 text-center sm:px-10 sm:py-20">
            <BigChain />
            <div className="orb -left-10 -top-10 h-72 w-72 bg-violet-600/40" />
            <div className="orb -bottom-16 -right-10 h-80 w-80 bg-fuchsia-600/25 [animation-delay:-6s]" />
            <div aria-hidden="true" className="glass-pane absolute inset-0" />
            <Snow />


            <div className="relative">
            <Reveal variant="fade">
                <p className="text-sm text-slate-300">С наступающим, {user.username}!</p>
            </Reveal>
            <Reveal delay={100}>
                <h1 className="text-shimmer mt-3 text-5xl font-black tracking-tight sm:text-7xl md:text-8xl">
                {EVENT.title}
                </h1>
            </Reveal>
            <Reveal delay={200}>
                <p className="mt-3 text-lg font-medium text-violet-200 sm:text-xl">{EVENT.subtitle}</p>
                <p className="mx-auto mt-2 max-w-xl text-slate-400">{EVENT.tagline}</p>
            </Reveal>
            <Reveal variant="zoom" delay={350} className="mt-10">
                <Countdown target={EVENT.startsAt} />
            </Reveal>
            <Reveal delay={500} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                onClick={() => scrollToId('register')}
                className="min-h-11 rounded-xl bg-violet-500 px-7 py-3 font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.5)] transition hover:-translate-y-0.5 hover:bg-violet-400"
                >
                Зарегистрироваться
                </button>
                <button
                onClick={() => scrollToId('stream')}
                className="glass min-h-11 rounded-xl px-7 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                Смотреть стрим
                </button>
            </Reveal>
            </div>
        </section>

        {/* ---------- О ивенте ---------- */}
        <section id="about" className="scroll-mt-6">
            <SectionTitle eyebrow="О ивенте" title="Один вечер, три события" />
            <div className="grid items-center gap-8 md:grid-cols-5">
            <Reveal variant="left" className="space-y-4 text-slate-300 md:col-span-3">
                {EVENT.description.map((p) => <p key={p}>{p}</p>)}
            </Reveal>
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
                {EVENT.stats.map((s, i) => (
                <Reveal key={s.label} variant="zoom" delay={i * 120} className="glass rounded-2xl p-5 text-center">
                    <p className="text-shimmer text-4xl font-black">{s.value}</p>
                    <p className="mt-1 text-sm text-slate-400">{s.label}</p>
                </Reveal>
                ))}
            </div>
            </div>
        </section>

        {/* ---------- Что вас ждёт ---------- */}
        <section>
            <SectionTitle eyebrow="Программа" title="Что вас ждёт" />
            <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f, i) => (
                <Reveal key={f.to} delay={i * 150}>
                <Link to={f.to} className="glass glass-hover group flex h-full flex-col rounded-2xl p-6">
                    <img src={f.icon} alt="" className="h-16 w-auto self-start object-contain" />
                    <h3 className="mt-4 text-xl font-semibold text-white">{f.title}</h3>
                    <p className="mt-2 flex-1 text-slate-400">{f.text}</p>
                    <span className="mt-5 text-violet-300 transition group-hover:translate-x-1">Перейти →</span>
                </Link>
                </Reveal>
            ))}
            </div>
        </section>

        {/* ---------- Расписание ---------- */}
        <section id="schedule" className="scroll-mt-6">
            <SectionTitle eyebrow="Расписание" title="Как пройдёт вечер" />
            <div className="mx-auto max-w-2xl">
            <Timeline items={EVENT.schedule} timeZone={EVENT.timeZone} tzLabel={EVENT.tzLabel} />
            </div>
        </section>

        {/* ---------- Регистрация ---------- */}
        <section id="register" className="scroll-mt-6">
            <SectionTitle eyebrow="Регистрация" title="Присоединяйтесь" />
            <div className="grid gap-4 md:grid-cols-2">
            {EVENT.registration.map((r, i) => (
                <Reveal key={r.id} variant={i % 2 ? 'right' : 'left'}>
                <div className="glass flex h-full flex-col rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-white">{r.title}</h3>
                    <p className="mt-2 flex-1 text-slate-400">{r.text}</p>
                    {r.deadline && <p className="mt-3 text-sm text-violet-300">{r.deadline}</p>}
                    <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-500 px-6 font-semibold text-white transition hover:bg-violet-400"
                    >
                    Открыть форму ↗
                    </a>
                </div>
                </Reveal>
            ))}
            </div>
            <Reveal delay={200} className="mt-4">
            <a
                href={EVENT.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="glass glass-hover flex flex-col items-center justify-between gap-3 rounded-2xl p-5 text-center sm:flex-row sm:text-left"
            >
                <span className="text-slate-300">Вопросы и общение — на нашем Discord-сервере.</span>
                <span className="rounded-xl bg-[#5865F2] px-5 py-2.5 font-semibold text-white">Открыть Discord ↗</span>
            </a>
            </Reveal>
        </section>

        {/* ---------- Трансляция ---------- */}
        <section id="stream" className="scroll-mt-6">
            <SectionTitle eyebrow="Прямой эфир" title="Смотрите турнир" />
            <Reveal variant="zoom" className="mx-auto max-w-4xl">
            <StreamPlayer channel={EVENT.stream.channel} title={EVENT.stream.title} />
            </Reveal>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="scroll-mt-6">
            <SectionTitle eyebrow="FAQ" title="Частые вопросы" />
            <Faq items={EVENT.faq} />
        </section>
    </div>
  );
}