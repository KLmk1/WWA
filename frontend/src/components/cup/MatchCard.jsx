import StatusBadge from '../ui/StatusBadge.jsx';

function Row({ team, score, isWinner, placeholder, onTeamClick }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-2 ${isWinner ? 'font-semibold text-emerald-300' : ''}`}>
      {team ? (
        <button onClick={() => onTeamClick(team.id)} className="truncate text-left hover:underline">
          {team.name}
        </button>
      ) : (
        <span className="truncate text-slate-500">{placeholder}</span>
      )}
      <span className="tabular-nums">{team ? score : ''}</span>
    </div>
  );
}

export default function MatchCard({ match, onTeamClick }) {
  const { teamA, teamB, scoreA, scoreB, status, winnerId, id } = match;
  return (
    <div className="w-56 shrink-0 rounded-lg border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-1.5 text-xs text-slate-400">
        <span>Матч {id}</span>
        <StatusBadge status={status} />
      </div>
      <Row team={teamA} score={scoreA} isWinner={winnerId && teamA?.id === winnerId}
           placeholder="Ожидается" onTeamClick={onTeamClick} />
      <Row team={teamB} score={scoreB} isWinner={winnerId && teamB?.id === winnerId}
           placeholder="Ожидается" onTeamClick={onTeamClick} />
    </div>
  );
}