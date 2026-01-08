import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "meta-ai-blog";
const SOURCE_NAME = "Meta AI Blog";
const SOURCE_URL = "https://ai.meta.com/blog";
const FEED_URL = "https://ai.meta.com/blog/feed";

export const fetchMetaAiBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["meta", "ai"],
    defaultBadges: ["Meta AI"],
  });