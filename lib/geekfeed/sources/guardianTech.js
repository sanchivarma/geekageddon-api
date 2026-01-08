import { fetchJson } from "../utils/http.js";
import { normalizeItem } from "../utils/normalize.js";

const SOURCE_ID = "guardian-tech";
const SOURCE_NAME = "The Guardian Tech";
const SOURCE_URL = "https://www.theguardian.com/uk/technology";
const ENDPOINT = "https://content.guardianapis.com/technology";

const buildError = () => {
  const error = new Error("Missing GUARDIAN_API_KEY environment variable");
  error.code = "MISSING_TOKEN";
  return error;
};

export async function fetchGuardianTech(limit = 10) {
  const apiKey =
    process.env.GUARDIAN_API_KEY ||
    process.env.GUARDIAN_CONTENT_API_KEY ||
    process.env.GUARDIAN_KEY;

  if (!apiKey) throw buildError();

  const pageSize = Math.min(Math.max(limit * 2, limit), 50);
  const { data } = await fetchJson(ENDPOINT, {
    query: {
      "api-key": apiKey,
      "page-size": pageSize,
      "order-by": "newest",
      "show-fields": "trailText,standfirst,bodyText,thumbnail,byline",
    },
  });

  const results = Array.isArray(data?.response?.results) ? data.response.results : [];
  return results.slice(0, limit).map((item, index) => {
    const fields = item.fields ?? {};
    const summary = fields.trailText || fields.standfirst || fields.bodyText || null;
    return normalizeItem({
      sourceId: SOURCE_ID,
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      sourceType: "news-api",
      id: item.id ?? item.webUrl ?? null,
      url: item.webUrl ?? null,
      title: item.webTitle ?? null,
      summary,
      rawSummary: fields.bodyText ?? null,
      author: fields.byline ?? null,
      publishedAt: item.webPublicationDate ?? null,
      categories: [item.sectionName, item.pillarName].filter(Boolean),
      tags: [item.sectionId, item.type].filter(Boolean),
      badges: ["The Guardian"],
      imageUrl: fields.thumbnail ?? null,
      language: data?.response?.edition?.edition ?? "en",
      extras: {
        apiUrl: item.apiUrl ?? null,
        position: index,
      },
      raw: item,
    });
  });
}
