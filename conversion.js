(() => {
  const STORAGE_KEY = 'noelwish_incomplete_surprise';
  const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  const copy = {
    fr:{secure:'Paiement sécurisé',catalogNote:'Choisissez votre attention puis personnalisez-la en quelques étapes.',personal:'Créé pour cette personne',languages:'Disponible en 5 langues',support:'Aide par e-mail',title:'Ce que vous offrez',letter:'Une lettre illustrée, signée par le Père Noël et envoyée au moment choisi.',surprise:'Une surprise choisie selon ses goûts, avec votre petit mot.',box:'Plusieurs attentions personnalisées réunies dans un grand coffret.',resume:'Votre surprise vous attend',resumeText:'Reprenez la personnalisation là où vous l’avez laissée.',resumeCta:'Reprendre',dismiss:'Fermer'},
    en:{secure:'Secure payment',catalogNote:'Choose your gift, then personalize it in a few simple steps.',personal:'Made for this person',languages:'Available in 5 languages',support:'Email support',title:'What you are giving',letter:'An illustrated letter signed by Santa and sent at the time you choose.',surprise:'A surprise selected around their interests, with your personal note.',box:'Several personalized treats brought together in one generous box.',resume:'Your surprise is waiting',resumeText:'Continue the personalization you started.',resumeCta:'Continue',dismiss:'Close'},
    es:{secure:'Pago seguro',catalogNote:'Elige tu detalle y personalízalo en unos sencillos pasos.',personal:'Creado para esa persona',languages:'Disponible en 5 idiomas',support:'Ayuda por email',title:'Lo que vas a regalar',letter:'Una carta ilustrada, firmada por Papá Noel y enviada cuando tú elijas.',surprise:'Una sorpresa elegida según sus gustos, con tu mensaje personal.',box:'Varios detalles personalizados reunidos en una gran caja.',resume:'Tu sorpresa te espera',resumeText:'Continúa la personalización que empezaste.',resumeCta:'Continuar',dismiss:'Cerrar'},
    pt:{secure:'Pagamento seguro',catalogNote:'Escolha seu presente e personalize em poucas etapas.',personal:'Feito para essa pessoa',languages:'Disponível em 5 idiomas',support:'Ajuda por email',title:'O que você vai oferecer',letter:'Uma carta ilustrada, assinada pelo Papai Noel e enviada no momento escolhido.',surprise:'Uma surpresa escolhida conforme os gostos, com sua mensagem.',box:'Vários presentes personalizados reunidos em uma grande caixa.',resume:'Sua surpresa está esperando',resumeText:'Continue a personalização que você começou.',resumeCta:'Continuar',dismiss:'Fechar'},
    de:{secure:'Sichere Zahlung',catalogNote:'Wähle deine Aufmerksamkeit und personalisiere sie in wenigen Schritten.',personal:'Für diese Person gemacht',languages:'In 5 Sprachen verfügbar',support:'Hilfe per E-Mail',title:'Was du verschenkst',letter:'Ein illustrierter, vom Weihnachtsmann signierter Brief zum gewählten Zeitpunkt.',surprise:'Eine Überraschung passend zu den Interessen, mit deiner Nachricht.',box:'Mehrere persönliche Aufmerksamkeiten in einer großen Geschenkbox.',resume:'Deine Überraschung wartet',resumeText:'Setze deine begonnene Personalisierung fort.',resumeCta:'Fortsetzen',dismiss:'Schließen'}
  };

  const language = () => copy[document.documentElement.lang] ? document.documentElement.lang : 'en';
  const words = () => copy[language()];
  const safeRead = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!value || !['letter','surprise','big'].includes(value.product) || Date.now() - value.startedAt > MAX_AGE) return null;
      return value;
    } catch { return null; }
  };
  const save = product => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({product, startedAt:Date.now()})); } catch {}
  };
  const clear = () => { try { localStorage.removeItem(STORAGE_KEY); } catch {} };

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `.nw-trust{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:26px 0}.nw-trust div{display:flex;align-items:center;justify-content:center;gap:8px;min-height:58px;padding:12px;border:1px solid #f6d37b55;border-radius:16px;background:#fff8ea0d;color:#fff6e9;font-size:13px;font-weight:700;text-align:center}.nw-examples{margin-top:52px}.nw-example-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.nw-example{min-height:190px;display:flex;flex-direction:column}.nw-example .feature-icon{font-size:38px}.nw-example p{flex:1}.nw-recovery{position:fixed;left:50%;bottom:18px;z-index:80;width:min(620px,calc(100% - 28px));transform:translateX(-50%);display:flex;align-items:center;gap:16px;padding:16px 18px;border:1px solid #f6d37b;background:#fff9ec;color:#4f1119;border-radius:18px;box-shadow:0 18px 60px #1d000888}.nw-recovery-copy{flex:1}.nw-recovery strong{display:block;font-family:'Playfair Display',serif;font-size:19px}.nw-recovery p{margin:3px 0 0;font-size:13px;color:#725158}.nw-recovery .btn{padding:11px 17px}.nw-recovery-close{border:0;background:transparent;color:#6f4f54;font-size:21px;padding:6px}@media(max-width:760px){.nw-trust{grid-template-columns:1fr 1fr}.nw-example-grid{grid-template-columns:1fr}.nw-recovery{align-items:flex-start;flex-wrap:wrap}.nw-recovery-copy{min-width:190px}}@media(max-width:420px){.nw-trust{grid-template-columns:1fr}.nw-recovery .btn{width:100%}}`;
    document.head.appendChild(style);
  }

  function renderConversionBlocks() {
    const gifts = document.getElementById('gifts');
    const plans = gifts?.querySelector('.plans');
    if (!gifts || !plans || gifts.querySelector('.nw-trust')) return;
    const w = words();
    const catalogNote = gifts.querySelector('[data-i="coming"]');
    if (catalogNote) catalogNote.textContent = w.catalogNote;
    const trust = document.createElement('div');
    trust.className = 'nw-trust';
    trust.setAttribute('aria-label', w.secure);
    trust.innerHTML = `<div>🔒 ${w.secure}</div><div>✨ ${w.personal}</div><div>🌍 ${w.languages}</div><div>💌 ${w.support}</div>`;
    plans.before(trust);
    const examples = document.createElement('section');
    examples.className = 'nw-examples';
    examples.innerHTML = `<div class="center"><p class="eyebrow">NoelWish</p><h2>${w.title}</h2></div><div class="nw-example-grid"><article class="card nw-example"><div class="feature-icon">💌</div><h3>Magic Letter</h3><p>${w.letter}</p><button class="btn secondary" type="button" data-product="letter">${w.resumeCta} →</button></article><article class="card nw-example"><div class="feature-icon">🎀</div><h3>Santa Surprise</h3><p>${w.surprise}</p><button class="btn secondary" type="button" data-product="surprise">${w.resumeCta} →</button></article><article class="card nw-example"><div class="feature-icon">🎄</div><h3>Big Christmas Box</h3><p>${w.box}</p><button class="btn secondary" type="button" data-product="big">${w.resumeCta} →</button></article></div>`;
    plans.after(examples);
    examples.addEventListener('click', event => {
      const button = event.target.closest('[data-product]');
      if (!button) return;
      window.noelwishTrack?.('gift_example_selected', {product:button.dataset.product});
      window.startGiftFlow?.(button.dataset.product);
    });
    window.noelwishTrack?.('conversion_trust_rendered', {section:'gifts'});
  }

  function refreshNeutralWording() {
    const w = words();
    const catalogNote = document.querySelector('#gifts [data-i="coming"]');
    if (catalogNote) catalogNote.textContent = w.catalogNote;
    document.querySelectorAll('#gift-modal .notice').forEach(element => {
      if (/Stripe/i.test(element.textContent)) element.textContent = w.secure;
    });
  }

  function showRecovery() {
    const saved = safeRead();
    if (!saved || document.querySelector('.nw-recovery')) return;
    const w = words();
    const banner = document.createElement('aside');
    banner.className = 'nw-recovery';
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `<div class="nw-recovery-copy"><strong>${w.resume}</strong><p>${w.resumeText}</p></div><button class="btn" type="button">${w.resumeCta}</button><button class="nw-recovery-close" type="button" aria-label="${w.dismiss}">×</button>`;
    banner.querySelector('.btn').addEventListener('click', () => {
      window.noelwishTrack?.('personalization_resumed', {product:saved.product});
      location.hash = 'gifts';
      window.startGiftFlow?.(saved.product);
      banner.remove();
    });
    banner.querySelector('.nw-recovery-close').addEventListener('click', () => {
      window.noelwishTrack?.('personalization_recovery_dismissed', {product:saved.product});
      clear();
      banner.remove();
    });
    document.body.appendChild(banner);
    window.noelwishTrack?.('personalization_recovery_shown', {product:saved.product});
  }

  function installRecoveryTracking() {
    const original = window.startGiftFlow;
    if (typeof original !== 'function' || original.__recoveryWrapped) return;
    const wrapped = function(product, ...args) {
      if (['letter','surprise','big'].includes(product)) save(product);
      window.noelwishTrack?.('personalization_saved_locally', {product});
      return original.call(this, product, ...args);
    };
    wrapped.__recoveryWrapped = true;
    window.startGiftFlow = wrapped;
  }

  function init() {
    addStyles();
    installRecoveryTracking();
    renderConversionBlocks();
    refreshNeutralWording();
    const params = new URLSearchParams(location.search);
    if (params.get('checkout') === 'cancelled') {
      const productMap = {'magic-letter':'letter','santa-surprise':'surprise','big-christmas-box':'big'};
      const product = productMap[params.get('product')];
      if (product) save(product);
      window.noelwishTrack?.('checkout_cancelled', {product:params.get('product')});
    }
    setTimeout(showRecovery, 500);
    document.getElementById('language')?.addEventListener('change', () => setTimeout(() => {
      document.querySelector('.nw-trust')?.remove();
      document.querySelector('.nw-examples')?.remove();
      document.querySelector('.nw-recovery')?.remove();
      renderConversionBlocks();
      refreshNeutralWording();
      showRecovery();
    }, 0));
    document.addEventListener('click', () => setTimeout(refreshNeutralWording, 0));
    addEventListener('pagehide', () => {
      const unfinished = safeRead();
      if (unfinished) window.noelwishTrack?.('personalization_abandoned', {product:unfinished.product});
    });
  }

  window.noelwishClearRecovery = clear;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
