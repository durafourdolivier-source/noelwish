// Request-observed signals are evidence, not proof that a visitor is human.
function trafficDiagnostic(req, input) {
  const headers = req.headers || {};
  const ua = String(headers['user-agent'] || '');
  const automated = /bot\b|crawler|spider|headless|playwright|puppeteer|selenium|curl\/|python-requests/i.test(ua);
  const webdriver = input?.metadata?.automation_webdriver === true || input?.metadata?.automation_webdriver === 'true';
  const reasons = [];
  if (automated) reasons.push('automation_user_agent');
  if (webdriver) reasons.push('client_reports_webdriver');
  if (!ua) reasons.push('missing_user_agent');
  return {
    diagnostic_version: '1',
    traffic_class: automated || webdriver ? 'automation_probable' : 'unknown',
    traffic_reasons: reasons.join(',') || 'no_decisive_signal',
    // Keep only categories: no raw IP, full URL, or full user-agent stored.
    request_browser: /headless/i.test(ua) ? 'headless' : /Edg\//.test(ua) ? 'edge' : /Firefox\//.test(ua) ? 'firefox' : /Chrome\//.test(ua) ? 'chrome' : /Safari\//.test(ua) ? 'safari' : 'other',
    request_country: /^[A-Z]{2}$/.test(String(headers['x-vercel-ip-country'] || '')) ? headers['x-vercel-ip-country'] : null,
    request_fetch_site: ['same-origin','same-site','cross-site','none'].includes(headers['sec-fetch-site']) ? headers['sec-fetch-site'] : 'unavailable'
  };
}
module.exports = trafficDiagnostic;
