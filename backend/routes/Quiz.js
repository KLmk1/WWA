import { Router } from 'express';
import { z } from 'zod';
import { pool, query, tx } from '../db.js';
import { config } from '../config.js';
import { HttpError } from '../lib/errors.js';
import { getSetting } from '../lib/settings.js';

const router = Router();

// Всё время считает сервер. Клиент получает только deadline для отрисовки полосы таймера.

const loadQuestions = async (c = pool) =>
  (
    await c.query(
      'SELECT id, text, image_url, options, correct_idx, time_limit_sec FROM quiz_questions ORDER BY ord, id'
    )
  ).rows;

async function finish(c, attemptId, at) {
  await c.query(
    `UPDATE quiz_attempts a SET finished_at = $2,
       score = COALESCE((SELECT SUM(correct::int) FROM quiz_answers WHERE attempt_id = a.id), 0),
       total_ms = COALESCE((SELECT SUM(elapsed_ms) FROM quiz_answers WHERE attempt_id = a.id), 0)
     WHERE a.id = $1`,
    [attemptId, at]
  );
}

// Если игрок ушёл или завис, просроченные вопросы засчитываются неверными с полным лимитом времени
async function settle(c, attempt, questions) {
  if (attempt.finished_at) return attempt;

  let idx = attempt.current_idx;
  let startedMs = new Date(attempt.question_started_at).getTime();
  const now = Date.now();
  let changed = false;

  while (idx < questions.length) {
    const q = questions[idx];
    const limitMs = q.time_limit_sec * 1000;
    if (now - startedMs < limitMs) break;
    await c.query(
      `INSERT INTO quiz_answers (attempt_id, question_id, answer_idx, correct, elapsed_ms)
       VALUES ($1, $2, NULL, false, $3) ON CONFLICT DO NOTHING`,
      [attempt.id, q.id, limitMs]
    );
    idx += 1;
    startedMs += limitMs;
    changed = true;
  }

  if (!changed && idx < questions.length) return attempt;

  await c.query('UPDATE quiz_attempts SET current_idx = $2, question_started_at = $3 WHERE id = $1', [
    attempt.id,
    idx,
    new Date(startedMs),
  ]);
  if (idx >= questions.length) await finish(c, attempt.id, new Date(now));
  return (await c.query('SELECT * FROM quiz_attempts WHERE id = $1', [attempt.id])).rows[0];
}

// Транзакция с блокировкой попытки пользователя: двойные клики и гонки не ломают состояние
async function withAttempt(userId, { create = false } = {}, fn) {
  return tx(async (c) => {
    const questions = await loadQuestions(c);
    if (create) {
      const now = new Date();
      await c.query(
        `INSERT INTO quiz_attempts (user_id, started_at, question_started_at)
         VALUES ($1, $2, $2) ON CONFLICT (user_id) DO NOTHING`,
        [userId, now]
      );
    }
    let attempt = (await c.query('SELECT * FROM quiz_attempts WHERE user_id = $1 FOR UPDATE', [userId])).rows[0];
    if (attempt) attempt = await settle(c, attempt, questions);
    return fn(c, attempt, questions);
  });
}

// Текущее состояние. Правильные ответы клиенту не отправляются никогда.
function statePayload(attempt, questions) {
  if (attempt.finished_at || attempt.current_idx >= questions.length) return { finished: true };
  const q = questions[attempt.current_idx];
  const startedMs = new Date(attempt.question_started_at).getTime();
  return {
    finished: false,
    index: attempt.current_idx,
    total: questions.length,
    question: { id: q.id, text: q.text, imageUrl: q.image_url, options: q.options },
    deadline: new Date(startedMs + q.time_limit_sec * 1000).toISOString(),
    serverNow: new Date().toISOString(),
  };
}

const rankSql = `
  SELECT a.user_id, a.score, a.total_ms, u.name, u.avatar,
         ROW_NUMBER() OVER (ORDER BY a.score DESC, a.total_ms ASC, a.started_at ASC)::int AS place
  FROM quiz_attempts a JOIN users u ON u.id = a.user_id
  WHERE a.finished_at IS NOT NULL AND NOT a.voided`;

router.get('/quiz/status', async (req, res) => {
  const [open, leaderboardPublic] = await Promise.all([
    getSetting('quiz_open', false),
    getSetting('leaderboard_public', false),
  ]);
  const out = await withAttempt(req.user.id, {}, async (c, attempt, questions) => {
    let a = null;
    if (attempt) {
      a = attempt.finished_at
        ? { status: 'finished', score: attempt.score, total: questions.length, totalMs: attempt.total_ms }
        : { status: 'in_progress', index: attempt.current_idx };
    }
    return { questionCount: questions.length, attempt: a };
  });
  res.json({ open, leaderboardPublic, ...out });
});

