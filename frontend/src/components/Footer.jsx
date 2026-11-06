const TEXT = 'WRONG WRLD AWARDS';
const ITEMS_PER_HALF = 12;

function Half() {
  return (
    <div className="flex shrink-0 items-center whitespace-nowrap">
      {Array.from({ length: ITEMS_PER_HALF }, (_, i) => (
        <span key={i} className="flex items-center gap-6 pr-6">
          <span>{TEXT}</span>
          <span aria-hidden="true">❄</span>
        </span>
      ))}
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/90">
      <div
        role="img"
        aria-label="Wrong WRLD Awards"
        className="marquee py-2.5 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
      >
        <div className="marquee-track" aria-hidden="true">
          <Half />
          <Half />
        </div>
      </div>
    </footer>
  );
}