const LANGUAGES = new Set(['fr','en','es','pt','de']);

function decodeEntities(value = '') {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  const source = LANGUAGES.has(req.body?.source) ? req.body.source : 'fr';
  const target = LANGUAGES.has(req.body?.target) ? req.body.target : '';

  if (!text || text.length > 500 || !target) {
    return res.status(400).json({ error: 'Invalid translation request' });
  }
  if (source === target) return res.status(200).json({ translation: text });

  try {
    const url = new URL('https://api.mymemory.translated.net/get');
    url.searchParams.set('q', text);
    url.searchParams.set('langpair', `${source}|${target}`);

    const response = await fetch(url, {
      headers: { 'User-Agent': 'NoelWish/1.0 (magic@noelwish.com)' }
    });
    const data = await response.json();
    const translation = decodeEntities(data?.responseData?.translatedText || '');

    if (!response.ok || !translation) {
      return res.status(502).json({ error: 'Translation unavailable' });
    }
    return res.status(200).json({ translation });
  } catch {
    return res.status(502).json({ error: 'Translation unavailable' });
  }
}