// Идемпотентно: повторный вызов возвращает ту же попытку
router.post('/quiz/start', async (req, res) => {
  if (!(await getSetting('quiz_open', false))) throw new HttpError(403, 'quiz_closed');
  const state = await withAttempt(req.user.id, { create: true }, async (c, attempt, questions) => {
    if (questions.length === 0) throw new HttpError(409, 'no_questions');
    return statePayload(attempt, questions);
  });
  res.json(state);
});

router.get('/quiz/current', async (req, res) => {
  const state = await withAttempt(req.user.id, {}, async (c, attempt, questions) => {
    if (!attempt) throw new HttpError(404, 'no_attempt');
    return statePayload(attempt, questions);
  });
  res.json(state);
});

const answerSchema = z.object({ questionId: z.number().int(), answerIdx: z.number().int().min(0) });

router.post('/quiz/answer', async (req, res) => {
  const { questionId, answerIdx } = answerSchema.parse(req.body);
  if (!(await getSetting('quiz_open', false))) throw new HttpError(403, 'quiz_closed');

  const result = await withAttempt(req.user.id, {}, async (c, attempt, questions) => {
    if (!attempt) throw new HttpError(409, 'no_attempt');
    if (attempt.finished_at || attempt.current_idx >= questions.length) {
      return { status: 200, body: { finished: true } };
    }
    const q = questions[attempt.current_idx];

    // Клиент отстал (например, время вышло и сервер уже перешёл дальше): отдаём актуальное состояние
    if (q.id !== questionId) {
      return { status: 409, body: { error: 'stale', ...statePayload(attempt, questions) } };
    }
    if (answerIdx >= q.options.length) throw new HttpError(400, 'bad_answer');

    const now = new Date();
    const limitMs = q.time_limit_sec * 1000;
    const elapsed = Math.min(limitMs, Math.max(0, now.getTime() - new Date(attempt.question_started_at).getTime()));
    const correct = answerIdx === q.correct_idx;

    await c.query(
      `INSERT INTO quiz_answers (attempt_id, question_id, answer_idx, correct, elapsed_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [attempt.id, q.id, answerIdx, correct, elapsed]
    );
    if (correct && elapsed < config.quiz.minAnswerMs) {
      await c.query('UPDATE quiz_attempts SET suspicious = true WHERE id = $1', [attempt.id]);
    }

    const nextIdx = attempt.current_idx + 1;
    await c.query('UPDATE quiz_attempts SET current_idx = $2, question_started_at = $3 WHERE id = $1', [
      attempt.id,
      nextIdx,
      now,
    ]);
    if (nextIdx >= questions.length) await finish(c, attempt.id, now);

    const fresh = (await c.query('SELECT * FROM quiz_attempts WHERE id = $1', [attempt.id])).rows[0];
    return { status: 200, body: statePayload(fresh, questions) };
  });

  res.status(result.status).json(result.body);
});

router.get('/quiz/my-result', async (req, res) => {
  const isPublic = await getSetting('leaderboard_public', false);
  const out = await withAttempt(req.user.id, {}, async (c, attempt, questions) => {
    if (!attempt || !attempt.finished_at) throw new HttpError(404, 'no_result');
    let rank = null;
    if (isPublic && !attempt.voided) {
      const { rows } = await c.query(`SELECT place FROM (${rankSql}) t WHERE user_id = $1`, [req.user.id]);
      rank = rows[0]?.place ?? null;
    }
    return { score: attempt.score, total: questions.length, totalMs: attempt.total_ms, rank };
  });
  res.json(out);
});

router.get('/quiz/leaderboard', async (req, res) => {
  const isPublic = await getSetting('leaderboard_public', false);
  if (!isPublic && !req.user.isAdmin) return res.json({ hidden: true, rows: [], me: null });

  const { rows } = await query(`SELECT * FROM (${rankSql}) t ORDER BY place`);
  const toRow = (r) => ({
    place: r.place,
    username: r.name,
    avatar: r.avatar,
    score: r.score,
    totalMs: r.total_ms,
    isMe: r.user_id === req.user.id,
  });
  const me = rows.find((r) => r.user_id === req.user.id);
  res.json({
    hidden: false,
    rows: rows.slice(0, 50).map(toRow),
    me: me && me.place > 50 ? toRow(me) : null,
  });
});

export default router;