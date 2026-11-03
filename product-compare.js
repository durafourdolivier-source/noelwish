(() => {
  const COPY = {
    fr: {
      title: 'Choisis l’attention qui lui ressemble',
      intro: 'Du petit message qui touche au grand coffret à déballer : compare les formats et choisis l’effet que tu veux créer.',
      items: [
        ['Envoi numérique par e-mail', 'Immédiat ou programmé', 'Idéal pour une attention personnelle'],
        ['Une surprise choisie selon ses goûts', 'Coffret physique personnalisé', 'Idéal pour faire plaisir simplement'],
        ['Plusieurs surprises personnalisées', 'Grand coffret et carte magique', 'Idéal pour marquer vraiment le coup']
      ],
      trust: 'Paiement sécurisé par Stripe · Coffrets préparés sous 7 jours ouvrés · Suivi envoyé par e-mail'
    },
    en: {
      title: 'Choose the gift that feels right for them',
      intro: 'From a heartfelt message to a full box to unwrap, compare each format and choose the moment you want to create.',
      items: [
        ['Digital delivery by email', 'Send now or schedule it', 'Ideal for a personal gesture'],
        ['One surprise selected from their interests', 'Personalised physical gift box', 'Ideal for an easy thoughtful gift'],
        ['Several personalised surprises', 'Large gift box and magical card', 'Ideal for making a lasting impression']
      ],
      trust: 'Secure Stripe payment · Gift boxes prepared within 7 business days · Tracking sent by email'
    },
    es: {
      title: 'Elige el detalle que mejor encaja con esa persona',
      intro: 'Desde un mensaje que emociona hasta una gran caja para abrir: compara los formatos y elige el momento que quieres crear.',
      items: [
        ['Envío digital por email', 'Inmediato o programado', 'Ideal para un detalle personal'],
        ['Una sorpresa elegida según sus gustos', 'Caja física personalizada', 'Ideal para acertar fácilmente'],
        ['Varias sorpresas personalizadas', 'Gran caja y tarjeta mágica', 'Ideal para dejar una huella especial']
      ],
      trust: 'Pago seguro con Stripe · Cajas preparadas en 7 días laborables · Seguimiento enviado por email'
    },
    pt: {
      title: 'Escolha o presente que mais combina com essa pessoa',
      intro: 'De uma mensagem emocionante a uma grande caixa para abrir, compare os formatos e escolha o momento que deseja criar.',
      items: [
        ['Envio digital por email', 'Imediato ou agendado', 'Ideal para um gesto pessoal'],
        ['Uma surpresa escolhida pelos gostos', 'Caixa física personalizada', 'Ideal para agradar sem complicação'],
        ['Várias surpresas personalizadas', 'Grande caixa e cartão mágico', 'Ideal para tornar o momento inesquecível']
      ],
      trust: 'Pagamento seguro com Stripe · Caixas preparadas em até 7 dias úteis · Rastreamento enviado por email'
    },
    de: {
      title: 'Wähle das Geschenk, das wirklich zu dieser Person passt',
      intro: 'Von einer persönlichen Nachricht bis zur großen Geschenkbox: Vergleiche die Formate und entscheide, welchen Moment du schaffen möchtest.',
      items: [
        ['Digitaler Versand per E-Mail', 'Sofort oder geplant', 'Ideal für eine persönliche Geste'],
        ['Eine Überraschung passend zu den Interessen', 'Personalisierte physische Geschenkbox', 'Ideal für ein unkompliziertes Geschenk'],
        ['Mehrere personalisierte Überraschungen', 'Große Box und magische Karte', 'Ideal für einen unvergesslichen Moment']
      ],
      trust: 'Sichere Zahlung mit Stripe · Boxen innerhalb von 7 Werktagen vorbereitet · Sendungsverfolgung per E-Mail'
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    #gifts .plans{align-items:stretch}
    #gifts .product-card{display:flex;flex-direction:column}
    #gifts .product-card>.btn{margin-top:auto}
    .product-points{list-style:none;padding:0;margin:18px 0 24px;text-align:left;display:grid;gap:10px}
    .product-points li{position:relative;padding-left:25px;color:#f7e9df;font-size:14px;line-height:1.45}
    .product-points li:before{content:'✓';position:absolute;left:0;color:#f6d37b;font-weight:900}
    .gift-trust{margin:24px auto 0;max-width:900px;padding:14px 18px;border:1px solid #f6d37b55;border-radius:16px;background:#fff8ea10;color:#f5e4c4;font-size:13px;line-height:1.55;text-align:center}
    @media(max-width:540px){#gifts .center>.lead{font-size:16px}.product-points{margin-top:14px}.gift-trust{text-align:left}}
  `;
  document.head.appendChild(style);

  function render() {
    const lang = document.getElementById('language')?.value || document.documentElement.lang || 'fr';
    const copy = COPY[lang] || COPY.en;
    const section = document.getElementById('gifts');
    if (!section) return;
    const title = section.querySelector('h1');
    const intro = section.querySelector('.lead');
    if (title) title.textContent = copy.title;
    if (intro) intro.textContent = copy.intro;
    section.querySelectorAll('.product-card').forEach((card, index) => {
      let list = card.querySelector('.product-points');
      if (!list) {
        list = document.createElement('ul');
        list.className = 'product-points';
        card.querySelector('.btn')?.before(list);
      }
      list.innerHTML = copy.items[index].map(item => `<li>${item}</li>`).join('');
    });
    let trust = section.querySelector('.gift-trust');
    if (!trust) {
      trust = document.createElement('div');
      trust.className = 'gift-trust';
      section.querySelector('.plans')?.after(trust);
    }
    trust.textContent = copy.trust;
  }

  render();
  document.getElementById('language')?.addEventListener('change', () => setTimeout(render));
})();
