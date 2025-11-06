import { fetchJson } from "../utils/http.js";
import { normalizeItem } from "../utils/normalize.js";

const SOURCE_ID = "hacker-news-search";
const SOURCE_NAME = "Hacker News (Algolia)";
const SOURCE_URL = "https://hn.algolia.com";
const ENDPOINT = "https://hn.algolia.com/api/v1/search_by_date";

const DEFAULT_QUERY = "technology";

export async function fetchHackerNewsSearch(limit = 10) {
  const { data } = await fetchJson(ENDPOINT, {
    query: {
      tags: "story",
      query: DEFAULT_QUERY,
      hitsPerPage: Math.max(limit, 20),
      numericFilters: "points>10",
    },
  });
  const hits = Array.isArray(data?.hits) ? data.hits : [];
  return hits.slice(0, limit).map((hit, index) => {
    const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
    const summary = hit.story_text || hit.comment_text || hit.title || null;
    return normalizeItem({
      sourceId: SOURCE_ID,
      sourceName: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      sourceType: "news-api",
      id: hit.objectID,
      url,
      title: hit.title ?? hit.story_title ?? null,
      summary,
      publishedAt: hit.created_at ?? null,
      categories: [hit._tags?.includes("show_hn") ? "Show HN" : null].filter(Boolean),
      tags: hit._tags?.filter((tag) => tag && !tag.startsWith("author_")) ?? [],
      badges: [hit.points != null ? `${hit.points} points` : null, hit.num_comments != null ? `${hit.num_comments} comments` : null].filter(Boolean),
      language: "en",
      score: hit.points ?? null,
      extras: {
        author: hit.author ?? null,
        commentCount: hit.num_comments ?? null,
        position: index,
      },
      raw: hit,
    });
  });
}