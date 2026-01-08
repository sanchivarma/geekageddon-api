import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "webkit-blog";
const SOURCE_NAME = "WebKit Blog";
const SOURCE_URL = "https://webkit.org/blog/";
const FEED_URL = "https://webkit.org/feed/";

export const fetchWebkitBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["webkit", "apple"],
    defaultBadges: ["WebKit"],
  });
