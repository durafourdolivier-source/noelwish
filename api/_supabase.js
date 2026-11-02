const CONTACT_FIELDS = 'id,email,customer_name,recipient_name,sender_name,phone,product_id,lifecycle,funnel_stage,language,market,currency,source,flow_id,stripe_session_id,stripe_customer_id,shipping_country,shipping_city,order_count,total_spent_minor,first_seen_at,last_seen_at,purchased_at,marketing_consent';

function configuration() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  if (!url || !key) return null;
  return { url, key };
}

async function request(path, options = {}) {
  const config = configuration();
  if (!config) throw new Error('Base clients non configurée');
  const response = await fetch(config.url + '/rest/v1/' + path, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: 'Bearer ' + config.key,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(payload?.message || payload?.error || 'Base clients indisponible');
  return payload;
}

function clean(value, max = 160) {
  return String(value || '').trim().slice(0, max) || null;
}

export function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim()) && String(value).length <= 320;
}

export async function upsertContact(input) {
  const email = String(input.email || '').trim().toLowerCase();
  if (!validEmail(email)) throw new Error('Adresse e-mail invalide');
  const now = new Date().toISOString();
  const record = {
    email,
    customer_name: clean(input.customerName),
    recipient_name: clean(input.recipientName),
    sender_name: clean(input.senderName),
    phone: clean(input.phone, 40),
    product_id: clean(input.productId, 80),
    lifecycle: input.lifecycle === 'customer' ? 'customer' : 'lead',
    funnel_stage: clean(input.funnelStage, 80) || 'email_captured',
    language: clean(input.language, 8),
    market: clean(input.market, 8),
    currency: clean(input.currency, 8),
    source: clean(input.source, 80) || 'website',
    flow_id: clean(input.flowId, 120),
    stripe_session_id: clean(input.stripeSessionId, 180),
    stripe_customer_id: clean(input.stripeCustomerId, 180),
    shipping_country: clean(input.shippingCountry, 8),
    shipping_city: clean(input.shippingCity, 120),
    last_seen_at: now,
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {}
  };
  if (record.lifecycle === 'customer') {
    record.purchased_at = input.purchasedAt || now;
    record.order_count = Math.max(1, Number(input.orderCount || 1));
    record.total_spent_minor = Math.max(0, Number(input.totalSpentMinor || 0));
  }
  Object.keys(record).forEach(key => record[key] === null && delete record[key]);
  return request('noelwish_contacts?on_conflict=email_normalized', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(record)
  });
}

export async function listContacts(limit = 1000) {
  return request(`noelwish_contacts?select=${CONTACT_FIELDS}&order=last_seen_at.desc&limit=${Math.min(Math.max(limit, 1), 2000)}`);
}

export function contactsConfigured() {
  return Boolean(configuration());
}
