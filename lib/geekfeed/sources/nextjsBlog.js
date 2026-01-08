import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "nextjs-blog";
const SOURCE_NAME = "Next.js Blog";
const SOURCE_URL = "https://nextjs.org";
const FEED_URL = "https://nextjs.org/feed.xml";

export const fetchNextJsBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["nextjs", "vercel"],
    defaultBadges: ["Next.js"],
  });