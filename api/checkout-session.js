function maskEmail(value = '') {
  const [local = '', domain = ''] = String(value).split('@');
  if (!domain) return '';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'•'.repeat(Math.max(4, local.length - visible.length))}@${domain}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Stripe is not configured' });

  const sessionId = String(req.query?.session_id || '');
  if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  try {
    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } }
    );
    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      return res.status(stripeResponse.status === 404 ? 404 : 502).json({ error: 'Session unavailable' });
    }
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    const metadata = session.metadata || {};
    const deliveryEmail = metadata.delivery_email || session.customer_details?.email || '';

    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return res.status(200).json({
      product: metadata.noelwish_product || '',
      recipient: metadata.recipient || '',
      deliveryEmail: maskEmail(deliveryEmail),
      deliveryMode: metadata.delivery_mode || 'immediate',
      deliveryAt: metadata.delivery_at || '',
      deliveryTimezone: metadata.delivery_timezone || ''
    });
  } catch {
    return res.status(502).json({ error: 'Unable to reach Stripe' });
  }
};
