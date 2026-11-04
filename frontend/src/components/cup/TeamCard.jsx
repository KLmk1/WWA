export default function TeamCard({ team, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-left hover:border-indigo-500"
    >
      <h3 className="font-medium">{team.name}</h3>
      <p className="mt-1 text-sm text-slate-400">
        {team.members.map((m) => m.username).join(', ')}
      </p>
    </button>
  );
}