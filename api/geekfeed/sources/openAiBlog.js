import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "openai-blog";
const SOURCE_NAME = "OpenAI Blog";
const SOURCE_URL = "https://openai.com/blog";
const FEED_URL = "https://openai.com/blog/rss/";

export const fetchOpenAiBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["openai", "ai"],
    defaultBadges: ["OpenAI"],
  });