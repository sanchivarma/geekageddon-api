import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "nodejs-releases";
const SOURCE_NAME = "Node.js Blog";
const SOURCE_URL = "https://nodejs.org";
const FEED_URL = "https://nodejs.org/en/feed/blog.xml";

export const fetchNodeJsBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["nodejs", "releases"],
    defaultBadges: ["Node.js"],
  });