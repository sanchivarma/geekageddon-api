import { fetchRssSource } from "../utils/rssSource.js";

const SOURCE_ID = "aws-compute-blog";
const SOURCE_NAME = "AWS Compute Blog";
const SOURCE_URL = "https://aws.amazon.com/blogs/compute/";
const FEED_URL = "https://aws.amazon.com/blogs/compute/feed/";

export const fetchAwsComputeBlog = (limit = 10) =>
  fetchRssSource({
    sourceId: SOURCE_ID,
    sourceName: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    feedUrl: FEED_URL,
    limit,
    language: "en",
    defaultTags: ["aws", "cloud"],
    defaultBadges: ["AWS"],
  });
