import { Router } from 'express';
import { z } from 'zod';
import { query, tx } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { getSetting, setSetting } from '../lib/settings.js';
import { buildBracket } from '../lib/bracket.js';

const router = Router();

const idOf = (req, name = 'id') => z.coerce.number().int().positive().parse(req.params[name]);
const audit = (req, action, details = {}) =>
  query('INSERT INTO admin_log (user_id, action, details) VALUES ($1, $2, $3)', [
    req.user.id,
    action,
    JSON.stringify(details),
  ]);

/* ---------------- Сводка и настройки ---------------- */

router.get('/summary', async (req, res) => {
  const [users, attempts, noms, quizOpen, lbPublic] = await Promise.all([
    query('SELECT COUNT(*)::int AS n FROM users'),
    query(
      `SELECT COUNT(*) FILTER (WHERE finished_at IS NOT NULL)::int AS finished,
              COUNT(*) FILTER (WHERE finished_at IS NULL)::int AS in_progress FROM quiz_attempts`
    ),
    // Только количество проголосовавших, не выбор
    query(
      `SELECT n.id, n.title, n.status, COUNT(r.user_id)::int AS votes
       FROM nominations n LEFT JOIN vote_receipts r ON r.nomination_id = n.id
       GROUP BY n.id ORDER BY n.ord, n.id`
    ),
    getSetting('quiz_open', false),
    getSetting('leaderboard_public', false),
  ]);
  res.json({
    users: users.rows[0].n,
    quiz: { open: quizOpen, leaderboardPublic: lbPublic, ...attempts.rows[0] },
    nominations: noms.rows,
  });
});

const settingsSchema = z.object({ quizOpen: z.boolean().optional(), leaderboardPublic: z.boolean().optional() });

router.put('/settings', async (req, res) => {
  const body = settingsSchema.parse(req.body);
  if (body.quizOpen !== undefined) await setSetting('quiz_open', body.quizOpen);
  if (body.leaderboardPublic !== undefined) await setSetting('leaderboard_public', body.leaderboardPublic);
  await audit(req, 'settings.update', body);
  res.json({ ok: true });
});

/* ---------------- Пользователи ---------------- */

router.get('/users', async (req, res) => {
  const { rows } = await query(
    'SELECT id, email, name, avatar, is_blocked, created_at, last_login_at FROM users ORDER BY created_at'
  );
  res.json(
    rows.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.name,
      avatar: u.avatar,
      blocked: u.is_blocked,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
    }))
  );
});

router.post('/users/:id/block', async (req, res) => {
  const id = idOf(req);
  const { blocked } = z.object({ blocked: z.boolean() }).parse(req.body);
  if (id === req.user.id) throw new HttpError(400, 'cannot_block_self');
  await query('UPDATE users SET is_blocked = $2 WHERE id = $1', [id, blocked]);
  await audit(req, blocked ? 'user.block' : 'user.unblock', { id });
  res.json({ ok: true });
});

/* ---------------- Команды и сетка ---------------- */

const memberSchema = z.object({ userId: z.number().int(), position: z.number().int().min(1).max(5) });
const teamCreate = z.object({
  name: z.string().trim().min(1).max(40),
  members: z.array(memberSchema).max(7).optional(),
});
const teamUpdate = teamCreate.partial();

async function replaceMembers(c, teamId, members) {
  await c.query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
  for (const m of members) {
    await c.query('INSERT INTO team_members (team_id, user_id, position) VALUES ($1, $2, $3)', [
      teamId,
      m.userId,
      m.position,
    ]);
  }
}

router.get('/teams', async (req, res) => {
  const [teams, members] = await Promise.all([
    query('SELECT id, name FROM teams ORDER BY id'),
    query(
      `SELECT tm.team_id, tm.position, u.id AS user_id, u.name
       FROM team_members tm JOIN users u ON u.id = tm.user_id ORDER BY tm.position`
    ),
  ]);
  res.json(
    teams.rows.map((t) => ({
      ...t,
      members: members.rows
        .filter((m) => m.team_id === t.id)
        .map((m) => ({ userId: m.user_id, username: m.name, position: m.position })),
    }))
  );
});

router.post('/teams', async (req, res) => {
  const body = teamCreate.parse(req.body);
  const id = await tx(async (c) => {
    const { rows } = await c.query('INSERT INTO teams (name) VALUES ($1) RETURNING id', [body.name]);
    await replaceMembers(c, rows[0].id, body.members ?? []);
    return rows[0].id;
  });
  await audit(req, 'team.create', { id });
  res.status(201).json({ id });
});

