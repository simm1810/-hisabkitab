export default async function handler(req, res) {
  const { data } = req.query;
  if (!data) return res.status(400).json({ error: "missing data" });
  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(data)}`);
    const text = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}