import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/cup', async (req, res) => {
  const [teamsRes, membersRes, matchesRes] = await Promise.all([
    query('SELECT id, name FROM teams ORDER BY id'),
    query(
      `SELECT tm.team_id, tm.position, u.id, u.name, u.avatar
       FROM team_members tm JOIN users u ON u.id = tm.user_id
       ORDER BY tm.position`
    ),
    query(
      `SELECT m.id, m.round, m.slot, m.status, m.score_a, m.score_b, m.winner_id, m.next_match_id,
              m.team_a_id, ta.name AS team_a_name, m.team_b_id, tb.name AS team_b_name
       FROM matches m
       LEFT JOIN teams ta ON ta.id = m.team_a_id
       LEFT JOIN teams tb ON tb.id = m.team_b_id
       ORDER BY m.round, m.slot`
    ),
  ]);

  const teams = teamsRes.rows.map((t) => ({
    id: t.id,
    name: t.name,
    members: membersRes.rows
      .filter((m) => m.team_id === t.id)
      .map((m) => ({ id: m.id, username: m.name, avatar: m.avatar, position: m.position })),
  }));

  const matches = matchesRes.rows.map((m) => ({
    id: m.id,
    round: m.round,
    slot: m.slot,
    status: m.status,
    teamA: m.team_a_id ? { id: m.team_a_id, name: m.team_a_name } : null,
    teamB: m.team_b_id ? { id: m.team_b_id, name: m.team_b_name } : null,
    scoreA: m.score_a,
    scoreB: m.score_b,
    winnerId: m.winner_id,
  }));

  // Статус турнира: финал = матч без следующего
  const final = matchesRes.rows.find((m) => !m.next_match_id);
  let status = 'not_started';
  if (final?.status === 'finished') status = 'finished';
  else if (matchesRes.rows.some((m) => m.status !== 'pending')) status = 'live';

  res.json({ status, teams, matches });
});

export default router;