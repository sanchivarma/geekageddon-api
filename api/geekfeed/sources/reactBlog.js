import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "react-blog";
const SOURCE_NAME = "React Blog";
const SOURCE_URL = "https://react.dev/blog";
const FEED_URL = "https://react.dev/blog.atom";

export const fetchReactBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["react", "frontend"],
    defaultBadges: ["React"],
  });