import crypto from 'crypto';

function safeEqual(value, expected) {
  const a = Buffer.from(String(value || ''));
  const b = Buffer.from(String(expected || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
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

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.ADMIN_PASSWORD || !process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Administration non configurée' });
  }

  const authorization = String(req.headers.authorization || '');
  const password = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!safeEqual(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Accès refusé' });
  }

  try {
    const params = new URLSearchParams({ limit: '100', status: 'complete' });
    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions?${params}`, {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    const payload = await stripeResponse.json();
    if (!stripeResponse.ok) return res.status(502).json({ error: 'Stripe indisponible' });

    const orders = (payload.data || []).map(session => {
      const metadata = session.metadata || {};
      return {
        id: session.id,
        created: session.created,
        product: productLabel(metadata.noelwish_product),
        productId: metadata.noelwish_product || '',
        amount: session.amount_total || 0,
        currency: session.currency || 'eur',
        paymentStatus: session.payment_status || '',
        customerEmail: session.customer_details?.email || '',
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
        shippingName: session.shipping_details?.name || '',
        shippingAddress: session.shipping_details?.address || null
      };
    });

    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return res.status(200).json({ orders });
  } catch {
    return res.status(502).json({ error: 'Impossible de charger les commandes' });
  }
};
