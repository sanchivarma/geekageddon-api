import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "the-verge";
const SOURCE_NAME = "The Verge";
const SOURCE_URL = "https://www.theverge.com";
const FEED_URL = "https://www.theverge.com/rss/index.xml";

export const fetchTheVerge = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["the verge"],
    defaultBadges: ["The Verge"],
  });
