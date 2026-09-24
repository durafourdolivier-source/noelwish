import crypto from 'crypto';

const ALLOWED_STATUSES = new Set(['new', 'scheduled', 'preparing', 'ready', 'shipped', 'completed', 'cancelled', 'refunded']);

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
  } catch {
    return false;
  }
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


const SHIPPING_COPY = {
  fr: {
    subject: 'Le traîneau est en route !',
    preview: 'Bonne nouvelle : ta surprise NoelWish vient d’être expédiée.',
    title: 'Le traîneau est en route !',
    intro: 'Bonne nouvelle : les lutins ont terminé de préparer la surprise et le Père Noël l’a confiée à son traîneau.',
    tracking: 'Suivi du colis',
    button: 'Suivre le traîneau',
    footer: 'La date d’arrivée dépend maintenant du transporteur et de la destination.'
  },
  en: {
    subject: 'Santa’s sleigh is on its way!',
    preview: 'Good news: your NoelWish surprise has been shipped.',
    title: 'Santa’s sleigh is on its way!',
    intro: 'Good news: the elves have finished preparing the surprise and Santa has placed it aboard his sleigh.',
    tracking: 'Parcel tracking',
    button: 'Track the sleigh',
    footer: 'The arrival date now depends on the carrier and destination.'
  },
  es: {
    subject: '¡El trineo ya está en camino!',
    preview: 'Buenas noticias: tu sorpresa NoelWish ha sido enviada.',
    title: '¡El trineo ya está en camino!',
    intro: 'Buenas noticias: los elfos han terminado de preparar la sorpresa y Papá Noel la ha confiado a su trineo.',
    tracking: 'Seguimiento del paquete',
    button: 'Seguir el trineo',
    footer: 'La fecha de llegada depende ahora del transportista y del destino.'
  },
  pt: {
    subject: 'O trenó já está a caminho!',
    preview: 'Boas notícias: a sua surpresa NoelWish foi enviada.',
    title: 'O trenó já está a caminho!',
    intro: 'Boas notícias: os duendes terminaram de preparar a surpresa e o Pai Natal colocou-a no trenó.',
    tracking: 'Rastreamento da encomenda',
    button: 'Acompanhar o trenó',
    footer: 'A data de chegada depende agora da transportadora e do destino.'
  },
  de: {
    subject: 'Der Schlitten ist unterwegs!',
    preview: 'Gute Nachrichten: Deine NoelWish-Überraschung wurde verschickt.',
    title: 'Der Schlitten ist unterwegs!',
    intro: 'Gute Nachrichten: Die Elfen haben die Überraschung fertig vorbereitet und der Weihnachtsmann hat sie seinem Schlitten anvertraut.',
    tracking: 'Sendungsverfolgung',
    button: 'Den Schlitten verfolgen',
    footer: 'Das Ankunftsdatum hängt nun vom Versanddienstleister und vom Zielort ab.'
  }
};

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

async function sendShippingEmail(session, tracking) {
  if (!process.env.RESEND_API_KEY) throw new Error('Resend non configuré');
  const metadata = session.metadata || {};
  const language = SHIPPING_COPY[metadata.language] ? metadata.language : 'fr';
  const copy = SHIPPING_COPY[language];
  const email = session.customer_details?.email || session.customer_email || '';
  if (!email) throw new Error('Adresse e-mail client manquante');
  const isLink = /^https:\/\//i.test(tracking);
  const trackingBlock = isLink
    ? `<a href="${escapeHtml(tracking)}" style="display:inline-block;background:#f5d68c;color:#4a1d20;text-decoration:none;font-weight:800;padding:14px 24px;border-radius:999px">${copy.button}</a>`
    : `<div style="display:inline-block;background:#fff1cf;border-left:4px solid #c99a3c;padding:14px 18px;font-size:18px;font-weight:700">${copy.tracking} : ${escapeHtml(tracking)}</div>`;
  const html = `<!doctype html><html><body style="margin:0;background:#f4efe5;font-family:Arial,sans-serif;color:#35171a"><div style="display:none;max-height:0;overflow:hidden">${copy.preview}</div><div style="max-width:620px;margin:20px auto;background:#fffaf1;border:1px solid #e3d1ae;border-radius:20px;overflow:hidden"><img src="https://www.noelwish.com/api/sleigh-tracking-image" width="620" alt="" style="display:block;width:100%;height:auto"><div style="padding:34px 38px;text-align:center"><div style="font-size:12px;letter-spacing:3px;color:#9b642f">COURRIER DU PÔLE NORD</div><h1 style="font-family:Georgia,serif;color:#8d1523;font-size:36px;line-height:1.15">${copy.title}</h1><p style="font-size:17px;line-height:1.7">${copy.intro}</p><div style="margin:28px 0">${trackingBlock}</div><p style="font-size:14px;line-height:1.6;color:#775f57">${copy.footer}</p><p style="margin-top:28px;font-family:Georgia,serif;font-size:22px;color:#8d1523">Le Père Noël</p></div></div></body></html>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'shipping-' + session.id + '-' + crypto.createHash('sha1').update(tracking).digest('hex').slice(0, 16)
    },
    body: JSON.stringify({
      from: 'NoelWish <magic@noelwish.com>',
      to: [email],
      reply_to: 'contact@noelwish.com',
      subject: copy.subject,
      html
    })
  });
  if (!response.ok) throw new Error('Échec de l’e-mail d’expédition');
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

      const tracking = String(body.tracking || '').slice(0, 180).trim();
      const existing = await stripeRequest(`/checkout/sessions/${encodeURIComponent(id)}`);
      const params = new URLSearchParams();
      params.set('metadata[fulfillment_status]', status);
      params.set('metadata[tracking_number]', tracking);
      params.set('metadata[admin_note]', String(body.note || '').slice(0, 450));

      const session = await stripeRequest(`/checkout/sessions/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      let emailSent = false;
      let emailError = '';
      const physical = ['santa-surprise', 'big-christmas-box'].includes(session.metadata?.noelwish_product);
      const alreadySentFor = existing.metadata?.shipping_email_tracking || '';
      if (physical && status === 'shipped' && tracking && tracking !== alreadySentFor) {
        try {
          await sendShippingEmail(session, tracking);
          emailSent = true;
          const mark = new URLSearchParams();
          mark.set('metadata[shipping_email_tracking]', tracking);
          await stripeRequest(`/checkout/sessions/${encodeURIComponent(id)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: mark
          });
        } catch (error) {
          emailError = error.message || 'E-mail non envoyé';
          console.error(JSON.stringify({ level: 'error', route: '/api/admin-orders', order: id, message: emailError }));
        }
      }

      return res.status(200).json({
        ok: true,
        status: session.metadata?.fulfillment_status || status,
        tracking: session.metadata?.tracking_number || '',
        note: session.metadata?.admin_note || '',
        emailSent,
        emailError
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