router.put('/teams/:id', async (req, res) => {
  const id = idOf(req);
  const body = teamUpdate.parse(req.body);
  await tx(async (c) => {
    if (body.name) await c.query('UPDATE teams SET name = $2 WHERE id = $1', [id, body.name]);
    if (body.members) await replaceMembers(c, id, body.members);
  });
  await audit(req, 'team.update', { id });
  res.json({ ok: true });
});

router.delete('/teams/:id', async (req, res) => {
  const id = idOf(req);
  const used = await query('SELECT 1 FROM matches WHERE team_a_id = $1 OR team_b_id = $1 LIMIT 1', [id]);
  if (used.rowCount) throw new HttpError(409, 'team_in_bracket');
  await query('DELETE FROM teams WHERE id = $1', [id]);
  await audit(req, 'team.delete', { id });
  res.json({ ok: true });
});

// Сетка из 2–8 команд. Порядок teamIds = посев (первый сильнейший).
router.post('/bracket/generate', async (req, res) => {
  const { teamIds, force } = z
    .object({ teamIds: z.array(z.number().int()).min(2).max(8), force: z.boolean().optional() })
    .parse(req.body);
  if (new Set(teamIds).size !== teamIds.length) throw new HttpError(400, 'duplicate_teams');

  await tx(async (c) => {
    const started = await c.query("SELECT 1 FROM matches WHERE status <> 'pending' LIMIT 1");
    if (started.rowCount && !force) throw new HttpError(409, 'bracket_started');

    await c.query('DELETE FROM matches');
    const plan = buildBracket(teamIds);
    const ids = [];
    for (const m of plan) {
      const { rows } = await c.query(
        'INSERT INTO matches (round, slot, team_a_id, team_b_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [m.round, m.slot, m.a.team ?? null, m.b.team ?? null]
      );
      ids[m.key] = rows[0].id;
    }
    // Связываем матчи: победитель матча-источника попадает в слот следующего
    for (const m of plan) {
      for (const [side, entry] of [['a', m.a], ['b', m.b]]) {
        if (entry.from !== undefined) {
          await c.query('UPDATE matches SET next_match_id = $1, next_slot = $2 WHERE id = $3', [
            ids[m.key],
            side,
            ids[entry.from],
          ]);
        }
      }
    }
  });
  await audit(req, 'bracket.generate', { teamIds });
  res.status(201).json({ ok: true });
});

const matchSchema = z.object({
  scoreA: z.number().int().min(0).max(99).optional(),
  scoreB: z.number().int().min(0).max(99).optional(),
  status: z.enum(['pending', 'live', 'finished']).optional(),
});

// Счёт и статус. status: 'finished' переносит победителя в следующий матч,
// возврат в 'live' отменяет завершение (если следующий матч ещё не начался).
router.patch('/matches/:id', async (req, res) => {
  const id = idOf(req);
  const body = matchSchema.parse(req.body);

  await tx(async (c) => {
    const { rows } = await c.query('SELECT * FROM matches WHERE id = $1 FOR UPDATE', [id]);
    const m = rows[0];
    if (!m) throw new HttpError(404, 'not_found');

    const status = body.status ?? m.status;
    const scoreA = body.scoreA ?? m.score_a;
    const scoreB = body.scoreB ?? m.score_b;

    if (status !== 'pending' && (!m.team_a_id || !m.team_b_id)) throw new HttpError(409, 'teams_not_set');

    let winner = null;
    if (status === 'finished') {
      if (scoreA === scoreB) throw new HttpError(400, 'tie');
      winner = scoreA > scoreB ? m.team_a_id : m.team_b_id;
    }

    if (m.next_match_id && m.winner_id !== winner) {
      const next = await c.query('SELECT status FROM matches WHERE id = $1', [m.next_match_id]);
      if (next.rows[0].status !== 'pending') throw new HttpError(409, 'next_match_started');
    }

    await c.query('UPDATE matches SET status = $2, score_a = $3, score_b = $4, winner_id = $5 WHERE id = $1', [
      id,
      status,
      scoreA,
      scoreB,
      winner,
    ]);
    if (m.next_match_id && m.winner_id !== winner) {
      const col = m.next_slot === 'a' ? 'team_a_id' : 'team_b_id';
      await c.query(`UPDATE matches SET ${col} = $2 WHERE id = $1`, [m.next_match_id, winner]);
    }
  });
  await audit(req, 'match.update', { id, ...body });
  res.json({ ok: true });
});

/* ---------------- Номинации ---------------- */

const nomBase = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300),
  ord: z.number().int(),
  status: z.enum(['draft', 'open', 'closed']),
  nomineeUserIds: z.array(z.number().int()).max(60),
});
const nomCreate = nomBase.partial({ description: true, ord: true, status: true, nomineeUserIds: true });
const nomUpdate = nomBase.partial();

