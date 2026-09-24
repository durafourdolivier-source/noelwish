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


const EMAIL_LOCALES = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', pt: 'pt-PT', de: 'de-DE' };
const EMAIL_COPY = {
  fr: {
    friend: 'mon ami', defaultMessage: 'Je te souhaite un merveilleux Noël.',
    preview: 'Une lettre du Père Noël est arrivée pour', imageAlt: 'Le Père Noël signe ta lettre dans son atelier', giftImageAlt: 'Le Père Noël prépare un cadeau dans son atelier',
    overline: 'Courrier du Pôle Nord', title: 'Une lettre pour', northPole: 'Pôle Nord, le',
    introSelf: 'J’ai trouvé dans mon courrier quelques mots qui t’étaient spécialement destinés…',
    introSender: sender => `${sender} m’a confié quelques mots rien que pour toi…`,
    journey: 'Certaines pensées n’ont besoin que de quelques mots pour voyager loin. Celle-ci a trouvé son chemin jusqu’à toi.',
    wishes: 'Je te souhaite de belles fêtes, pleines de douceur, de rires et de précieux moments auprès de ceux qui comptent pour toi.',
    closing: 'Avec toute mon affection,', santa: 'Le Père Noël', seal: 'PN',
    reply: 'Répondre au Père Noël →', footer: 'Courrier personnel préparé dans l’atelier du Père Noël',
    letterSubject: recipient => `Une lettre du Père Noël pour ${recipient}`,
    confirmationSubject: 'Ta commande NoelWish est confirmée 🎄', confirmationTitle: 'Commande confirmée 🎄',
    recipientFallback: 'le destinataire',
    confirmationLead: (product, recipient) => `Merci ! Le paiement de ta <strong>${product}</strong> pour <strong>${recipient}</strong> a bien été reçu.`,
    confirmationNext: 'Notre atelier prépare maintenant la surprise. Tu recevras directement les informations utiles à cette adresse.',
    donationSubject: 'Merci pour ton geste solidaire ❤️', donationLabel: 'NOELWISH · PROJET SOLIDAIRE',
    donationTitle: 'Merci pour ton geste ❤️', donationConfirmed: amount => `Ta contribution de <strong>${amount}</strong> est bien confirmée.`,
    donationHelp: 'Elle aidera NoelWish à acheter et préparer des cadeaux solidaires. Nous publierons un bilan transparent des sommes collectées et de leur utilisation.',
    donationReceipt: 'Cette contribution ne donne pas droit à un reçu fiscal.',
    donationText: 'Merci pour ta contribution au projet solidaire NoelWish. Un bilan transparent des sommes collectées et utilisées sera publié. Cette contribution ne donne pas droit à un reçu fiscal.',
    team: 'L’équipe NoelWish ✨'
  },
  en: {
    friend: 'my friend', defaultMessage: 'Wishing you a wonderful Christmas.',
    preview: 'A letter from Santa has arrived for', imageAlt: 'Santa signs your letter in his workshop', giftImageAlt: 'Santa prepares a gift in his workshop',
    overline: 'Mail from the North Pole', title: 'A letter for', northPole: 'North Pole,',
    introSelf: 'I found a few words in my mail that were meant especially for you…',
    introSender: sender => `${sender} shared a few words just for you…`,
    journey: 'Some thoughts need only a few words to travel a long way. This one has found its way to you.',
    wishes: 'I wish you a wonderful festive season filled with warmth, laughter and precious moments with those who matter to you.',
    closing: 'With all my affection,', santa: 'Santa Claus', seal: 'SC',
    reply: 'Reply to Santa →', footer: 'A personal letter prepared in Santa’s workshop',
    letterSubject: recipient => `A letter from Santa for ${recipient}`,
    confirmationSubject: 'Your NoelWish order is confirmed 🎄', confirmationTitle: 'Order confirmed 🎄',
    recipientFallback: 'the recipient',
    confirmationLead: (product, recipient) => `Thank you! Payment for your <strong>${product}</strong> for <strong>${recipient}</strong> has been received.`,
    confirmationNext: 'Our workshop is now preparing the surprise. We will send all useful information directly to this email address.',
    donationSubject: 'Thank you for your generous gesture ❤️', donationLabel: 'NOELWISH · SOLIDARITY PROJECT',
    donationTitle: 'Thank you for your kindness ❤️', donationConfirmed: amount => `Your contribution of <strong>${amount}</strong> is confirmed.`,
    donationHelp: 'It will help NoelWish purchase and prepare solidarity gifts. We will publish a transparent report on the funds collected and how they are used.',
    donationReceipt: 'This contribution is not eligible for a tax receipt.',
    donationText: 'Thank you for contributing to the NoelWish solidarity project. We will publish a transparent report on the funds collected and how they are used. This contribution is not eligible for a tax receipt.',
    team: 'The NoelWish team ✨'
  },
  es: {
    friend: 'mi amigo', defaultMessage: 'Te deseo una Navidad maravillosa.',
    preview: 'Ha llegado una carta de Papá Noel para', imageAlt: 'Papá Noel firma tu carta en su taller', giftImageAlt: 'Papá Noel prepara un regalo en su taller',
    overline: 'Correo del Polo Norte', title: 'Una carta para', northPole: 'Polo Norte,',
    introSelf: 'He encontrado en mi correo unas palabras especialmente destinadas a ti…',
    introSender: sender => `${sender} me confió unas palabras solo para ti…`,
    journey: 'Algunos pensamientos solo necesitan unas palabras para viajar muy lejos. Este ha encontrado el camino hasta ti.',
    wishes: 'Te deseo unas fiestas llenas de cariño, risas y momentos preciosos junto a las personas que más quieres.',
    closing: 'Con todo mi cariño,', santa: 'Papá Noel', seal: 'PN',
    reply: 'Responder a Papá Noel →', footer: 'Carta personal preparada en el taller de Papá Noel',
    letterSubject: recipient => `Una carta de Papá Noel para ${recipient}`,
    confirmationSubject: 'Tu pedido NoelWish está confirmado 🎄', confirmationTitle: 'Pedido confirmado 🎄',
    recipientFallback: 'el destinatario',
    confirmationLead: (product, recipient) => `¡Gracias! Hemos recibido el pago de tu <strong>${product}</strong> para <strong>${recipient}</strong>.`,
    confirmationNext: 'Nuestro taller ya está preparando la sorpresa. Recibirás toda la información necesaria directamente en este correo.',
    donationSubject: 'Gracias por tu gesto solidario ❤️', donationLabel: 'NOELWISH · PROYECTO SOLIDARIO',
    donationTitle: 'Gracias por tu generosidad ❤️', donationConfirmed: amount => `Tu contribución de <strong>${amount}</strong> está confirmada.`,
    donationHelp: 'Ayudará a NoelWish a comprar y preparar regalos solidarios. Publicaremos un informe transparente sobre los fondos recaudados y su utilización.',
    donationReceipt: 'Esta contribución no da derecho a un recibo fiscal.',
    donationText: 'Gracias por contribuir al proyecto solidario NoelWish. Publicaremos un informe transparente sobre los fondos recaudados y su utilización. Esta contribución no da derecho a un recibo fiscal.',
    team: 'El equipo NoelWish ✨'
  },
  pt: {
    friend: 'meu amigo', defaultMessage: 'Desejo a você um Natal maravilhoso.',
    preview: 'Chegou uma carta do Pai Natal para', imageAlt: 'O Pai Natal assina a sua carta na oficina', giftImageAlt: 'O Pai Natal prepara um presente na sua oficina',
    overline: 'Correio do Polo Norte', title: 'Uma carta para', northPole: 'Polo Norte,',
    introSelf: 'Encontrei no meu correio algumas palavras destinadas especialmente a você…',
    introSender: sender => `${sender} me confiou algumas palavras só para você…`,
    journey: 'Alguns pensamentos precisam apenas de poucas palavras para viajar longe. Este encontrou o caminho até você.',
    wishes: 'Desejo a você festas cheias de carinho, risadas e momentos preciosos ao lado de quem é importante.',
    closing: 'Com todo o meu carinho,', santa: 'Pai Natal', seal: 'PN',
    reply: 'Responder ao Pai Natal →', footer: 'Carta pessoal preparada na oficina do Pai Natal',
    letterSubject: recipient => `Uma carta do Pai Natal para ${recipient}`,
    confirmationSubject: 'O seu pedido NoelWish está confirmado 🎄', confirmationTitle: 'Pedido confirmado 🎄',
    recipientFallback: 'o destinatário',
    confirmationLead: (product, recipient) => `Obrigado! O pagamento da sua <strong>${product}</strong> para <strong>${recipient}</strong> foi recebido.`,
    confirmationNext: 'A nossa oficina está preparando a surpresa. Todas as informações úteis serão enviadas diretamente para este e-mail.',
    donationSubject: 'Obrigado pelo seu gesto solidário ❤️', donationLabel: 'NOELWISH · PROJETO SOLIDÁRIO',
    donationTitle: 'Obrigado pela sua generosidade ❤️', donationConfirmed: amount => `A sua contribuição de <strong>${amount}</strong> está confirmada.`,
    donationHelp: 'Ela ajudará a NoelWish a comprar e preparar presentes solidários. Publicaremos um relatório transparente sobre os valores arrecadados e a sua utilização.',
    donationReceipt: 'Esta contribuição não dá direito a recibo fiscal.',
    donationText: 'Obrigado por contribuir para o projeto solidário NoelWish. Publicaremos um relatório transparente sobre os valores arrecadados e a sua utilização. Esta contribuição não dá direito a recibo fiscal.',
    team: 'A equipe NoelWish ✨'
  },
  de: {
    friend: 'mein lieber Freund', defaultMessage: 'Ich wünsche dir ein wundervolles Weihnachtsfest.',
    preview: 'Ein Brief vom Weihnachtsmann ist angekommen für', imageAlt: 'Der Weihnachtsmann unterschreibt deinen Brief in seiner Werkstatt', giftImageAlt: 'Der Weihnachtsmann bereitet ein Geschenk in seiner Werkstatt vor',
    overline: 'Post vom Nordpol', title: 'Ein Brief für', northPole: 'Nordpol,',
    introSelf: 'In meiner Post habe ich ein paar Worte gefunden, die ganz besonders für dich bestimmt waren…',
    introSender: sender => `${sender} hat mir ein paar Worte nur für dich anvertraut…`,
    journey: 'Manche Gedanken brauchen nur wenige Worte, um weit zu reisen. Dieser hat seinen Weg zu dir gefunden.',
    wishes: 'Ich wünsche dir eine wunderschöne Weihnachtszeit voller Wärme, Lachen und wertvoller Momente mit den Menschen, die dir wichtig sind.',
    closing: 'Mit all meiner Zuneigung,', santa: 'Der Weihnachtsmann', seal: 'WM',
    reply: 'Dem Weihnachtsmann antworten →', footer: 'Persönlicher Brief aus der Werkstatt des Weihnachtsmanns',
    letterSubject: recipient => `Ein Brief vom Weihnachtsmann für ${recipient}`,
    confirmationSubject: 'Deine NoelWish-Bestellung ist bestätigt 🎄', confirmationTitle: 'Bestellung bestätigt 🎄',
    recipientFallback: 'die beschenkte Person',
    confirmationLead: (product, recipient) => `Vielen Dank! Die Zahlung für deine <strong>${product}</strong> für <strong>${recipient}</strong> ist eingegangen.`,
    confirmationNext: 'Unsere Werkstatt bereitet die Überraschung jetzt vor. Alle wichtigen Informationen erhältst du direkt an diese E-Mail-Adresse.',
    donationSubject: 'Danke für deine solidarische Geste ❤️', donationLabel: 'NOELWISH · SOLIDARITÄTSPROJEKT',
    donationTitle: 'Danke für deine Unterstützung ❤️', donationConfirmed: amount => `Dein Beitrag von <strong>${amount}</strong> ist bestätigt.`,
    donationHelp: 'Damit hilft NoelWish, solidarische Geschenke zu kaufen und vorzubereiten. Wir veröffentlichen einen transparenten Bericht über die gesammelten Mittel und ihre Verwendung.',
    donationReceipt: 'Für diesen Beitrag kann keine Spendenbescheinigung ausgestellt werden.',
    donationText: 'Vielen Dank für deinen Beitrag zum NoelWish-Solidaritätsprojekt. Wir veröffentlichen einen transparenten Bericht über die gesammelten Mittel und ihre Verwendung. Für diesen Beitrag kann keine Spendenbescheinigung ausgestellt werden.',
    team: 'Das NoelWish-Team ✨'
  }
};

