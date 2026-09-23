const PRODUCTS = {
  'magic-letter': {
    name: 'Lettre magique NoelWish',
    description: 'Courrier électronique personnalisé pour souhaiter un merveilleux Noël.',
    amount: 199,
    physical: false
  },
  'santa-surprise': {
    name: 'Santa Surprise',
    description: 'Surprise de Noël personnalisée selon les goûts du destinataire.',
    amount: 2900,
    physical: true
  },
  'big-christmas-box': {
    name: 'Big Christmas Box',
    description: 'Grande sélection de surprises de Noël personnalisées.',
    amount: 6900,
    physical: true
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Stripe is not configured' });

  const item = PRODUCTS[req.body?.product];
  if (!item) return res.status(400).json({ error: 'Unknown product' });

  const origin = 'https://www.noelwish.com';
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/#gifts`);
  params.set('customer_creation', 'always');
  params.set('billing_address_collection', 'auto');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'eur');
  params.set('line_items[0][price_data][unit_amount]', String(item.amount));
  params.set('line_items[0][price_data][product_data][name]', item.name);
  params.set('line_items[0][price_data][product_data][description]', item.description);
  params.set('metadata[noelwish_product]', req.body.product);
  const details = req.body?.personalization || {};
  const metadata = {
    recipient: details.name,
    delivery_email: details.email,
    sender: details.sender,
    theme: details.choice,
    delivery_date: details.date
  };
  Object.entries(metadata).forEach(([key, value]) => {
    if (value) params.set(`metadata[${key}]`, String(value).slice(0, 450));
  });

  if (item.physical) {
    ['FR', 'BE', 'CH', 'DE', 'ES', 'IT', 'PT', 'GB', 'AU', 'CA', 'US'].forEach((country, index) => {
      params.set(`shipping_address_collection[allowed_countries][${index}]`, country);
    });
  }

  try {
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    const session = await stripeResponse.json();
    if (!stripeResponse.ok) return res.status(502).json({ error: session.error?.message || 'Stripe error' });
    return res.status(200).json({ url: session.url });
  } catch {
    return res.status(502).json({ error: 'Unable to reach Stripe' });
  }
};
