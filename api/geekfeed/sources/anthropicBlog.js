import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "anthropic-blog";
const SOURCE_NAME = "Anthropic Blog";
const SOURCE_URL = "https://www.anthropic.com";
const FEED_URL = "https://www.anthropic.com/index.xml";

export const fetchAnthropicBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["anthropic", "ai"],
    defaultBadges: ["Anthropic"],
  });