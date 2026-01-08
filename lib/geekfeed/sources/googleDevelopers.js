import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "google-developers";
const SOURCE_NAME = "Google Developers Blog";
const SOURCE_URL = "https://developers.googleblog.com";
const FEED_URL = "https://developers.googleblog.com/feeds/posts/default";

export const fetchGoogleDevelopersBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["google", "developers"],
    defaultBadges: ["Google"],
  });