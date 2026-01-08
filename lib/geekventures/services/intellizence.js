const BASE_URL = "https://api.intellizence.com/api/v2/dataset";

const mapIntellizenceEntry = (entry = {}, source) => ({
  source,
  name: entry.company_name ?? entry.target_company ?? entry.organization ?? "",
  description: entry.description ?? entry.summary ?? "",
  website: entry.website ?? entry.url ?? "",
  categories: Array.isArray(entry.categories) ? entry.categories.filter(Boolean) : [],
  yearFounded: entry.founded_year ?? entry.year ?? undefined,
  funding: entry.funding_amount ? { amountUsd: entry.funding_amount, round: entry.funding_round } : undefined,
  investors: entry.investors ?? [],
  location: entry.location ?? entry.country ?? "",
  stage: entry.stage ?? "",
  signalScore: entry.score ?? undefined,
  raw: entry,
});

export async function fetchIntellizence({ dataset, limit = 50, apiKey = process.env.INTELLIZENCE_API_KEY } = {}) {
  if (!dataset) return { success: false, items: [], error: "Missing dataset" };
  if (!apiKey) return { success: false, items: [], error: "Missing INTELLIZENCE_API_KEY" };
  const url = `${BASE_URL}/${dataset}?limit=${encodeURIComponent(limit)}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "User-Agent": "geekventures",
      },
    });
    if (!res.ok) throw new Error(`Intellizence fetch failed (${res.status})`);
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    const items = list.slice(0, limit).map((entry) => mapIntellizenceEntry(entry, `intellizence_${dataset}`));
    return { success: true, items };
  } catch (error) {
    return { success: false, items: [], error: error.message };
  }
}
