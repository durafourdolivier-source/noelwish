const ALLOWED_EVENTS = new Set([
  'page_view_enhanced', 'section_view', 'view_item_list',
  'personalization_started', 'personalization_step_viewed',
  'personalization_step_completed', 'personalization_completed',
  'personalization_abandoned', 'checkout_requested', 'begin_checkout',
  'checkout_created', 'checkout_cancelled', 'checkout_error',
  'engaged_time', 'session_end'
]);

const clean = (value, max = 160) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

function cleanNumber(value, min = 0, max = 86400) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : null;
}

function cleanEvent(input) {
  const eventName = clean(input?.event_name, 40);
  const eventId = clean(input?.event_id, 160);
  const visitorId = clean(input?.visitor_id, 160);
  const sessionId = clean(input?.session_id, 160);
  if (!eventId || !visitorId || !sessionId || !ALLOWED_EVENTS.has(eventName)) return null;
  const occurredAt = new Date(input?.occurred_at || Date.now());
  const safeOccurredAt = Math.abs(Date.now() - occurredAt.getTime()) <= 24 * 60 * 60 * 1000
    ? occurredAt.toISOString()
    : new Date().toISOString();
  const metadata = input?.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
    ? Object.fromEntries(Object.entries(input.metadata).slice(0, 12).map(([key, value]) => [clean(key, 40), clean(value, 120)]).filter(([key, value]) => key && value))
    : {};
  return {
    event_id: eventId,
    event_name: eventName,
    occurred_at: safeOccurredAt,
    visitor_id: visitorId,
    session_id: sessionId,
    flow_id: clean(input.flow_id, 160),
    page_path: clean(input.page_path, 240),
    page_hash: clean(input.page_hash, 80),
    referrer_host: clean(input.referrer_host, 160),
    language: clean(input.language, 8),
    market: clean(input.market, 8),
    currency: clean(input.currency, 8),
    device_type: clean(input.device_type, 16),
    product_id: clean(input.product_id, 80),
    stage: clean(input.stage, 80),
    stage_sequence: cleanNumber(input.stage_sequence, 0, 100),
    duration_seconds: cleanNumber(input.duration_seconds),
    metadata
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  if (!url || !key) return res.status(503).json({error:'Analytics storage unavailable'});
  const source = Array.isArray(req.body?.events) ? req.body.events.slice(0, 20) : [];
  const events = source.map(cleanEvent).filter(Boolean);
  if (!events.length) return res.status(202).json({accepted:0});
  const response = await fetch(url + '/rest/v1/noelwish_funnel_events?on_conflict=event_id', {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal'
    },
    body: JSON.stringify(events)
  });
  if (!response.ok) {
    console.error(JSON.stringify({level:'error',route:'/api/track-event',status:response.status}));
    return res.status(502).json({error:'Analytics storage failed'});
  }
  return res.status(202).json({accepted:events.length});
};
