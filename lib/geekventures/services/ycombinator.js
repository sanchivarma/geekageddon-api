const YC_ALL_URL = "https://yc-oss.github.io/api/companies/all.json";
const YC_TOP_URL = "https://yc-oss.github.io/api/companies/top.json";
const YC_HIRING_URL = "https://yc-oss.github.io/api/companies/hiring.json";

const mapYcCompany = (entry = {}) => {
  const industries = Array.isArray(entry.industries) ? entry.industries.filter(Boolean) : [];
  const tags = Array.isArray(entry.tags) ? entry.tags.filter(Boolean) : [];
  const categories = Array.from(
    new Set([...industries, ...tags].map((c) => String(c).trim()).filter(Boolean))
  );
  const founders = Array.isArray(entry.founders) ? entry.founders.filter(Boolean) : [];
  return {
    source: "ycombinator",
    name: entry.name ?? "",
    description: entry.small_description ?? entry.long_description ?? "",
    website: entry.website ?? "",
    logo: entry.logo_url ?? "",
    categories,
    yearFounded: entry.year_founded ?? undefined,
    batch: entry.batch ?? "",
    status: entry.status ?? "",
    location: entry.region ?? entry.city ?? entry.country ?? "",
    hiring: Boolean(entry.isHiring),
    hiringUrl: entry.jobs_url ?? "",
    teamSize: entry.team_size ?? undefined,
    founders,
    socials: {
      linkedin: entry.linkedin_url ?? "",
      twitter: entry.twitter_url ?? "",
      crunchbase: entry.crunchbase_url ?? "",
      jobs: entry.jobs_url ?? "",
    },
    signalScore: entry.rank ?? undefined,
  };
};

async function fetchYcList(url, limit) {
  const res = await fetch(url, { headers: { "User-Agent": "geekventures" } });
  if (!res.ok) throw new Error(`YC fetch failed (${res.status})`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : [];
  return list.slice(0, limit).map(mapYcCompany);
}

export async function fetchYCombinator({ limit = 100, mode = "all" } = {}) {
  try {
    const url = mode === "top" ? YC_TOP_URL : mode === "hiring" ? YC_HIRING_URL : YC_ALL_URL;
    const items = await fetchYcList(url, limit);
    return { success: true, items };
  } catch (error) {
    return { success: false, items: [], error: error.message };
  }
}
