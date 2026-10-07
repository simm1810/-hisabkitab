export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { data } = req.query;
  if (!data) return res.status(200).json({ elements: [] });

  const servers = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.openstreetmap.ru/api/interpreter'
  ];

  for (const s of servers) {
    try {
      const r = await fetch(`${s}?data=${encodeURIComponent(data)}`);
      const t = await r.text();
      if (t.trim().startsWith('{')) return res.status(200).send(t);
    } catch {}
  }
  return res.status(200).json({ elements: [] });
}