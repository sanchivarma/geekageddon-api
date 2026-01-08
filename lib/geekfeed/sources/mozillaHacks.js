import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "mozilla-hacks";
const SOURCE_NAME = "Mozilla Hacks";
const SOURCE_URL = "https://hacks.mozilla.org";
const FEED_URL = "https://hacks.mozilla.org/feed/";

export const fetchMozillaHacks = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["mozilla", "firefox"],
    defaultBadges: ["Mozilla"],
  });