function emailLanguage(value) {
  return Object.prototype.hasOwnProperty.call(EMAIL_COPY, value) ? value : 'fr';
}

function formatLetterDate(metadata, language) {
  const source = metadata.delivery_at || new Date().toISOString();
  const date = new Date(source);
  if (!date.getTime()) return '';
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: metadata.delivery_timezone || 'Europe/Paris'
  };
  try {
    return new Intl.DateTimeFormat(EMAIL_LOCALES[language], options).format(date);
  } catch {
    delete options.timeZone;
    return new Intl.DateTimeFormat(EMAIL_LOCALES[language], options).format(date);
  }
}

function letterData(metadata, language) {
  const copy = EMAIL_COPY[language];
  const recipientRaw = String(metadata.recipient || copy.friend);
  const rawSender = String(metadata.sender || '').trim();
  const messageRaw = String(metadata.message || copy.defaultMessage);
  return {
    copy,
    recipientRaw,
    recipient: escapeHtml(recipientRaw),
    rawSender,
    sender: escapeHtml(rawSender),
    messageRaw,
    message: escapeHtml(messageRaw),
    date: escapeHtml(formatLetterDate(metadata, language))
  };
}

function letterHtml(metadata, language) {
  const { copy, recipient, rawSender, sender, message, date } = letterData(metadata, language);
  const introduction = rawSender && !isSelfSender(rawSender)
    ? copy.introSender(`<strong>${sender}</strong>`)
    : copy.introSelf;

  return `<!doctype html>
<html lang="${language}">
  <body style="margin:0;background:#f4efe6;font-family:Georgia,'Times New Roman',serif;color:#38251f">
    <div style="display:none;max-height:0;overflow:hidden">${copy.preview} ${recipient}.</div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td align="center" style="padding:24px 10px">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#fffdf8;border:1px solid #dfcfb6;border-radius:16px;overflow:hidden">
          <tr><td><img src="https://www.noelwish.com/api/letter-workshop-image" width="600" alt="${copy.imageAlt}" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>
          <tr><td style="padding:31px 42px 10px;text-align:center">
            <div style="font-size:11px;letter-spacing:3px;color:#9a6b38;text-transform:uppercase">${copy.overline}</div>
            <h1 style="margin:13px 0 8px;font-size:29px;line-height:1.25;color:#741421;font-weight:normal">${copy.title} ${recipient}</h1>
            <div style="font-size:13px;font-style:italic;color:#9a8173">${copy.northPole} ${date}</div>
            <div style="width:58px;height:1px;background:#c8a566;margin:20px auto 0"></div>
          </td></tr>
          <tr><td style="padding:18px 42px 34px;font-size:17px;line-height:1.75">
            <p style="margin:0 0 20px">Ho ho ho, ${recipient}!</p>
            <p style="margin:0 0 18px">${introduction}</p>
            <p style="margin:22px 0;padding:20px 22px;border-left:3px solid #b88a3b;background:#fff8e9;font-size:19px;line-height:1.65"><em>« ${message} »</em></p>
            <p style="margin:0 0 20px">${copy.journey}</p>
            <p style="margin:0 0 27px">${copy.wishes}</p>
            <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%"><tr>
              <td style="vertical-align:bottom"><p style="margin:0 0 4px">${copy.closing}</p><p style="margin:0;font-family:'Brush Script MT','Segoe Script',cursive;font-size:28px;color:#741421">${copy.santa}</p></td>
              <td align="right" style="width:74px;vertical-align:bottom"><div style="display:inline-block;width:58px;height:58px;line-height:58px;border-radius:50%;background:#8f1727;color:#f4d99d;text-align:center;font:700 17px/58px Georgia,serif;border:3px double #d4b36f">${copy.seal}</div></td>
            </tr></table>
            <p style="margin:27px 0 0;text-align:center"><a href="https://www.noelwish.com/#wish" style="color:#8f1727;font:italic 14px Georgia,'Times New Roman',serif;text-decoration:underline;text-underline-offset:4px">${copy.reply}</a></p>
          </td></tr>
          <tr><td align="center" style="padding:15px 24px;color:#9a8173;font:11px Arial,sans-serif;border-top:1px solid #eee2d1">${copy.footer}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function letterText(metadata, language) {
  const { copy, recipientRaw, rawSender, messageRaw } = letterData(metadata, language);
  const date = formatLetterDate(metadata, language);
  const introduction = rawSender && !isSelfSender(rawSender) ? copy.introSender(rawSender) : copy.introSelf;
  return `${copy.overline.toUpperCase()}
${copy.northPole} ${date}

${copy.title} ${recipientRaw}

Ho ho ho, ${recipientRaw}!

${introduction}

« ${messageRaw} »

${copy.journey}

${copy.wishes}

${copy.closing}

${copy.santa}

${copy.reply.replace(' →', '')}: https://www.noelwish.com/#wish`;
}

