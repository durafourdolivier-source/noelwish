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

function isSelfSender(value = '') {
  return /^(moi([ -]?même)?|me|myself)$/i.test(String(value).trim());
}

function letterHtml(metadata) {
  const recipient = escapeHtml(metadata.recipient || 'mon ami');
  const rawSender = metadata.sender || '';
  const senderLine = rawSender && !isSelfSender(rawSender)
    ? `Cette lettre a été préparée avec beaucoup d’attention par <strong>${escapeHtml(rawSender)}</strong>, qui tenait à t’offrir un moment rien qu’à toi.`
    : 'Cette lettre a été préparée spécialement pour toi, avec beaucoup d’attention.';
  const message = escapeHtml(metadata.message || 'Je te souhaite un merveilleux Noël.');

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;background:#f6f1e8;font-family:Georgia,'Times New Roman',serif;color:#38251f">
    <div style="display:none;max-height:0;overflow:hidden">Un courrier du Pôle Nord est arrivé pour ${recipient}.</div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:28px 12px">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:590px;background:#fffdf8;border:1px solid #dfcfb6;border-radius:14px">
            <tr>
              <td style="padding:42px 42px 12px;text-align:center">
                <div style="font-size:11px;letter-spacing:3px;color:#9a6b38;text-transform:uppercase">Courrier du Pôle Nord</div>
                <h1 style="margin:14px 0 4px;font-size:29px;line-height:1.25;color:#741421;font-weight:normal">Une lettre pour ${recipient}</h1>
                <div style="width:58px;height:1px;background:#c8a566;margin:22px auto 0"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 42px 38px;font-size:17px;line-height:1.75">
                <p style="margin:0 0 20px">Ho ho ho, ${recipient} !</p>
                <p style="margin:0 0 20px">Une pensée remplie de magie vient de traverser les étoiles pour arriver jusqu’à mon atelier.</p>
                <p style="margin:26px 0;padding:20px 22px;border-left:3px solid #b88a3b;background:#fff8e9;font-size:19px;line-height:1.65"><em>« ${message} »</em></p>
                <p style="margin:0 0 20px">${senderLine}</p>
                <p style="margin:0 0 20px">Garde précieusement ces mots : ils ont voyagé jusqu’ici parce que quelqu’un voulait rendre ton Noël encore un peu plus spécial.</p>
                <p style="margin:0 0 30px">Je te souhaite de belles fêtes, pleines de douceur, de rires et de merveilleux souvenirs auprès de ceux qui comptent pour toi.</p>
                <p style="margin:0">Avec toute la magie du Pôle Nord,</p>
                <p style="margin:8px 0 0;font-family:'Brush Script MT','Segoe Script',cursive;font-size:27px;color:#741421">Le Père Noël</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:16px 24px;color:#9a8173;font:11px Arial,sans-serif;border-top:1px solid #eee2d1">Une attention personnelle envoyée depuis le Pôle Nord</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function letterText(metadata) {
  const recipient = metadata.recipient || 'mon ami';
  const rawSender = String(metadata.sender || '').trim();
  const message = metadata.message || 'Je te souhaite un merveilleux Noël.';
  const senderLine = rawSender && !isSelfSender(rawSender)
    ? `Cette lettre a été préparée avec beaucoup d’attention par ${rawSender}, qui tenait à t’offrir un moment rien qu’à toi.`
    : 'Cette lettre a été préparée spécialement pour toi, avec beaucoup d’attention.';

  return `Une lettre pour ${recipient}

Ho ho ho, ${recipient} !

Une pensée remplie de magie vient de traverser les étoiles pour arriver jusqu’à mon atelier.

« ${message} »

${senderLine}

Garde précieusement ces mots : ils ont voyagé jusqu’ici parce que quelqu’un voulait rendre ton Noël encore un peu plus spécial.

Je te souhaite de belles fêtes, pleines de douceur, de rires et de merveilleux souvenirs auprès de ceux qui comptent pour toi.

Avec toute la magie du Pôle Nord,

Le Père Noël`;
}

function confirmationHtml(metadata, product) {
  const recipient = escapeHtml(metadata.recipient || 'le destinataire');
  const productName = product === 'santa-surprise' ? 'Santa Surprise' : 'Big Christmas Box';
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f8efe6;font-family:Arial,sans-serif;color:#3d1a1f"><div style="max-width:600px;margin:30px auto;background:#fffaf3;border-radius:20px;padding:34px"><h1 style="color:#7b0d1b">Commande confirmée 🎄</h1><p>Merci ! Le paiement de ta <strong>${productName}</strong> pour <strong>${recipient}</strong> a bien été reçu.</p><p>Notre atelier prépare maintenant la surprise. Tu recevras directement les informations utiles à cette adresse.</p><p>L’équipe NoelWish ✨</p></div></body></html>`;
}

async function sendEmail({ to, subject, html, text, eventId, scheduledAt }) {
  const payload = {
    from: 'Le Père Noël <magic@noelwish.com>',
    to: [to],
    subject,
    html,
    text
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
        subject: `Une lettre du Père Noël pour ${metadata.recipient || 'toi'}`,
        html: letterHtml(metadata),
        text: letterText(metadata),
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
    return res.status(500).json({ error: 'Email delivery failed', detail: error instanceof Error ? error.message : String(error) });
  }

  return res.status(200).json({ received: true });
}
