export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { data } = req.query;
  if (!data) return res.status(400).json({ elements: [] });

  try {
    const overpassRes = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(data)}`);
    const text = await overpassRes.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(text);
  } catch (e) {
    return res.status(500).json({ elements: [] });
  }
}