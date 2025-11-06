import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "cncf-blog";
const SOURCE_NAME = "CNCF Blog";
const SOURCE_URL = "https://www.cncf.io/blog";
const FEED_URL = "https://www.cncf.io/blog/feed/";

export const fetchCncfBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["cncf", "cloud", "opensource"],
    defaultBadges: ["CNCF"],
  });