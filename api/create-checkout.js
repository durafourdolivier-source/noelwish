const PRODUCTS = {
  'magic-letter': {
    name: 'Lettre magique NoelWish',
    description: 'Courrier électronique personnalisé pour souhaiter un merveilleux Noël.',
    amount: 199,
    physical: false
  },
  'santa-surprise': {
    name: 'Santa Surprise',
    description: 'Surprise personnalisée. Livraison standard France métropolitaine : 9 €.',
    amount: 2900,
    physical: true
  },
  'big-christmas-box': {
    name: 'Big Christmas Box',
    description: 'Grande box personnalisée. Livraison standard France métropolitaine : 9 €.',
    amount: 6900,
    physical: true
  },
  'donation-10': {
    name: 'Petite étincelle solidaire',
    description: 'Contribution de 10 € au fonds de cadeaux solidaires NoelWish. Aucun reçu fiscal.',
    amount: 1000,
    physical: false
  },
  'donation-25': {
    name: 'Un sourire solidaire',
    description: 'Contribution de 25 € au fonds de cadeaux solidaires NoelWish. Aucun reçu fiscal.',
    amount: 2500,
    physical: false
  },
  'donation-50': {
    name: 'Plus de joie',
    description: 'Contribution de 50 € au fonds de cadeaux solidaires NoelWish. Aucun reçu fiscal.',
    amount: 5000,
    physical: false
  },
  'donation-100': {
    name: 'Grand cœur',
    description: 'Contribution de 100 € au fonds de cadeaux solidaires NoelWish. Aucun reçu fiscal.',
    amount: 10000,
    physical: false
  }
};


const PRICE_TABLE = {
  'magic-letter': { eur: 199, usd: 199, gbp: 169, aud: 299, cad: 299, brl: 1190 },
  'santa-surprise': { eur: 2900, usd: 3200, gbp: 2500, aud: 4900, cad: 4300, brl: 17900 },
  'big-christmas-box': { eur: 6900, usd: 7500, gbp: 5900, aud: 10900, cad: 9900, brl: 42900 },
  'donation-10': { eur: 1000, usd: 1000, gbp: 900, aud: 1500, cad: 1400, brl: 6000 },
  'donation-25': { eur: 2500, usd: 2500, gbp: 2200, aud: 3900, cad: 3500, brl: 15000 },
  'donation-50': { eur: 5000, usd: 5000, gbp: 4300, aud: 7900, cad: 7000, brl: 30000 },
  'donation-100': { eur: 10000, usd: 10000, gbp: 8500, aud: 15900, cad: 14000, brl: 60000 }
};
const MARKET_CONFIG = {
  FR: { currency: 'eur', country: 'FR', shipping: 900 },
  US: { currency: 'usd', country: 'US', shipping: 900 },
  GB: { currency: 'gbp', country: 'GB', shipping: 700 },
  AU: { currency: 'aud', country: 'AU', shipping: 1500 },
  CA: { currency: 'cad', country: 'CA', shipping: 1300 },
  ES: { currency: 'eur', country: 'ES', shipping: 900 },
  DE: { currency: 'eur', country: 'DE', shipping: 900 },
  BR: { currency: 'brl', country: 'BR', shipping: 4900 },
  PT: { currency: 'eur', country: 'PT', shipping: 900 }
};


module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(503).json({ error: 'Stripe is not configured' });

  const productId = req.body?.product;
  const item = PRODUCTS[productId];
  if (!item) return res.status(400).json({ error: 'Unknown product' });
  const marketCode = String(req.body?.market || 'FR').toUpperCase();
  const market = MARKET_CONFIG[marketCode] || MARKET_CONFIG.FR;
  const requestedCurrency = String(req.body?.currency || market.currency).toLowerCase();
  const currency = PRICE_TABLE[productId]?.[requestedCurrency] ? requestedCurrency : market.currency;
  const amount = PRICE_TABLE[productId]?.[currency] || item.amount;

  const origin = 'https://www.noelwish.com';
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${origin}/#gifts`);
  params.set('customer_creation', 'always');
  params.set('billing_address_collection', 'auto');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', currency);
  params.set('line_items[0][price_data][unit_amount]', String(amount));
  params.set('line_items[0][price_data][product_data][name]', item.name);
  params.set('line_items[0][price_data][product_data][description]', item.description);
  params.set('metadata[noelwish_product]', productId);
  params.set('metadata[market]', marketCode);
  params.set('metadata[currency]', currency);
  const details = req.body?.personalization || {};
  const metadata = {
    recipient: details.name,
    delivery_email: details.email,
    sender: details.sender,
    theme: details.choice,
    delivery_date: details.date,
    delivery_time: details.time,
    delivery_at: details.deliveryAt,
    delivery_mode: details.deliveryMode,
    delivery_timezone: details.timezone,
    message: details.message,
    age: details.age,
    preferences: details.preferences,
    avoid: details.avoid
  };
  Object.entries(metadata).forEach(([key, value]) => {
    if (value) params.set(`metadata[${key}]`, String(value).slice(0, 450));
  });

  if (item.physical) {
    params.set('shipping_address_collection[allowed_countries][0]', market.country);
    params.set('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
    params.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]', String(market.shipping));
    params.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]', currency);
    params.set('shipping_options[0][shipping_rate_data][display_name]', 'Standard delivery');
    params.set('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]', 'business_day');
    params.set('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]', '3');
    params.set('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]', 'business_day');
    params.set('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]', '7');
    params.set('metadata[shipping_fee]', String(market.shipping));
    params.set('metadata[shipping_country]', market.country);
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
