import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "typescript-blog";
const SOURCE_NAME = "TypeScript Blog";
const SOURCE_URL = "https://devblogs.microsoft.com/typescript";
const FEED_URL = "https://devblogs.microsoft.com/typescript/feed/";

export const fetchTypeScriptBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["typescript", "microsoft"],
    defaultBadges: ["TypeScript"],
  });