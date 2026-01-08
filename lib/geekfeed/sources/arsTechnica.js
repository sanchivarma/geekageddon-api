import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "ars-technica";
const SOURCE_NAME = "Ars Technica";
const SOURCE_URL = "https://arstechnica.com";
const FEED_URL = "https://arstechnica.com/feed/";

export const fetchArsTechnica = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["ars technica"],
    defaultBadges: ["Ars Technica"],
  });
