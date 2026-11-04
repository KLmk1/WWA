export default function EmptyState({ title, text }) {
  return (
    <div className="rounded-lg border border-slate-800 p-8 text-center space-y-1">
      <h2 className="text-lg font-medium">{title}</h2>
      {text && <p className="text-slate-400">{text}</p>}
    </div>
  );
}