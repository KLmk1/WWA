import { useEffect, useRef, useState } from 'react';

// Плавное появление элемента, когда он попадает в видимую область.
// variant: up | left | right | zoom | fade. delay (мс) — для «лесенки» между соседями.
export default function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className = '', children }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ '--reveal-delay': `${delay}ms` }}
      className={`reveal reveal-${variant} ${shown ? 'is-visible' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}