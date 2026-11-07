import { useEffect, useRef } from 'react';

// Одна большая цепь целиком (без обрезки) за стеклом hero.
// Файл: src/assets/big-chain.png (или .webp / .jpg / .svg / .avif). Если файла нет, ничего не рисуем.
const files = import.meta.glob('../../assets/big-chain.{png,webp,jpg,jpeg,svg,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
});
const SRC = Object.values(files)[0];

export default function BigChain() {
  const ref = useRef(null);

  // Параллакс и затухание при прокрутке: пишем scrollY в CSS-переменную без setState
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

  if (!SRC) return null;

  return (
    <div ref={ref} aria-hidden="true" className="chain-big-layer">
      <div className="chain-big-float">
        <img src={SRC} alt="" decoding="async" className="chain-big" />
      </div>
    </div>
  );
}