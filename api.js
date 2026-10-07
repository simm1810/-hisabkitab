export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "missing q" });
  
  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
    const data = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}