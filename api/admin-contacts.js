import crypto from 'crypto';
import { listContacts, contactsConfigured } from './_supabase.js';

function safeEqual(value, expected) {
  const a = Buffer.from(String(value || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isAuthorized(req) {
  const authorization = String(req.headers.authorization || '');
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const [body, signature] = token.split('.');
  if (!body || !signature || !process.env.ADMIN_PASSWORD) return false;
  const expected = crypto.createHmac('sha256', process.env.ADMIN_PASSWORD).update(body).digest('base64url');
  if (!safeEqual(signature, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.type === 'session' && Number(payload.exp || 0) >= Date.now();
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Accès refusé' });
  if (!contactsConfigured()) return res.status(503).json({ error: 'Base clients non configurée' });
  try {
    const contacts = await listContacts(1000);
    return res.status(200).json({ contacts });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', route: '/api/admin-contacts', message: error.message }));
    return res.status(502).json({ error: error.message || 'Impossible de charger les contacts' });
  }
}
