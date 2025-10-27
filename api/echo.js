export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const body = req.body || {};
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({ youSent: body });
}
