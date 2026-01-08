import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "chromium-blog";
const SOURCE_NAME = "Chromium Blog";
const SOURCE_URL = "https://blog.chromium.org";
const FEED_URL = "https://blog.chromium.org/feeds/posts/default";

export const fetchChromiumBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["chromium", "browser"],
    defaultBadges: ["Chromium"],
  });