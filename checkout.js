async function startCheckout(product, button, personalization = {}) {
  const original = button?.textContent || '';
  const market = window.NOELWISH_MARKET || localStorage.getItem('noelwish_market') || 'FR';
  const currency = window.NOELWISH_CURRENCY || localStorage.getItem('noelwish_currency') || 'eur';
  const language = document.documentElement.lang || 'fr';
  window.noelwishTrack?.('begin_checkout', {
    product,
    market,
    currency,
    language,
    delivery_mode: personalization.deliveryMode || (String(product).startsWith('donation-') ? 'donation' : 'physical'),
    has_sender: Boolean(personalization.sender),
    has_avoid_preferences: Boolean(personalization.avoid)
  });
  if (button) {
    button.disabled = true;
    button.textContent = ({fr:'Ouverture du paiement…',es:'Abriendo el pago…',pt:'Abrindo o pagamento…',de:'Zahlung wird geöffnet…'}[document.documentElement.lang] || 'Opening payment…');
  }
  try {
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, personalization, market, currency, language })
    });
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error(data.error || 'Checkout unavailable');
    window.noelwishTrack?.('checkout_created', {product, market, currency, language});
    window.location.assign(data.url);
  } catch (err) {
    window.noelwishTrack?.('checkout_error', {product, market, currency, language, error_type: err?.message || 'unknown'});
    alert(({fr:'Le paiement n’est pas encore configuré. Réessaie dans un instant.',es:'El pago aún no está disponible. Inténtalo de nuevo en un momento.',pt:'O pagamento ainda não está disponível. Tente novamente em instantes.',de:'Die Zahlung ist noch nicht verfügbar. Bitte versuche es gleich noch einmal.'}[document.documentElement.lang] || 'Payment is not configured yet. Please try again shortly.'));
    if (button) {
      button.disabled = false;
      button.textContent = original;
    }
  }
}

window.startCheckout = startCheckout;
