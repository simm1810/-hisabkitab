export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { data } = req.query;
  if (!data) return res.status(200).json({ elements: [] });
  
  try {
    // kumi server - ye CORS support karta hai
    const response = await fetch(`https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(data)}`);
    const text = await response.text();
    return res.status(200).send(text);
  } catch (e) {
    return res.status(200).json({ elements: [] });
  }
}