function confirmationHtml(metadata, product, language) {
  const copy = EMAIL_COPY[language];
  const recipient = escapeHtml(metadata.recipient || copy.recipientFallback);
  const productName = product === 'santa-surprise' ? 'Santa Surprise' : 'Big Christmas Box';
  return `<!doctype html><html lang="${language}"><body style="margin:0;background:#f8efe6;font-family:Arial,sans-serif;color:#3d1a1f"><div style="display:none;max-height:0;overflow:hidden">${copy.confirmationTitle}</div><table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:24px 10px"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#fffaf3;border:1px solid #ead6b6;border-radius:20px;overflow:hidden"><tr><td><img src="https://www.noelwish.com/api/gift-workshop-image" width="600" alt="${copy.giftImageAlt}" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr><tr><td style="padding:34px;font-size:16px;line-height:1.65"><h1 style="margin:0 0 22px;color:#7b0d1b;font-family:Georgia,'Times New Roman',serif;font-size:29px">${copy.confirmationTitle}</h1><p style="margin:0 0 18px">${copy.confirmationLead(productName, recipient)}</p><p style="margin:0 0 24px">${copy.confirmationNext}</p><p style="margin:0;color:#7b0d1b;font-weight:bold">${copy.team}</p></td></tr></table></td></tr></table></body></html>`;
}

