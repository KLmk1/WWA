import { useState } from 'react';
import { getCup } from '../api/cup.js';
import { useApi } from '../hooks/useApi.js';
import Skeleton from '../components/ui/Skeleton.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import Bracket from '../components/cup/Bracket.jsx';
import TeamCard from '../components/cup/TeamCard.jsx';
import TeamModal from '../components/cup/TeamModal.jsx';

export default function Cup() {
  const { data, loading, error, refetch } = useApi(getCup, { pollMs: 5000 });
  const [openTeamId, setOpenTeamId] = useState(null);

  if (loading) return <Skeleton className="h-96" />;
  if (error && !data) return <ErrorState onRetry={refetch} />;

  const { status, matches, teams } = data;
  const openTeam = teams.find((t) => t.id === openTeamId);

  return (
    <section className="space-y-6">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Новогодний Кубок</h1>
        <StatusBadge status={status} />
      </header>

      {matches.length === 0 ? (
        <EmptyState title="Сетка появится после драфта" />
      ) : (
        <Bracket matches={matches} onTeamClick={setOpenTeamId} />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} onClick={() => setOpenTeamId(team.id)} />
        ))}
      </div>

      {openTeam && <TeamModal team={openTeam} onClose={() => setOpenTeamId(null)} />}
    </section>
  );
}