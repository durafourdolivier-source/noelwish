async function startCheckout(product, button, personalization = {}) {
  const original = button?.textContent || '';
  if (button) {
    button.disabled = true;
    button.textContent = ({fr:'Ouverture du paiement…',es:'Abriendo el pago…',pt:'Abrindo o pagamento…',de:'Zahlung wird geöffnet…'}[document.documentElement.lang] || 'Opening payment…');
  }
  try {
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, personalization, market: window.NOELWISH_MARKET || localStorage.getItem('noelwish_market') || 'FR', currency: window.NOELWISH_CURRENCY || localStorage.getItem('noelwish_currency') || 'eur' })
    });
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error(data.error || 'Checkout unavailable');
    window.location.assign(data.url);
  } catch (err) {
    alert(({fr:'Le paiement n’est pas encore configuré. Réessaie dans un instant.',es:'El pago aún no está disponible. Inténtalo de nuevo en un momento.',pt:'O pagamento ainda não está disponível. Tente novamente em instantes.',de:'Die Zahlung ist noch nicht verfügbar. Bitte versuche es gleich noch einmal.'}[document.documentElement.lang] || 'Payment is not configured yet. Please try again shortly.'));
    if (button) {
      button.disabled = false;
      button.textContent = original;
    }
  }
}

window.startCheckout = startCheckout;
