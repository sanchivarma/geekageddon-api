import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "gcp-developer-blog";
const SOURCE_NAME = "Google Cloud Developers";
const SOURCE_URL = "https://cloud.google.com/blog/topics/developers-practitioners";
const FEED_URL = "https://cloud.google.com/blog/topics/developers-practitioners/feed";

export const fetchGcpDeveloperBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["google cloud", "gcp"],
    defaultBadges: ["Google Cloud"],
  });
