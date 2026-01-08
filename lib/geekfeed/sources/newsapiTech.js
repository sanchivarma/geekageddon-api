import { fetchJson } from "../utils/http.js";
import { normalizeItem } from "../utils/normalize.js";

const SOURCE_ID = "newsapi-tech";
const SOURCE_NAME = "NewsAPI Technology";
const SOURCE_URL = "https://newsapi.org";
const ENDPOINT = "https://newsapi.org/v2/top-headlines";

const buildError = () => {
  const error = new Error("Missing NEWSAPI_API_KEY environment variable");
  error.code = "MISSING_TOKEN";
  return error;
};

export async function fetchNewsApiTechnology(limit = 10) {
  const apiKey =
    process.env.NEWSAPI_API_KEY ||
    process.env.NEWS_API_KEY ||
    process.env.NEWS_API_TOKEN;

  if (!apiKey) throw buildError();

  const pageSize = Math.min(Math.max(limit * 2, limit), 100);
  const { data } = await fetchJson(ENDPOINT, {
    query: {
      category: "technology",
      language: "en",
      pageSize,
      page: 1,
    },
    headers: {
      "X-Api-Key": apiKey,
    },
  });

  const articles = Array.isArray(data?.articles) ? data.articles : [];
  return articles.slice(0, limit).map((article, index) =>
    normalizeItem({
      sourceId: SOURCE_ID,
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      sourceType: "news-api",
      id: article.url ?? article.title ?? index,
      url: article.url ?? null,
      title: article.title ?? null,
      summary: article.description ?? article.content ?? null,
      author: article.author ?? null,
      publishedAt: article.publishedAt ?? null,
      categories: [article.source?.name].filter(Boolean),
      tags: [],
      badges: [article.source?.name].filter(Boolean),
      imageUrl: article.urlToImage ?? null,
      language: "en",
      extras: {
        sourceName: article.source?.name ?? null,
        position: index,
      },
      raw: article,
    })
  );
}
