const MARKETS = new Set(['FR','US','GB','AU','CA','ES','DE','BR','PT']);

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const rawCountry = req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || '';
  const country = String(Array.isArray(rawCountry) ? rawCountry[0] : rawCountry).toUpperCase();
  const market = MARKETS.has(country) ? country : null;

  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', 'x-vercel-ip-country');
  return res.status(200).json({ country: country || null, market });
}