function donationHtml(session, language) {
  const copy = EMAIL_COPY[language];
  const amount = new Intl.NumberFormat(EMAIL_LOCALES[language], { style: 'currency', currency: String(session.currency || 'eur').toUpperCase() }).format((session.amount_total || 0) / 100);
  return `<!doctype html><html lang="${language}"><body style="margin:0;background:#f8efe6;font-family:Arial,sans-serif;color:#3d1a1f"><div style="max-width:600px;margin:30px auto;background:#fffaf3;border:1px solid #ead6b6;border-radius:20px;overflow:hidden"><img src="https://www.noelwish.com/api/solidarity-gifts-image" width="600" alt="" style="display:block;width:100%;height:auto"><div style="padding:34px"><p style="color:#a86e2a;letter-spacing:2px;font-size:12px">${copy.donationLabel}</p><h1 style="font-family:Georgia,serif;color:#7b0d1b;font-size:34px;line-height:1.15">${copy.donationTitle}</h1><p style="font-size:17px;line-height:1.7">${copy.donationConfirmed(amount)}</p><div style="background:#fff0cc;border-left:4px solid #cf9c34;padding:15px 18px;margin:22px 0;border-radius:8px;line-height:1.65">${copy.donationHelp}</div><p style="font-size:13px;color:#765;line-height:1.6">${copy.donationReceipt}</p><p style="margin-top:26px;font-family:Georgia,serif;color:#8d1523;font-size:20px">${copy.team}</p></div></div></body></html>`;
}

