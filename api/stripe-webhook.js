import crypto from 'crypto';

export const config = {
  api: { bodyParser: false }
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyStripeSignature(rawBody, header, secret) {
  if (!header || !secret) return false;
  const values = Object.fromEntries(header.split(',').map(part => part.split('=')));
  if (!values.t || !values.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(values.t)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret)
    .update(`${values.t}.${rawBody.toString('utf8')}`)
    .digest('hex');
  const actualBuffer = Buffer.from(values.v1, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function letterHtml(metadata) {
  const recipient = escapeHtml(metadata.recipient || 'mon ami');
  const sender = escapeHtml(metadata.sender || 'une personne qui pense à toi');
  const message = escapeHtml(metadata.message || 'Je te souhaite un merveilleux Noël.');
  const theme = escapeHtml(metadata.theme || 'Magique et émouvant');

  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f8efe6;font-family:Arial,sans-serif;color:#3d1a1f"><div style="display:none;max-height:0;overflow:hidden">Une lettre magique t'attend au Pôle Nord ✨</div><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 14px"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fffaf3;border:1px solid #ead6b6;border-radius:22px"><tr><td align="center" style="padding:36px 34px 18px;background:#7b0d1b;border-radius:22px 22px 0 0;color:#f6d37b"><div style="font-size:42px">🎅</div><div style="font-size:12px;letter-spacing:3px">NOELWISH · PÔLE NORD</div><h1 style="margin:12px 0 0;font-family:Georgia,serif;color:white">Une lettre pour ${recipient}</h1></td></tr><tr><td style="padding:34px;font-size:17px;line-height:1.75"><p>Ho ho ho, ${recipient} !</p><p>Une pensée remplie de magie vient de traverser les étoiles jusqu’à mon atelier.</p><p style="padding:20px;border-left:4px solid #c89b3c;background:#fff4dc;font-family:Georgia,serif;font-size:19px"><em>« ${message} »</em></p><p>Cette surprise t’est offerte par <strong>${sender}</strong>, avec un esprit <strong>${theme.toLowerCase()}</strong>.</p><p>Que ton Noël soit rempli de douceur, de rires et de merveilleux souvenirs.</p><p>Avec toute la magie du Pôle Nord,<br><strong>Le Père Noël 🎅</strong></p></td></tr><tr><td align="center" style="padding:20px;color:#8d6e62;font-size:12px;border-top:1px solid #ead6b6">NoelWish · Une surprise envoyée avec amour</td></tr></table></td></tr></table></body></html>`;
}

function confirmationHtml(metadata, product) {
  const recipient = escapeHtml(metadata.recipient || 'le destinataire');
  const productName = product === 'santa-surprise' ? 'Santa Surprise' : 'Big Christmas Box';
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f8efe6;font-family:Arial,sans-serif;color:#3d1a1f"><div style="max-width:600px;margin:30px auto;background:#fffaf3;border-radius:20px;padding:34px"><h1 style="color:#7b0d1b">Commande confirmée 🎄</h1><p>Merci ! Le paiement de ta <strong>${productName}</strong> pour <strong>${recipient}</strong> a bien été reçu.</p><p>Notre atelier prépare maintenant la surprise. Tu recevras directement les informations utiles à cette adresse.</p><p>L’équipe NoelWish ✨</p></div></body></html>`;
}

async function sendEmail({ to, subject, html, eventId, scheduledAt }) {
  const payload = {
    from: 'Père Noël · NoelWish <magic@noelwish.com>',
    to: [to],
    subject,
    html
  };
  if (scheduledAt) payload.scheduled_at = scheduledAt;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `noelwish-${eventId}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Resend error ${response.status}: ${await response.text()}`);
}

function futureDeliveryDate(value) {
  const date = new Date(value || '');
  if (!date.getTime()) return undefined;
  const delay = date.getTime() - Date.now();
  return delay > 10 * 60 * 1000 && delay <= 30 * 24 * 60 * 60 * 1000
    ? date.toISOString()
    : undefined;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: 'Webhook is not configured' });
  }

  const rawBody = await readRawBody(req);
  if (!verifyStripeSignature(rawBody, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET)) {
    return res.status(400).json({ error: 'Invalid Stripe signature' });
  }

  const event = JSON.parse(rawBody.toString('utf8'));
  if (event.type !== 'checkout.session.completed') return res.status(200).json({ received: true });

  const session = event.data.object;
  if (session.payment_status !== 'paid') return res.status(200).json({ received: true });

  const metadata = session.metadata || {};
  const product = metadata.noelwish_product;
  const recipientEmail = metadata.delivery_email;
  const purchaserEmail = session.customer_details?.email || recipientEmail;

  try {
    if (product === 'magic-letter' && recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject: `Une lettre magique pour ${metadata.recipient || 'toi'} 🎅`,
        html: letterHtml(metadata),
        eventId: event.id,
        scheduledAt: metadata.delivery_mode === 'scheduled' ? futureDeliveryDate(metadata.delivery_at) : undefined
      });
    } else if (purchaserEmail && ['santa-surprise', 'big-christmas-box'].includes(product)) {
      await sendEmail({
        to: purchaserEmail,
        subject: 'Ta commande NoelWish est confirmée 🎄',
        html: confirmationHtml(metadata, product),
        eventId: event.id
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Email delivery failed' });
  }

  return res.status(200).json({ received: true });
}
