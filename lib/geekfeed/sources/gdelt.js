import { fetchJson } from "../utils/http.js";
import { normalizeItem } from "../utils/normalize.js";

const SOURCE_ID = "gdelt";
const SOURCE_NAME = "GDELT 2.0";
const SOURCE_URL = "https://www.gdeltproject.org";
const ENDPOINT = "https://api.gdeltproject.org/api/v2/doc/doc";

const DEFAULT_QUERY = 'technology OR tech OR "artificial intelligence" OR "software"';

export async function fetchGdeltTechNews(limit = 10) {
  const { data } = await fetchJson(ENDPOINT, {
    query: {
      query: DEFAULT_QUERY,
      mode: "artlist",
      format: "json",
      maxrecords: Math.max(limit, 10),
      sort: "datedesc",
    },
  });
  const articles = Array.isArray(data?.articles) ? data.articles : [];
  return articles.slice(0, limit).map((article, index) => {
    const summary =
      article.excerpt ||
      article.semantics ||
      article.transcontent ||
      article.source ||
      article.title ||
      null;
    return normalizeItem({
      sourceId: SOURCE_ID,
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      sourceType: "news-api",
      id: article.documentidentifier || article.url || null,
      url: article.url || article.sourceurl || null,
      title: article.title ?? null,
      summary,
      publishedAt: article.seendate ?? article.date ?? null,
      categories: [article.domain, article.sourcecountry, article.language].filter(Boolean),
      tags: article.taxonomy ? [article.taxonomy] : [],
      badges: [article.language, article.sourcecountry].filter(Boolean),
      imageUrl: article.socialimage || null,
      language: article.language ?? null,
      score: article.socialshares ?? null,
      extras: {
        domain: article.domain ?? null,
        sourceUrl: article.sourceurl ?? null,
        relevance: article.relevance ?? null,
        position: index,
      },
      raw: article,
    });
  });
}