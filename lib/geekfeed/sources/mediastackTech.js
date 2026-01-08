import { fetchJson } from "../utils/http.js";
import { normalizeItem } from "../utils/normalize.js";

const SOURCE_ID = "mediastack-tech";
const SOURCE_NAME = "mediastack Technology";
const SOURCE_URL = "https://mediastack.com";
const ENDPOINT = "http://api.mediastack.com/v1/news";

const buildError = () => {
  const error = new Error("Missing MEDIASTACK_API_KEY environment variable");
  error.code = "MISSING_TOKEN";
  return error;
};

export async function fetchMediastackTech(limit = 10) {
  const apiKey =
    process.env.MEDIASTACK_API_KEY ||
    process.env.MEDIASTACK_ACCESS_KEY ||
    process.env.MEDIASTACK_KEY;

  if (!apiKey) throw buildError();

  const fetchLimit = Math.min(Math.max(limit * 2, limit), 100);
  const { data } = await fetchJson(ENDPOINT, {
    query: {
      access_key: apiKey,
      categories: "technology",
      languages: "en",
      limit: fetchLimit,
      sort: "published_desc",
    },
  });

  const articles = Array.isArray(data?.data) ? data.data : [];
  return articles.slice(0, limit).map((article, index) =>
    normalizeItem({
      sourceId: SOURCE_ID,
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      sourceType: "news-api",
      id: article.url ?? article.title ?? index,
      url: article.url ?? null,
      title: article.title ?? null,
      summary: article.description ?? article.snippet ?? null,
      author: article.author ?? null,
      publishedAt: article.published_at ?? null,
      categories: [article.category].filter(Boolean),
      tags: [],
      badges: [article.source].filter(Boolean),
      imageUrl: article.image ?? null,
      language: article.language ?? null,
      extras: {
        source: article.source ?? null,
        country: article.country ?? null,
        position: index,
      },
      raw: article,
    })
  );
}
