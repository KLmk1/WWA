export default function Skeleton({ className = 'h-24' }) {
  return (
    <div
      role="status"
      aria-label="Загрузка"
      className={`animate-pulse rounded-lg bg-slate-800 ${className}`}
    />
  );
}