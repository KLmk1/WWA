import { useEffect, useRef } from 'react';

// Все картинки из src/assets/chains/ подхватываются автоматически (по алфавиту).
// Если картинок меньше, чем мест, они повторяются по кругу.
const files = import.meta.glob('../../assets/chains/*.{png,webp,jpg,jpeg,svg,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const IMAGES = Object.keys(files).sort().map((k) => files[k]);

// Места: top — % высоты страницы, left/right — % ширины экрана (минус = частично за краем),
// w — ширина на десктопе (px), rot — наклон, speed — скорость параллакса,
// o — прозрачность, flip — зеркально, mobile:false — скрыть на телефоне.
const SLOTS = [
  { top: 1,  left: -3,  w: 230, rot: 10,  speed: 0.06,  o: 0.55 },
  { top: 6,  right: -4, w: 270, rot: -14, speed: -0.05, o: 0.5,  flip: true },
  { top: 15, left: 3,   w: 150, rot: -8,  speed: 0.09,  o: 0.4,  mobile: false },
  { top: 22, right: 1,  w: 210, rot: 16,  speed: 0.04,  o: 0.55 },
  { top: 31, left: -5,  w: 260, rot: 6,   speed: -0.06, o: 0.5,  flip: true },
  { top: 40, right: 4,  w: 160, rot: -10, speed: 0.08,  o: 0.4,  mobile: false },
  { top: 48, left: 1,   w: 220, rot: -12, speed: 0.05,  o: 0.5 },
  { top: 57, right: -3, w: 250, rot: 8,   speed: -0.04, o: 0.55, flip: true },
  { top: 66, left: -2,  w: 170, rot: 14,  speed: 0.07,  o: 0.4,  mobile: false },
  { top: 74, right: 2,  w: 230, rot: -6,  speed: 0.03,  o: 0.5 },
  { top: 83, left: -4,  w: 250, rot: 9,   speed: -0.05, o: 0.55 },
  { top: 91, right: -2, w: 200, rot: -15, speed: 0.06,  o: 0.5,  flip: true },
];

export default function ChainsBackground() {
  const ref = useRef(null);

  // Параллакс: пишем scrollY в CSS-переменную, без setState. При «уменьшить движение» не двигаем.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      el.style.setProperty('--sy', String(Math.round(window.scrollY)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (IMAGES.length === 0) return null;

  return (
    <div ref={ref} aria-hidden="true" className="chain-layer">
      {SLOTS.map((s, i) => (
        <div
          key={i}
          className={`chain-slot ${s.mobile === false ? 'hidden md:block' : ''}`}
          style={{
            top: `${s.top}%`,
            left: s.left !== undefined ? `${s.left}%` : undefined,
            right: s.right !== undefined ? `${s.right}%` : undefined,
            '--w': `${s.w}px`,
            '--rot': `${s.rot}deg`,
            '--speed': s.speed,
            '--o': s.o,
          }}
        >
          <div
            className="chain-sway"
            style={{ '--dur': `${6 + ((i * 5) % 5)}s`, '--delay': `-${(i * 7) % 6}s` }}
          >
            <img
              src={IMAGES[i % IMAGES.length]}
              alt=""
              loading="lazy"
              decoding="async"
              className="chain-img"
              style={s.flip ? { transform: 'scaleX(-1)' } : undefined}
            />
          </div>
        </div>
      ))}
    </div>
  );
}