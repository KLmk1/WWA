// Лёгкий снег на CSS. Значения детерминированные (без Math.random), чтобы не мерцало при перерисовке.
export default function Snow({ count = 28 }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const size = 3 + ((i * 5) % 5);
        return (
          <span
            key={i}
            className="snowflake"
            style={{
              left: `${(i * 37) % 100}%`,
              width: size,
              height: size,
              opacity: 0.35 + ((i * 11) % 5) * 0.1,
              animationDuration: `${9 + ((i * 7) % 9)}s`,
              animationDelay: `-${(i * 3) % 11}s`,
              '--drift': `${((i * 13) % 40) - 20}px`,
              '--fall': '760px',
            }}
          />
        );
      })}
    </div>
  );
}