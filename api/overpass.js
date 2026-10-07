export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const { data } = req.query;
  if (!data) return res.status(400).json({ elements: [] });
  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(data)}`);
    const text = await response.text();
    res.status(200).send(text);
  } catch (e) {
    res.status(200).json({ elements: [] });
  }
}