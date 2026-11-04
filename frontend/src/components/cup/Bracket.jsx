import MatchCard from './MatchCard.jsx';

// Колонки по раундам слева направо. На узких экранах — горизонтальный скролл.
export default function Bracket({ matches, onTeamClick }) {
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const last = rounds[rounds.length - 1];

  const roundTitle = (r) => (r === last ? 'Финал' : `Раунд ${r}`);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-8">
        {rounds.map((round) => (
          <div key={round} className="flex flex-col justify-around gap-4">
            <h2 className="text-sm font-medium text-slate-400">{roundTitle(round)}</h2>
            {matches
              .filter((m) => m.round === round)
              .sort((a, b) => a.slot - b.slot)
              .map((m) => <MatchCard key={m.id} match={m} onTeamClick={onTeamClick} />)}
          </div>
        ))}
      </div>
    </div>
  );
}