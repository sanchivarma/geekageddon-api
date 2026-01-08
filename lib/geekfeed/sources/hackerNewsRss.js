import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "hacker-news-rss";
const SOURCE_NAME = "Hacker News RSS";
const SOURCE_URL = "https://news.ycombinator.com";
const FEED_URL = "https://hnrss.org/frontpage";

export const fetchHackerNewsRss = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["hacker news", "frontpage"],
    defaultBadges: ["Hacker News"],
  });