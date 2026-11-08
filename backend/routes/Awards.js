import { Router } from 'express';
import { z } from 'zod';
import { query, tx } from '../db.js';
import { HttpError } from '../lib/errors.js';

const router = Router();

router.get('/awards', async (req, res) => {
  const [noms, nominees, voted] = await Promise.all([
    query("SELECT id, title, description, status FROM nominations WHERE status <> 'draft' ORDER BY ord, id"),
    query(
      `SELECT n.id, n.nomination_id, n.user_id, u.name, u.avatar
       FROM nominees n JOIN users u ON u.id = n.user_id ORDER BY u.name`
    ),
    query('SELECT nomination_id FROM vote_receipts WHERE user_id = $1', [req.user.id]),
  ]);
  const votedSet = new Set(voted.rows.map((r) => r.nomination_id));

  const nominations = noms.rows.map((n) => ({
    id: n.id,
    title: n.title,
    description: n.description,
    status: n.status,
    voted: votedSet.has(n.id),
    nominees: nominees.rows
      .filter((x) => x.nomination_id === n.id)
      .map((x) => ({ id: x.id, username: x.name, avatar: x.avatar, isSelf: x.user_id === req.user.id })),
  }));

  // Общий статус раздела. Результатов здесь нет ни у кого, кроме админа.
  let status = 'not_open';
  if (nominations.some((n) => n.status === 'open')) status = 'open';
  else if (nominations.length && nominations.every((n) => n.status === 'closed')) status = 'closed';

  res.json({ status, nominations });
});

const voteSchema = z.object({ nomineeId: z.number().int() });

router.post('/awards/:id/vote', async (req, res) => {
  const nominationId = z.coerce.number().int().positive().parse(req.params.id);
  const { nomineeId } = voteSchema.parse(req.body);

  await tx(async (c) => {
    const { rows: noms } = await c.query('SELECT status FROM nominations WHERE id = $1 FOR SHARE', [nominationId]);
    if (!noms.length) throw new HttpError(404, 'not_found');
    if (noms[0].status !== 'open') throw new HttpError(403, 'nomination_closed');

    const { rows: nominees } = await c.query(
      'SELECT id, user_id FROM nominees WHERE id = $1 AND nomination_id = $2',
      [nomineeId, nominationId]
    );
    if (!nominees.length) throw new HttpError(400, 'bad_nominee');
    if (nominees[0].user_id === req.user.id) throw new HttpError(400, 'self_vote');

    // Первичный ключ (user_id, nomination_id) не даст проголосовать дважды
    const receipt = await c.query(
      `INSERT INTO vote_receipts (user_id, nomination_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING RETURNING user_id`,
      [req.user.id, nominationId]
    );
    if (receipt.rowCount === 0) throw new HttpError(409, 'already_voted');

    // Сам выбор пишем без user_id и без времени
    await c.query('INSERT INTO ballots (nomination_id, nominee_id) VALUES ($1, $2)', [nominationId, nomineeId]);
  });

  res.status(201).json({ ok: true });
});

export default router;