async function startCheckout(product, button, personalization = {}) {
  const original = button?.textContent || '';
  if (button) {
    button.disabled = true;
    button.textContent = document.documentElement.lang === 'en' ? 'Opening payment…' : 'Ouverture du paiement…';
  }
  try {
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, personalization })
    });
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error(data.error || 'Checkout unavailable');
    window.location.assign(data.url);
  } catch (err) {
    alert(document.documentElement.lang === 'en'
      ? 'Payment is not configured yet. Please try again shortly.'
      : 'Le paiement n’est pas encore configuré. Réessaie dans un instant.');
    if (button) {
      button.disabled = false;
      button.textContent = original;
    }
  }
}

window.startCheckout = startCheckout;
