import crypto from 'crypto';

const ALLOWED_STATUSES = new Set(['new', 'scheduled', 'preparing', 'ready', 'shipped', 'completed', 'cancelled', 'refunded']);

function safeEqual(value, expected) {
  const a = Buffer.from(String(value || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isAuthorized(req) {
  const authorization = String(req.headers.authorization || '');
  const password = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  return Boolean(process.env.ADMIN_PASSWORD) && safeEqual(password, process.env.ADMIN_PASSWORD);
}

function productLabel(id) {
  return {
    'magic-letter': 'Lettre magique',
    'santa-surprise': 'Santa Surprise',
    'big-christmas-box': 'Big Christmas Box',
    'donation-10': 'Don solidaire 10 €',
    'donation-25': 'Don solidaire 25 €',
    'donation-50': 'Don solidaire 50 €',
    'donation-100': 'Don solidaire 100 €'
  }[id] || id || 'Commande NoelWish';
}

function defaultStatus(productId, metadata) {
  if (metadata.fulfillment_status) return metadata.fulfillment_status;
  if (productId === 'magic-letter') return metadata.delivery_mode === 'scheduled' ? 'scheduled' : 'completed';
  if (productId?.startsWith('donation-')) return 'completed';
  return 'new';
}

async function stripeRequest(path, options = {}) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...(options.headers || {})
    }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || 'Stripe indisponible');
  return payload;
}

module.exports = async function handler(req, res) {
  if (!process.env.ADMIN_PASSWORD || !process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Administration non configurée' });
  }
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Accès refusé' });
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');

  try {
    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const id = String(body.id || '');
      const status = String(body.status || '');
      if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return res.status(400).json({ error: 'Commande invalide' });
      if (!ALLOWED_STATUSES.has(status)) return res.status(400).json({ error: 'Statut invalide' });

      const params = new URLSearchParams();
      params.set('metadata[fulfillment_status]', status);
      params.set('metadata[tracking_number]', String(body.tracking || '').slice(0, 180));
      params.set('metadata[admin_note]', String(body.note || '').slice(0, 450));

      const session = await stripeRequest(`/checkout/sessions/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      return res.status(200).json({
        ok: true,
        status: session.metadata?.fulfillment_status || status,
        tracking: session.metadata?.tracking_number || '',
        note: session.metadata?.admin_note || ''
      });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const params = new URLSearchParams({ limit: '100', status: 'complete' });
    const payload = await stripeRequest(`/checkout/sessions?${params}`);
    const orders = (payload.data || []).map(session => {
      const metadata = session.metadata || {};
      const productId = metadata.noelwish_product || '';
      const shipping = session.collected_information?.shipping_details || session.shipping_details || {};
      return {
        id: session.id,
        created: session.created,
        product: productLabel(productId),
        productId,
        amount: session.amount_total || 0,
        currency: session.currency || 'eur',
        paymentStatus: session.payment_status || '',
        status: defaultStatus(productId, metadata),
        customerName: session.customer_details?.name || '',
        customerEmail: session.customer_details?.email || '',
        customerPhone: session.customer_details?.phone || '',
        recipient: metadata.recipient || '',
        deliveryEmail: metadata.delivery_email || '',
        sender: metadata.sender || '',
        theme: metadata.theme || '',
        age: metadata.age || '',
        preferences: metadata.preferences || '',
        avoid: metadata.avoid || '',
        message: metadata.message || '',
        deliveryMode: metadata.delivery_mode || '',
        deliveryAt: metadata.delivery_at || '',
        market: metadata.market || '',
        shippingName: shipping.name || '',
        shippingAddress: shipping.address || null,
        tracking: metadata.tracking_number || '',
        note: metadata.admin_note || '',
        paymentIntent: session.payment_intent || '',
        livemode: Boolean(session.livemode)
      };
    });
    return res.status(200).json({ orders, hasMore: Boolean(payload.has_more) });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', route: '/api/admin-orders', message: error.message }));
    return res.status(502).json({ error: error.message || 'Impossible de gérer les commandes' });
  }
};
