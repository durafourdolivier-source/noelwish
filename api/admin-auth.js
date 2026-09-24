import crypto from 'crypto';

const attempts = new Map();
const recoveries = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;

function safeEqual(value, expected) {
  const a = Buffer.from(String(value || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(payload) {
  const body = encode(payload);
  const signature = crypto.createHmac('sha256', process.env.ADMIN_PASSWORD).update(body).digest('base64url');
  return body + '.' + signature;
}

function verify(token, type) {
  const [body, signature] = String(token || '').split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', process.env.ADMIN_PASSWORD).update(body).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.type !== type || Number(payload.exp || 0) < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function clientKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.headers['x-real-ip'] || 'unknown');
}

async function sendEmail({ subject, html }) {
  if (!process.env.RESEND_API_KEY) throw new Error('Service e-mail non configuré');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Sécurité NoelWish <security@noelwish.com>',
      to: ['magic@noelwish.com'],
      subject,
      html
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error('Échec e-mail : ' + detail.slice(0, 180));
  }
}

function cleanExpired() {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  for (const [key, expires] of recoveries) if (expires <= now) recoveries.delete(key);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ADMIN_PASSWORD) return res.status(503).json({ error: 'Administration non configurée' });

  cleanExpired();
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const action = String(body.action || '');
  const key = clientKey(req);

  try {
    if (action === 'login') {
      const state = attempts.get(key);
      if (state?.blockedUntil > Date.now()) {
        return res.status(429).json({
          error: 'Accès temporairement bloqué. Un e-mail de sécurité a été envoyé.',
          retryAfter: Math.ceil((state.blockedUntil - Date.now()) / 1000)
        });
      }

      if (!safeEqual(body.password, process.env.ADMIN_PASSWORD)) {
        const next = state && state.expires > Date.now()
          ? { ...state, count: state.count + 1 }
          : { count: 1, expires: Date.now() + WINDOW_MS, alerted: false, blockedUntil: 0 };

        if (next.count >= MAX_ATTEMPTS) {
          next.blockedUntil = Date.now() + WINDOW_MS;
          if (!next.alerted) {
            next.alerted = true;
            sendEmail({
              subject: 'Alerte de connexion à l’administration NoelWish',
              html: '<div style="font-family:Arial,sans-serif;color:#2f1919"><h2>Trois tentatives de connexion incorrectes</h2><p>L’accès à l’administration a été bloqué pendant 15 minutes.</p><p><b>Adresse réseau :</b> ' + key.replace(/[<>&"]/g, '') + '<br><b>Date :</b> ' + new Date().toISOString() + '</p><p>Si ce n’était pas toi, change le mot de passe administrateur dans Vercel.</p></div>'
            }).catch(error => console.error('Admin alert email failed:', error.message));
          }
        }
        attempts.set(key, next);
        const remaining = Math.max(0, MAX_ATTEMPTS - next.count);
        return res.status(next.blockedUntil ? 429 : 401).json({
          error: next.blockedUntil
            ? 'Accès bloqué pendant 15 minutes. Une alerte a été envoyée.'
            : 'Mot de passe incorrect. ' + remaining + ' tentative' + (remaining > 1 ? 's' : '') + ' restante' + (remaining > 1 ? 's' : '') + '.'
        });
      }

      attempts.delete(key);
      return res.status(200).json({
        token: sign({ type: 'session', exp: Date.now() + 12 * 60 * 60 * 1000 })
      });
    }

    if (action === 'forgot') {
      if (recoveries.get(key) > Date.now()) {
        return res.status(429).json({ error: 'Un code a déjà été envoyé. Patiente quelques minutes.' });
      }
      const code = String(crypto.randomInt(100000, 1000000));
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      const challenge = sign({ type: 'recovery', codeHash, exp: Date.now() + 10 * 60 * 1000 });
      await sendEmail({
        subject: 'Ton code de récupération NoelWish',
        html: '<div style="font-family:Arial,sans-serif;color:#2f1919;text-align:center;padding:24px"><p style="color:#8d1523;letter-spacing:2px">NOELWISH · ADMINISTRATION</p><h2>Code de récupération</h2><p>Utilise ce code dans les 10 prochaines minutes :</p><div style="font-size:34px;font-weight:800;letter-spacing:8px;background:#fff0cc;border-radius:14px;padding:18px">' + code + '</div><p>Si tu n’as rien demandé, ignore cet e-mail.</p></div>'
      });
      recoveries.set(key, Date.now() + 2 * 60 * 1000);
      return res.status(200).json({ challenge, sent: true });
    }

    if (action === 'recover') {
      const challenge = verify(body.challenge, 'recovery');
      const codeHash = crypto.createHash('sha256').update(String(body.code || '')).digest('hex');
      if (!challenge || !safeEqual(codeHash, challenge.codeHash)) {
        return res.status(401).json({ error: 'Code invalide ou expiré.' });
      }
      attempts.delete(key);
      return res.status(200).json({
        token: sign({ type: 'session', exp: Date.now() + 12 * 60 * 60 * 1000 })
      });
    }

    return res.status(400).json({ error: 'Action invalide' });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', route: '/api/admin-auth', message: error.message }));
    return res.status(502).json({ error: 'Impossible de traiter la demande pour le moment.' });
  }
};