async function sendEmail({ to, subject, html, text, eventId, scheduledAt, language = 'fr' }) {
  const payload = {
    from: `${EMAIL_COPY[emailLanguage(language)].santa} <magic@noelwish.com>`,
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
  const language = emailLanguage(metadata.language);
  const copy = EMAIL_COPY[language];
  const product = metadata.noelwish_product;
  const recipientEmail = metadata.delivery_email;
  const purchaserEmail = session.customer_details?.email || recipientEmail;

  try {
    if (product === 'magic-letter' && recipientEmail) {
      const recipient = metadata.recipient || copy.friend;
      await sendEmail({
        to: recipientEmail,
        subject: copy.letterSubject(recipient),
        html: letterHtml(metadata, language),
        text: letterText(metadata, language),
        eventId: event.id,
        scheduledAt: metadata.delivery_mode === 'scheduled' ? futureDeliveryDate(metadata.delivery_at) : undefined,
        language
      });
    } else if (purchaserEmail && ['santa-surprise', 'big-christmas-box'].includes(product)) {
      await sendEmail({
        to: purchaserEmail,
        subject: copy.confirmationSubject,
        html: confirmationHtml(metadata, product, language),
        eventId: event.id,
        language
      });
    } else if (purchaserEmail && String(product || '').startsWith('donation-')) {
      await sendEmail({
        to: purchaserEmail,
        subject: copy.donationSubject,
        html: donationHtml(session, language),
        text: copy.donationText,
        eventId: event.id,
        language
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Email delivery failed', detail: error instanceof Error ? error.message : String(error) });
  }

  return res.status(200).json({ received: true });
}
