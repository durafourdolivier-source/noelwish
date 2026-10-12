(() => {
  const MAX_TEXT = 80;
  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const secretPattern = /\b(?:cs_|sk_|pk_|whsec_)[A-Za-z0-9_-]+\b/g;

  function randomId(prefix) {
    try {
      return `${prefix}_${crypto.randomUUID()}`;
    } catch {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  function storedId(storage, key, prefix) {
    try {
      let value = storage.getItem(key);
      if (!value) {
        value = randomId(prefix);
        storage.setItem(key, value);
      }
      return value;
    } catch {
      return randomId(prefix);
    }
  }

  const wasReturning = localStorage.getItem('noelwish_seen') === '1';
  const visitorId = storedId(localStorage, 'noelwish_visitor_id', 'nwv');
  const sessionId = storedId(sessionStorage, 'noelwish_session_id', 'nws');
  const sessionStartedAt = Date.now();
  let sequence = 0;

  function cleanValue(value) {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.slice(0, 10).map(cleanValue).filter(value => value !== undefined);
    const text = String(value)
      .replace(emailPattern, '[email]')
      .replace(secretPattern, '[secret]')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, MAX_TEXT) || undefined;
  }

  function sanitize(properties = {}) {
    const result = {};
    Object.entries(properties).slice(0, 25).forEach(([key, value]) => {
      const cleaned = cleanValue(value);
      if (cleaned !== undefined) result[key.slice(0, 40)] = cleaned;
    });
    return result;
  }

  function pageType() {
    const path = location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.includes('/success')) return 'order_success';
    if (/^\/(fr|en|es|pt|de)\//.test(path)) return 'seo_landing';
    if (path.includes('/admin')) return 'admin';
    if (path.includes('mentions-legales') || path.includes('confidentialite') || path.includes('cgv')) return 'legal';
    return 'other';
  }

  function attribution() {
    const query = new URLSearchParams(location.search);
    const current = {
      source: query.get('utm_source'),
      medium: query.get('utm_medium'),
      campaign: query.get('utm_campaign'),
      content: query.get('utm_content'),
      term: query.get('utm_term'),
      gclid: query.get('gclid') ? 'present' : undefined,
      fbclid: query.get('fbclid') ? 'present' : undefined
    };
    try {
      const hasCampaign = Object.values(current).some(Boolean);
      if (hasCampaign) localStorage.setItem('noelwish_attribution', JSON.stringify(current));
      return hasCampaign ? current : JSON.parse(localStorage.getItem('noelwish_attribution') || '{}');
    } catch {
      return current;
    }
  }

  function context() {
    const connection = navigator.connection || {};
    return sanitize({
      visitor_id: visitorId,
      session_id: sessionId,
      event_sequence: ++sequence,
      page_type: pageType(),
      page_path: location.pathname,
      page_hash: location.hash.replace('#', '') || undefined,
      page_language: document.documentElement.lang,
      market: window.NOELWISH_MARKET || localStorage.getItem('noelwish_market'),
      currency: window.NOELWISH_CURRENCY || localStorage.getItem('noelwish_currency'),
      device_type: innerWidth < 600 ? 'mobile' : innerWidth < 1024 ? 'tablet' : 'desktop',
      viewport: `${innerWidth}x${innerHeight}`,
      referrer_host: document.referrer ? (() => { try { return new URL(document.referrer).hostname; } catch { return 'unknown'; } })() : 'direct',
      connection: connection.effectiveType,
      returning_visitor: wasReturning,
      ...attribution()
    });
  }

  function track(name, properties = {}) {
    const eventName = String(name || 'unknown_event').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
    const payload = {...context(), ...sanitize(properties)};
    try {
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
      window.va('event', eventName, payload);
    } catch {}
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({event: eventName, ...payload});
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent('noelwish:analytics', {detail: {event: eventName, properties: payload}}));
    } catch {}
  }

  window.noelwishTrack = track;
  localStorage.setItem('noelwish_seen', '1');

  const initial = () => {
    track('page_view_enhanced', {
      title: document.title,
      seo_product: document.body.dataset.product,
      landing_path: location.pathname
    });

    if (pageType() === 'seo_landing') {
      track('seo_landing_view', {
        seo_product: document.body.dataset.product,
        seo_language: document.documentElement.lang
      });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initial, {once: true});
  else initial();

  const reached = new Set();
  function trackScroll() {
    const available = document.documentElement.scrollHeight - innerHeight;
    if (available <= 0) return;
    const depth = Math.round((scrollY / available) * 100);
    [25, 50, 75, 90].forEach(mark => {
      if (depth >= mark && !reached.has(mark)) {
        reached.add(mark);
        track('scroll_depth', {percent: mark});
      }
    });
  }
  addEventListener('scroll', trackScroll, {passive: true});

  [10, 30, 60, 120].forEach(seconds => setTimeout(() => {
    if (document.visibilityState === 'visible') track('engaged_time', {seconds});
  }, seconds * 1000));

  document.addEventListener('click', event => {
    const target = event.target.closest('a,button');
    if (!target) return;
    const href = target instanceof HTMLAnchorElement ? target.href : undefined;
    let destination = 'button';
    if (href) {
      try { destination = new URL(href).origin === location.origin ? 'internal' : 'outbound'; } catch { destination = 'unknown'; }
    }
    track('interaction_click', {
      element: target.tagName.toLowerCase(),
      label: target.dataset.analyticsLabel || target.dataset.i || target.dataset.h || target.dataset.f || target.dataset.seo || target.textContent,
      destination,
      target_path: href ? (() => { try { return new URL(href).pathname + new URL(href).hash; } catch { return undefined; } })() : undefined,
      section: target.closest('section')?.id,
      product: target.dataset.product
    });
  });

  addEventListener('error', event => track('client_error', {
    message: event.message,
    source_file: event.filename ? event.filename.split('/').pop() : undefined,
    line: event.lineno
  }));

  addEventListener('unhandledrejection', event => track('promise_error', {
    message: event.reason?.message || String(event.reason || 'unknown')
  }));

  addEventListener('pagehide', () => track('session_end', {
    duration_seconds: Math.round((Date.now() - sessionStartedAt) / 1000),
    max_scroll: reached.size ? Math.max(...reached) : 0
  }));
})();