router.get('/nominations', async (req, res) => {
  const [noms, nominees, votes] = await Promise.all([
    query('SELECT * FROM nominations ORDER BY ord, id'),
    query(
      `SELECT n.id, n.nomination_id, n.user_id, u.name FROM nominees n JOIN users u ON u.id = n.user_id ORDER BY u.name`
    ),
    query('SELECT nomination_id, COUNT(*)::int AS n FROM vote_receipts GROUP BY nomination_id'),
  ]);
  res.json(
    noms.rows.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      ord: n.ord,
      status: n.status,
      voters: votes.rows.find((v) => v.nomination_id === n.id)?.n ?? 0,
      nominees: nominees.rows
        .filter((x) => x.nomination_id === n.id)
        .map((x) => ({ id: x.id, userId: x.user_id, username: x.name })),
    }))
  );
});

async function setNominees(c, nominationId, userIds) {
  const votes = await c.query('SELECT 1 FROM vote_receipts WHERE nomination_id = $1 LIMIT 1', [nominationId]);
  if (votes.rowCount) throw new HttpError(409, 'votes_exist');
  await c.query('DELETE FROM nominees WHERE nomination_id = $1', [nominationId]);
  for (const userId of new Set(userIds)) {
    await c.query('INSERT INTO nominees (nomination_id, user_id) VALUES ($1, $2)', [nominationId, userId]);
  }
}

async function assertCanOpen(c, nominationId, status) {
  if (status !== 'open') return;
  const { rows } = await c.query('SELECT COUNT(*)::int AS n FROM nominees WHERE nomination_id = $1', [nominationId]);
  if (rows[0].n < 2) throw new HttpError(400, 'few_nominees');
}

router.post('/nominations', async (req, res) => {
  const b = nomCreate.parse(req.body);
  const id = await tx(async (c) => {
    const { rows } = await c.query(
      'INSERT INTO nominations (title, description, ord, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [b.title, b.description ?? '', b.ord ?? 0, b.status ?? 'draft']
    );
    await setNominees(c, rows[0].id, b.nomineeUserIds ?? []);
    await assertCanOpen(c, rows[0].id, b.status);
    return rows[0].id;
  });
  await audit(req, 'nomination.create', { id });
  res.status(201).json({ id });
});

router.put('/nominations/:id', async (req, res) => {
  const id = idOf(req);
  const b = nomUpdate.parse(req.body);
  await tx(async (c) => {
    const { rows } = await c.query('SELECT 1 FROM nominations WHERE id = $1 FOR UPDATE', [id]);
    if (!rows.length) throw new HttpError(404, 'not_found');
    if (b.nomineeUserIds) await setNominees(c, id, b.nomineeUserIds);
    await c.query(
      `UPDATE nominations SET title = COALESCE($2, title), description = COALESCE($3, description),
         ord = COALESCE($4, ord), status = COALESCE($5, status) WHERE id = $1`,
      [id, b.title ?? null, b.description ?? null, b.ord ?? null, b.status ?? null]
    );
    await assertCanOpen(c, id, b.status);
  });
  await audit(req, 'nomination.update', { id, status: req.body.status });
  res.json({ ok: true });
});

router.delete('/nominations/:id', async (req, res) => {
  const id = idOf(req);
  await query('DELETE FROM nominations WHERE id = $1', [id]);
  await audit(req, 'nomination.delete', { id });
  res.json({ ok: true });
});

// Результаты: только числа и только после закрытия номинации. Кто за кого, в базе нет.
router.get('/nominations/:id/results', async (req, res) => {
  const id = idOf(req);
  const { rows: noms } = await query('SELECT title, status FROM nominations WHERE id = $1', [id]);
  if (!noms.length) throw new HttpError(404, 'not_found');
  if (noms[0].status !== 'closed') throw new HttpError(403, 'not_closed');

  const { rows } = await query(
    `SELECT u.name AS username, u.avatar, COUNT(b.id)::int AS votes
     FROM nominees n
     JOIN users u ON u.id = n.user_id
     LEFT JOIN ballots b ON b.nominee_id = n.id
     WHERE n.nomination_id = $1
     GROUP BY n.id, u.name, u.avatar
     ORDER BY votes DESC, u.name`,
    [id]
  );
  await audit(req, 'nomination.results.view', { id });
  res.json({ title: noms[0].title, total: rows.reduce((s, r) => s + r.votes, 0), results: rows });
});

/* ---------------- Квиз ---------------- */

const qBase = z.object({
  text: z.string().trim().min(1).max(300),
  imageUrl: z.string().url().max(500).nullable(),
  options: z.array(z.string().trim().min(1).max(120)).min(2).max(6),
  correctIdx: z.number().int().min(0),
  timeLimitSec: z.number().int().min(5).max(120),
  ord: z.number().int(),
});
const qCreate = qBase.partial({ imageUrl: true, timeLimitSec: true, ord: true });
const qUpdate = qBase.partial();

