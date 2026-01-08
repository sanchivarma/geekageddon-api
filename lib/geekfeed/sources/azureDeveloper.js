import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "azure-developer-blog";
const SOURCE_NAME = "Azure Developer Blog";
const SOURCE_URL = "https://devblogs.microsoft.com/azure/";
const FEED_URL = "https://devblogs.microsoft.com/azure/feed/";

export const fetchAzureDeveloperBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["azure", "microsoft"],
    defaultBadges: ["Azure"],
  });
