import { upsertContact, validEmail, contactsConfigured } from './_supabase.js';

const ALLOWED_PRODUCTS = new Set(['magic-letter', 'santa-surprise', 'big-christmas-box']);
const ALLOWED_STAGES = new Set(['email_captured', 'personalization_started', 'personalization_completed', 'checkout_requested']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!contactsConfigured()) return res.status(503).json({ error: 'Contact storage unavailable' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (!validEmail(body.email)) return res.status(400).json({ error: 'Invalid email' });
  const productId = ALLOWED_PRODUCTS.has(body.productId) ? body.productId : '';
  const funnelStage = ALLOWED_STAGES.has(body.funnelStage) ? body.funnelStage : 'email_captured';
  try {
    await upsertContact({
      email: body.email,
      recipientName: body.recipientName,
      senderName: body.senderName,
      productId,
      funnelStage,
      language: body.language,
      market: body.market,
      currency: body.currency,
      source: 'gift_personalization',
      flowId: body.flowId,
      metadata: { delivery_mode: String(body.deliveryMode || '').slice(0, 40) }
    });
    return res.status(200).json({ saved: true });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', route: '/api/capture-lead', message: error.message }));
    return res.status(502).json({ error: 'Contact storage failed' });
  }
}
