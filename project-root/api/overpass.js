export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const data = req.query.data;
  if (!data) return res.status(400).json({ elements: [] });
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(data)}`
    });
    const text = await r.text();
    return res.status(200).send(text);
  } catch (e) {
    return res.status(500).json({ elements: [] });
  }
}