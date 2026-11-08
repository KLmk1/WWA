import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { config } from './config.js';
import { pool, query } from './db.js';
import { HttpError } from './lib/errors.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import meRouter from './routes/me.js';
import cupRouter from './routes/cup.js';
import awardsRouter from './routes/awards.js';
import quizRouter from './routes/quiz.js';
import adminRouter from './routes/admin.js';

const allowedOrigin = new URL(config.frontendUrl).origin;

// Защита от CSRF поверх SameSite=Lax: запросы с чужого Origin отклоняем
function originCheck(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== allowedOrigin) return res.status(403).json({ error: 'bad_origin' });
  next();
}

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // за Caddy / nginx: нужно для secure-cookie
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));

  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({ pool, createTableIfMissing: true }),
      name: 'ww.sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.isProd, // в проде нужен https
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );
  app.use(originCheck);

  app.get('/health', async (req, res) => {
    await query('SELECT 1');
    res.json({ ok: true });
  });

  // Вход: мягкий лимит по IP
  app.use('/auth', rateLimit({ windowMs: 60_000, limit: 30 }), authRouter);

  // API: только для вошедших, лимит по пользователю (общий Wi-Fi не заденет остальных)
  const api = express.Router();
  api.use(requireAuth);
  api.use(rateLimit({ windowMs: 60_000, limit: 240, keyGenerator: (req) => `u${req.user.id}` }));
  api.use(meRouter);
  api.use(cupRouter);
  api.use(awardsRouter);
  api.use(quizRouter);
  api.use('/admin', requireAdmin, adminRouter);
  app.use('/api', api);

  app.use((req, res) => res.status(404).json({ error: 'not_found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err instanceof ZodError) return res.status(400).json({ error: 'bad_request', details: err.issues });
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.code });
    if (err?.code === '23505') return res.status(409).json({ error: 'conflict' });
    if (err?.code === '23503') return res.status(409).json({ error: 'reference_error' });
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}