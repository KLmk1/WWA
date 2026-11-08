import { Router } from 'express';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';
import { query } from '../db.js';

const router = Router();
const client = new OAuth2Client(config.google.clientId, config.google.clientSecret, config.google.redirectUri);

const saveSession = (req) => new Promise((resolve, reject) => req.session.save((e) => (e ? reject(e) : resolve())));
const regenerate = (req) => new Promise((resolve, reject) => req.session.regenerate((e) => (e ? reject(e) : resolve())));

const fail = (res, code) => res.redirect(`/login?error=${code}`);

// 1. Отправляем пользователя в Google
router.get('/google', async (req, res) => {
  const state = crypto.randomBytes(24).toString('hex');
  req.session.oauthState = state;
  await saveSession(req);
  res.redirect(
    client.generateAuthUrl({
      scope: ['openid', 'email', 'profile'],
      state,
      prompt: 'select_account',
    })
  );
});

// 2. Google возвращает пользователя сюда с кодом
router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return fail(res, 'access_denied');

  const expected = req.session.oauthState;
  delete req.session.oauthState;
  if (typeof code !== 'string' || typeof state !== 'string' || !expected || state !== expected) {
    return fail(res, 'state_mismatch');
  }

  let payload;
  try {
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: config.google.clientId });
    payload = ticket.getPayload();
  } catch (err) {
    console.error('Google auth error:', err.message);
    return fail(res, 'auth_failed');
  }

  if (!payload?.email || !payload.email_verified) return fail(res, 'email_not_verified');
  const email = payload.email.toLowerCase();

  // Белый список: если задан, регистрируются только свои (админы допускаются всегда)
  const isAdmin = config.adminEmails.includes(email);
  if (config.allowedEmails.length && !isAdmin && !config.allowedEmails.includes(email)) {
    return fail(res, 'not_allowed');
  }

  // Регистрация = первый вход: аккаунт создаётся автоматически
  const { rows } = await query(
    `INSERT INTO users (google_sub, email, name, avatar)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (google_sub) DO UPDATE
       SET email = EXCLUDED.email, name = EXCLUDED.name, avatar = EXCLUDED.avatar, last_login_at = now()
     RETURNING id, is_blocked`,
    [payload.sub, email, payload.name || email.split('@')[0], payload.picture ?? null]
  );
  const user = rows[0];
  if (user.is_blocked) return fail(res, 'blocked');

  // Новая сессия после входа (защита от фиксации сессии)
  await regenerate(req);
  req.session.userId = user.id;
  await saveSession(req);
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('ww.sid');
    res.json({ ok: true });
  });
});

export default router;