async function assertNoAttempts(c) {
  const { rowCount } = await c.query('SELECT 1 FROM quiz_attempts LIMIT 1');
  if (rowCount) throw new HttpError(409, 'attempts_exist');
}

const mapQuestion = (q) => ({
  id: q.id,
  ord: q.ord,
  text: q.text,
  imageUrl: q.image_url,
  options: q.options,
  correctIdx: q.correct_idx,
  timeLimitSec: q.time_limit_sec,
});

router.get('/questions', async (req, res) => {
  const { rows } = await query('SELECT * FROM quiz_questions ORDER BY ord, id');
  res.json(rows.map(mapQuestion));
});

router.post('/questions', async (req, res) => {
  const b = qCreate.parse(req.body);
  if (b.correctIdx >= b.options.length) throw new HttpError(400, 'bad_correct_idx');
  const id = await tx(async (c) => {
    await assertNoAttempts(c);
    const { rows } = await c.query(
      `INSERT INTO quiz_questions (ord, text, image_url, options, correct_idx, time_limit_sec)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6) RETURNING id`,
      [b.ord ?? 0, b.text, b.imageUrl ?? null, JSON.stringify(b.options), b.correctIdx, b.timeLimitSec ?? 20]
    );
    return rows[0].id;
  });
  await audit(req, 'question.create', { id });
  res.status(201).json({ id });
});

router.put('/questions/:id', async (req, res) => {
  const id = idOf(req);
  const b = qUpdate.parse(req.body);
  await tx(async (c) => {
    await assertNoAttempts(c);
    const { rows } = await c.query('SELECT * FROM quiz_questions WHERE id = $1 FOR UPDATE', [id]);
    if (!rows.length) throw new HttpError(404, 'not_found');
    const cur = rows[0];
    const options = b.options ?? cur.options;
    const correctIdx = b.correctIdx ?? cur.correct_idx;
    if (correctIdx >= options.length) throw new HttpError(400, 'bad_correct_idx');
    await c.query(
      `UPDATE quiz_questions SET ord = $2, text = $3, image_url = $4, options = $5::jsonb,
         correct_idx = $6, time_limit_sec = $7 WHERE id = $1`,
      [
        id,
        b.ord ?? cur.ord,
        b.text ?? cur.text,
        b.imageUrl === undefined ? cur.image_url : b.imageUrl,
        JSON.stringify(options),
        correctIdx,
        b.timeLimitSec ?? cur.time_limit_sec,
      ]
    );
  });
  await audit(req, 'question.update', { id });
  res.json({ ok: true });
});

router.delete('/questions/:id', async (req, res) => {
  const id = idOf(req);
  await tx(async (c) => {
    await assertNoAttempts(c);
    await c.query('DELETE FROM quiz_questions WHERE id = $1', [id]);
  });
  await audit(req, 'question.delete', { id });
  res.json({ ok: true });
});

router.get('/attempts', async (req, res) => {
  const { rows } = await query(
    `SELECT a.user_id, u.name, a.score, a.total_ms, a.current_idx, a.finished_at, a.suspicious, a.voided
     FROM quiz_attempts a JOIN users u ON u.id = a.user_id
     ORDER BY a.finished_at DESC NULLS LAST, a.started_at`
  );
  res.json(
    rows.map((a) => ({
      userId: a.user_id,
      username: a.name,
      score: a.score,
      totalMs: a.total_ms,
      index: a.current_idx,
      finished: !!a.finished_at,
      suspicious: a.suspicious,
      voided: a.voided,
    }))
  );
});

router.post('/attempts/:userId/void', async (req, res) => {
  const userId = idOf(req, 'userId');
  const { voided } = z.object({ voided: z.boolean() }).parse(req.body);
  await query('UPDATE quiz_attempts SET voided = $2 WHERE user_id = $1', [userId, voided]);
  await audit(req, voided ? 'attempt.void' : 'attempt.unvoid', { userId });
  res.json({ ok: true });
});

// Сброс попытки конкретного участника (на случай сбоя): он сможет пройти заново
router.delete('/attempts/:userId', async (req, res) => {
  const userId = idOf(req, 'userId');
  await query('DELETE FROM quiz_attempts WHERE user_id = $1', [userId]);
  await audit(req, 'attempt.reset', { userId });
  res.json({ ok: true });
});

// Сброс всех попыток (например, после тестового прогона): ?confirm=yes
router.delete('/attempts', async (req, res) => {
  if (req.query.confirm !== 'yes') throw new HttpError(400, 'confirm_required');
  await query('DELETE FROM quiz_attempts');
  await audit(req, 'attempt.reset_all');
  res.json({ ok: true });
});

export default router;