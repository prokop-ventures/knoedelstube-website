import express from 'express';
import rateLimit from 'express-rate-limit';
import { sendMail } from './mail.mjs';
import { renderContact, renderReservation } from './templates.mjs';

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PER_HOUR ?? 5),
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const isHoneypotTriggered = (body) => Boolean(body?.botcheck);
const nonEmpty = (s) => typeof s === 'string' && s.trim().length > 0;
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s ?? '');

app.post('/api/contact', limiter, async (req, res) => {
  if (isHoneypotTriggered(req.body)) return res.json({ ok: true });

  const name = String(req.body.name ?? '').trim();
  const email = String(req.body.email ?? '').trim();
  const betreff = String(req.body.betreff ?? '').trim();
  const nachricht = String(req.body.nachricht ?? '').trim();

  if (!nonEmpty(name) || !isEmail(email) || !nonEmpty(betreff)) {
    return res.status(400).json({ ok: false, error: 'invalid_input' });
  }

  const mail = renderContact({ name, email, betreff, nachricht });
  try {
    await sendMail({ ...mail, replyTo: `"${name}" <${email}>` });
    res.json({ ok: true });
  } catch (err) {
    console.error('contact send failed', err);
    res.status(502).json({ ok: false, error: 'send_failed' });
  }
});

app.post('/api/reservation', limiter, async (req, res) => {
  if (isHoneypotTriggered(req.body)) return res.json({ ok: true });

  const name = String(req.body.name ?? '').trim();
  const email = String(req.body.email ?? '').trim();
  const telefon = String(req.body.telefon ?? '').trim();
  const personen = String(req.body.personen ?? '').trim();
  const uhrzeit = String(req.body.uhrzeit ?? '').trim();
  const datum = String(req.body.datum ?? '').trim();
  const nachricht = String(req.body.nachricht ?? '').trim();

  if (!nonEmpty(name) || !isEmail(email) || !nonEmpty(datum) || !nonEmpty(uhrzeit) || !nonEmpty(personen)) {
    return res.status(400).json({ ok: false, error: 'invalid_input' });
  }

  const mail = renderReservation({ name, email, telefon, personen, uhrzeit, datum, nachricht });
  try {
    await sendMail({ ...mail, replyTo: `"${name}" <${email}>` });
    res.json({ ok: true });
  } catch (err) {
    console.error('reservation send failed', err);
    res.status(502).json({ ok: false, error: 'send_failed' });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`knoedel-mail listening on :${port}`));
