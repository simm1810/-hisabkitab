export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const data = req.query.data;
  if (!data) return res.status(400).json({ elements: [] });

  const servers = [
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass-api.de/api/interpreter'
  ];

  for (const server of servers) {
    try {
      const url = `${server}?data=${encodeURIComponent(data)}`;
      const r = await fetch(url, { headers: { 'User-Agent': 'hisabkitab' } });
      const text = await r.text();
      if (text.trim().startsWith('{')) {
        return res.status(200).send(text);
      }
      console.log(`${server} returned non-json:`, text.slice(0,100));
    } catch (e) {
      console.log(`Failed ${server}`, e.message);
    }
  }
  return res.status(200).json({ elements: [] });
}