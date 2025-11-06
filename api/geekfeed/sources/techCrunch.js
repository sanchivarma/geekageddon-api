import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "techcrunch";
const SOURCE_NAME = "TechCrunch";
const SOURCE_URL = "https://techcrunch.com";
const FEED_URL = "https://techcrunch.com/feed/";

export const fetchTechCrunch = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["techcrunch", "startups", "venture"],
    defaultBadges: ["TechCrunch"],
  });